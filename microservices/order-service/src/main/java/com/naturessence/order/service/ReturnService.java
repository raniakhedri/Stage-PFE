package com.naturessence.order.service;

import com.naturessence.shared.entity.User;
import com.naturessence.shared.security.TenantGuard;
import com.naturessence.shared.dto.request.ReturnRequestDTO;
import com.naturessence.shared.dto.response.ReturnResponse;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.entity.OrderItem;
import com.naturessence.shared.entity.ReturnPolicy;
import com.naturessence.shared.entity.ReturnRequest;
import com.naturessence.shared.enums.ReturnStatus;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.ReturnPolicyRepository;
import com.naturessence.shared.repository.ReturnRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final ReturnPolicyRepository returnPolicyRepository;
    private final com.naturessence.shared.repository.ShopRepository shopRepository;

    @Transactional
    public ReturnResponse createReturn(User customer, ReturnRequestDTO dto) {
        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        // The order is the customer's: placed while signed in, or as a guest with their e-mail in the same shop.
        boolean ownsOrder = (order.getUser() != null && order.getUser().getId().equals(customer.getId()))
                || (order.getEmail() != null && order.getEmail().equalsIgnoreCase(customer.getEmail())
                    && java.util.Objects.equals(order.getShopId(), customer.getShopId()));
        if (!ownsOrder) {
            throw new RuntimeException("Cette commande ne vous appartient pas");
        }

        if (returnRequestRepository.existsByOrderIdAndOrderItemId(dto.getOrderId(), dto.getOrderItemId())) {
            throw new RuntimeException("Une demande de retour existe déjà pour cet article");
        }

        // Check return deadline against the policy set in the backoffice
        ReturnPolicy policy = returnPolicyRepository.findById(1L).orElse(null);
        int dureeJours = (policy != null && policy.getDureeJours() != null) ? policy.getDureeJours() : 30;
        LocalDateTime deliveredAt = order.getDeliveredAt();
        if (deliveredAt != null && deliveredAt.plusDays(dureeJours).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Le délai de retour de " + dureeJours + " jours est dépassé");
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(dto.getOrderItemId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Article introuvable dans la commande"));

        String ref = "RET-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + (new Random().nextInt(9000) + 1000);

        ReturnRequest rr = ReturnRequest.builder()
                .reference(ref)
                .order(order)
                .orderItemId(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .productImage(item.getImage())
                .amount(item.getLineTotal())
                .customerName(order.getFirstName() + " " + order.getLastName())
                .customerEmail(order.getEmail())
                .raison(dto.getRaison())
                .commentaire(dto.getCommentaire())
                .photo1(dto.getPhoto1())
                .photo2(dto.getPhoto2())
                .ibanClient(dto.getIbanClient())
                .status(ReturnStatus.EN_ATTENTE)
                .build();

        ReturnRequest saved = returnRequestRepository.save(rr);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> getAllReturns() {
        return returnRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> getMyReturns(Long userId) {
        return returnRequestRepository.findByOrderUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public ReturnResponse getReturnById(Long id) {
        ReturnRequest rr = returnRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de retour introuvable"));
        TenantGuard.assertOwned(rr.getOrder() != null ? rr.getOrder().getShopId() : null, shopRepository);
        return mapToResponse(rr);
    }

    @Transactional
    public ReturnResponse updateStatus(Long id, String newStatus, String motifRefus) {
        ReturnRequest rr = returnRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de retour introuvable"));
        TenantGuard.assertOwned(rr.getOrder() != null ? rr.getOrder().getShopId() : null, shopRepository);
        rr.setStatus(ReturnStatus.valueOf(newStatus));
        if (motifRefus != null && !motifRefus.isBlank()) {
            rr.setMotifRefus(motifRefus);
        }
        return mapToResponse(returnRequestRepository.save(rr));
    }

    private ReturnResponse mapToResponse(ReturnRequest rr) {
        return ReturnResponse.builder()
                .id(rr.getId())
                .reference(rr.getReference())
                .orderId(rr.getOrder() != null ? rr.getOrder().getId() : null)
                .orderReference(rr.getOrder() != null ? rr.getOrder().getReference() : null)
                .orderItemId(rr.getOrderItemId())
                .productId(rr.getProductId())
                .productName(rr.getProductName())
                .productImage(rr.getProductImage())
                .amount(rr.getAmount())
                .customerName(rr.getCustomerName())
                .customerEmail(rr.getCustomerEmail())
                .raison(rr.getRaison())
                .commentaire(rr.getCommentaire())
                .photo1(rr.getPhoto1())
                .photo2(rr.getPhoto2())
                .ibanClient(rr.getIbanClient())
                .status(rr.getStatus() != null ? rr.getStatus().name() : null)
                .motifRefus(rr.getMotifRefus())
                .createdAt(rr.getCreatedAt())
                .updatedAt(rr.getUpdatedAt())
                .build();
    }
}
