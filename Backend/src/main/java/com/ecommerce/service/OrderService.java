package com.ecommerce.service;

import com.ecommerce.dto.request.OrderItemRequest;
import com.ecommerce.dto.request.OrderRequest;
import com.ecommerce.dto.response.OrderItemResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ShippingZone;
import com.ecommerce.entity.TvaConfig;
import com.ecommerce.entity.Coupon;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentMethod;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ShippingZoneRepository;
import com.ecommerce.repository.TvaConfigRepository;
import com.ecommerce.repository.CouponRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ShippingZoneRepository shippingZoneRepository;
    private final TvaConfigRepository tvaConfigRepository;
    private final CouponRepository couponRepository;
    private final CouponService couponService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;
    private final LoyaltyService loyaltyService;

    @Transactional
    public OrderResponse createOrder(OrderRequest req) {
        // 1. Resolve shipping zone
        ShippingZone zone = shippingZoneRepository.findAllByOrderByIdAsc().stream()
                .filter(z -> z.getNom().equalsIgnoreCase(req.getShippingZoneName()) && "Ouverte".equals(z.getStatut()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Zone de livraison introuvable ou fermée: " + req.getShippingZoneName()));

        // 2. TVA config
        TvaConfig tvaConfig = tvaConfigRepository.findAll().stream().findFirst()
                .orElse(TvaConfig.builder().build());
        double tvaRate = (tvaConfig.getTvaActive() != null && tvaConfig.getTvaActive()) ? tvaConfig.getTauxDefaut()
                : 0.0;

        // Free shipping threshold (standardSeuil from admin config)
        Double standardSeuil = (tvaConfig.getStandardEnabled() != null && tvaConfig.getStandardEnabled())
                ? tvaConfig.getStandardSeuil() : null;

        // 3. Parse payment method
        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(req.getPaymentMethod());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Mode de paiement invalide: " + req.getPaymentMethod());
        }

        // 4. Build order
        Order order = Order.builder()
                .reference(generateReference())
                .email(req.getEmail().trim())
                .firstName(req.getFirstName().trim())
                .lastName(req.getLastName().trim())
                .phone(req.getPhone())
                .address(req.getAddress().trim())
                .city(req.getCity().trim())
                .postalCode(req.getPostalCode().trim())
                .gouvernorat(req.getGouvernorat())
                .shippingZoneName(zone.getNom())
                .shippingCost(zone.getCout())
                .paymentMethod(paymentMethod)
                .tvaRate(tvaRate)
                .status(OrderStatus.EN_ATTENTE)
                .build();

        // Link user if logged in
        if (req.getUserId() != null) {
            userRepository.findById(req.getUserId()).ifPresent(order::setUser);
        }

        // 5. Build order items
        double subtotal = 0.0;
        for (OrderItemRequest itemReq : req.getItems()) {
            double lineTotal = itemReq.getUnitPrice() * itemReq.getQuantity();
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(itemReq.getProductId())
                    .productName(itemReq.getProductName())
                    .productSlug(itemReq.getProductSlug())
                    .color(itemReq.getColor())
                    .size(itemReq.getSize())
                    .image(itemReq.getImage())
                    .unitPrice(itemReq.getUnitPrice())
                    .quantity(itemReq.getQuantity())
                    .lineTotal(lineTotal)
                    .build();
            order.getItems().add(item);
            subtotal += lineTotal;
        }

        // 6. Coupon discount (applied on subtotal, before shipping)
        double couponDiscount = 0.0;
        String couponCode = null;
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCode(req.getCouponCode().trim().toUpperCase())
                    .orElse(null);
            if (coupon != null && "actif".equals(coupon.getStatut())) {
                couponCode = coupon.getCode();
                if ("pourcentage".equals(coupon.getType())) {
                    couponDiscount = Math.round(subtotal * coupon.getValeur()) / 100.0;
                } else if ("fixe".equals(coupon.getType())) {
                    couponDiscount = Math.min(coupon.getValeur(), subtotal);
                }
            }
        }

        double subtotalAfterCoupon = subtotal - couponDiscount;

        // Record coupon usage after subtotalAfterCoupon is known
        if (couponCode != null) {
            Coupon coupon = couponRepository.findByCode(couponCode).orElse(null);
            if (coupon != null) {
                couponService.useCoupon(coupon.getId(), req.getUserId(), subtotalAfterCoupon);
            }
        }

        // Apply free shipping if subtotal meets the threshold
        double effectiveShippingCost = zone.getCout();
        if (standardSeuil != null && standardSeuil > 0 && subtotalAfterCoupon >= standardSeuil) {
            effectiveShippingCost = 0.0;
        }
        order.setShippingCost(effectiveShippingCost);

        // 7. Calculate totals (TVA is INCLUDED in selling price — prices are TTC)
        double tvaAmount = Math.round(subtotalAfterCoupon * tvaRate) / 100.0;
        double total = subtotalAfterCoupon + effectiveShippingCost; // TVA already in subtotal

        order.setCouponCode(couponCode);
        order.setCouponDiscount(couponDiscount);
        order.setSubtotal(subtotal);
        order.setTvaAmount(tvaAmount);
        order.setTotal(total);

        Order saved = orderRepository.save(order);

        // 8. Decrement stock for each ordered product
        for (OrderItem item : saved.getItems()) {
            if (item.getProductId() != null) {
                productRepository.findById(item.getProductId()).ifPresent(product -> {
                    int newStock = Math.max(0, product.getStock() - item.getQuantity());
                    product.setStock(newStock);
                    productRepository.save(product);
                });
            }
        }

        // 9. Send confirmation email with invoice (async — does not block response)
        emailService.sendOrderConfirmation(saved);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByEmail(String email) {
        return orderRepository.findByEmailOrderByCreatedAtDesc(email).stream()
                .map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByReference(String reference) {
        Order order = orderRepository.findByReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, String statusStr) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        OrderStatus previousStatus = order.getStatus();
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Statut invalide: " + statusStr);
        }
        order.setStatus(newStatus);

        // Restore stock when an order is cancelled (only if it wasn't already cancelled)
        if (newStatus == OrderStatus.ANNULEE && previousStatus != OrderStatus.ANNULEE) {
            for (OrderItem item : order.getItems()) {
                if (item.getProductId() != null) {
                    productRepository.findById(item.getProductId()).ifPresent(product -> {
                        product.setStock(product.getStock() + item.getQuantity());
                        productRepository.save(product);
                    });
                }
            }
        }

        // Award loyalty points when order is delivered (only once)
        if (newStatus == OrderStatus.LIVREE && previousStatus != OrderStatus.LIVREE && order.getUser() != null) {
            loyaltyService.awardPointsForOrder(order.getUser(), order.getTotal(), order.getId());
        }

        return mapToResponse(orderRepository.save(order));
    }

    // ── Helpers ──

    private String generateReference() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "CMD-" + ts + "-" + rand;
    }

    private OrderResponse mapToResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream().map(i -> OrderItemResponse.builder()
                .id(i.getId())
                .productId(i.getProductId())
                .productName(i.getProductName())
                .productSlug(i.getProductSlug())
                .color(i.getColor())
                .size(i.getSize())
                .image(i.getImage())
                .unitPrice(i.getUnitPrice())
                .quantity(i.getQuantity())
                .lineTotal(i.getLineTotal())
                .build()).toList();

        return OrderResponse.builder()
                .id(o.getId())
                .reference(o.getReference())
                .email(o.getEmail())
                .firstName(o.getFirstName())
                .lastName(o.getLastName())
                .phone(o.getPhone())
                .address(o.getAddress())
                .city(o.getCity())
                .postalCode(o.getPostalCode())
                .gouvernorat(o.getGouvernorat())
                .shippingZoneName(o.getShippingZoneName())
                .shippingCost(o.getShippingCost())
                .subtotal(o.getSubtotal())
                .tvaRate(o.getTvaRate())
                .tvaAmount(o.getTvaAmount())
                .total(o.getTotal())
                .couponCode(o.getCouponCode())
                .couponDiscount(o.getCouponDiscount())
                .paymentMethod(o.getPaymentMethod().name())
                .status(o.getStatus().name())
                .items(items)
                .createdAt(o.getCreatedAt())
                .build();
    }
}
