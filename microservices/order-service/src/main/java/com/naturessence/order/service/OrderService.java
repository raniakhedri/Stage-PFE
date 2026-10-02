package com.naturessence.order.service;

import com.naturessence.shared.security.TenantGuard;
import com.naturessence.shared.dto.request.OrderRequest;
import com.naturessence.shared.dto.response.OrderItemResponse;
import com.naturessence.shared.dto.response.OrderResponse;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.entity.OrderItem;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.OrderStatus;
import com.naturessence.shared.enums.PaymentMethod;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.ProductRepository;
import com.naturessence.shared.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ShopRepository shopRepository;
    private final CouponService couponService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;
    private final CheckoutPricingService pricingService;
    private final StripeService stripeService;
    private final LoyaltyService loyaltyService;

    /**
     * Saves an order from a cart. Prices, stock, coupon, shipping and TVA are recomputed on the server
     * ({@link CheckoutPricingService}); for card payments the Stripe payment is checked first, and it is
     * refunded if the order cannot be completed (for instance the last item was sold in the meantime).
     *
     * @param signedInUser customer resolved from the JWT, or null for a guest checkout
     */
    @Transactional
    public OrderResponse createOrder(OrderRequest req, User signedInUser) {
        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(req.getPaymentMethod());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Mode de paiement invalide: " + req.getPaymentMethod());
        }

        Long userId = signedInUser != null ? signedInUser.getId() : null;
        CheckoutPricingService.Quote quote = pricingService.quote(req, userId);

        String paymentIntentId = null;
        if (paymentMethod == PaymentMethod.CARTE) {
            paymentIntentId = req.getPaymentIntentId();
            if (paymentIntentId != null && orderRepository.existsByPaymentIntentId(paymentIntentId)) {
                throw new IllegalArgumentException("Ce paiement a déjà été utilisé pour une commande.");
            }
            stripeService.requireSucceeded(paymentIntentId, quote.amountInCents());
        }

        try {
            return saveOrder(req, quote, paymentMethod, paymentIntentId, signedInUser);
        } catch (RuntimeException e) {
            if (paymentIntentId != null) stripeService.refundQuietly(paymentIntentId);
            if (e instanceof IllegalArgumentException && paymentIntentId != null) {
                throw new IllegalArgumentException(e.getMessage() + " Votre paiement a été remboursé.");
            }
            throw e;
        }
    }

    private OrderResponse saveOrder(OrderRequest req, CheckoutPricingService.Quote quote,
                                    PaymentMethod paymentMethod, String paymentIntentId, User user) {
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
            .shippingZoneName(quote.zone().getNom())
            .shippingCost(quote.shippingCost())
            .paymentMethod(paymentMethod)
            .paymentIntentId(paymentIntentId)
            .tvaRate(quote.tvaRate())
            .status(OrderStatus.EN_ATTENTE)
            .shopId(quote.shopId())
            .user(user)
            .couponCode(quote.coupon() != null ? quote.coupon().getCode() : null)
            .couponDiscount(quote.couponDiscount())
            .subtotal(quote.subtotal())
            .tvaAmount(quote.tvaAmount())
            .total(quote.total())
            .build();

        for (CheckoutPricingService.Line line : quote.lines()) {
            // Atomic: fails if another customer bought the last units meanwhile.
            if (productRepository.decrementStockIfAvailable(line.product().getId(), line.quantity()) == 0) {
                throw new IllegalArgumentException("« " + line.product().getNom() + " » vient d'être épuisé.");
            }
            order.getItems().add(OrderItem.builder()
                .order(order)
                .productId(line.product().getId())
                .productName(line.product().getNom())
                .productSlug(line.product().getSlug())
                .color(line.request().getColor())
                .size(line.request().getSize())
                .image(line.request().getImage())
                .unitPrice(line.unitPrice())
                .quantity(line.quantity())
                .lineTotal(line.total())
                .build());
        }

        Order saved = orderRepository.save(order);

        if (quote.coupon() != null) {
            couponService.useCoupon(quote.coupon().getId(), user != null ? user.getId() : null,
                quote.subtotal() - quote.couponDiscount());
        }

        // Confirmation e-mail with invoice (async — does not block the response)
        emailService.sendOrderConfirmation(saved);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        return orderRepository
            .findAllByOrderByCreatedAtDesc()
            .stream()
            .filter(order -> shopId == null || shopId.equals(order.getShopId()))
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository
            .findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByEmail(String email) {
        return orderRepository
            .findByEmailOrderByCreatedAtDesc(email)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForAuthenticatedUser(User user) {
        // Guest orders placed with the same e-mail count too, but only those of the customer's own shop:
        // the same address can belong to customers of other shops.
        LinkedHashMap<Long, OrderResponse> merged = new LinkedHashMap<>();
        orderRepository
            .findByEmailOrderByCreatedAtDesc(user.getEmail())
            .stream()
            .filter(o -> java.util.Objects.equals(o.getShopId(), user.getShopId()))
            .map(this::mapToResponse)
            .forEach(o -> merged.put(o.getId(), o));
        getOrdersByUserId(user.getId()).forEach(o -> merged.put(o.getId(), o));
        return merged
            .values()
            .stream()
            .sorted(
                Comparator.comparing(
                    OrderResponse::getCreatedAt,
                    Comparator.nullsLast(Comparator.reverseOrder())
                )
            )
            .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository
            .findById(id)
            .orElseThrow(() ->
                new IllegalArgumentException("Commande introuvable")
            );
        TenantGuard.assertOwned(order.getShopId(), shopRepository);
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByReference(String reference) {
        Order order = orderRepository
            .findByReference(reference)
            .orElseThrow(() ->
                new IllegalArgumentException("Commande introuvable")
            );
        TenantGuard.assertOwned(order.getShopId(), shopRepository);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, String statusStr) {
        Order order = orderRepository
            .findById(id)
            .orElseThrow(() ->
                new IllegalArgumentException("Commande introuvable")
            );
        TenantGuard.assertOwned(order.getShopId(), shopRepository);
        OrderStatus previousStatus = order.getStatus();
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Statut invalide: " + statusStr);
        }
        order.setStatus(newStatus);

        // Restore stock when an order is cancelled (only if it wasn't already cancelled)
        if (
            newStatus == OrderStatus.ANNULEE &&
            previousStatus != OrderStatus.ANNULEE
        ) {
            for (OrderItem item : order.getItems()) {
                if (item.getProductId() != null) {
                    productRepository
                        .findById(item.getProductId())
                        .ifPresent(product -> {
                            product.setStock(
                                product.getStock() + item.getQuantity()
                            );
                            productRepository.save(product);
                        });
                }
            }
        }

        // Record delivery timestamp
        if (
            newStatus == OrderStatus.LIVREE &&
            previousStatus != OrderStatus.LIVREE
        ) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        Order saved = orderRepository.save(order);

        // Loyalty: points when the order is delivered, taken back if it is later cancelled or refunded
        if (newStatus == OrderStatus.LIVREE && previousStatus != OrderStatus.LIVREE) {
            loyaltyService.awardPointsForDeliveredOrder(saved);
        } else if ((newStatus == OrderStatus.ANNULEE || newStatus == OrderStatus.REMBOURSEE)
                && previousStatus != newStatus) {
            loyaltyService.revokePointsForOrder(saved);
        }

        // Notify customer by email when order is delivered (only once)
        if (
            newStatus == OrderStatus.LIVREE &&
            previousStatus != OrderStatus.LIVREE
        ) {
            emailService.sendDeliveryNotification(saved);
        }

        return mapToResponse(saved);
    }

    // ── Helpers ──

    private Long shopIdOf(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase()).map(Shop::getId).orElse(-1L);
    }

    private String generateReference() {
        String ts = LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
        );
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "CMD-" + ts + "-" + rand;
    }

    private OrderResponse mapToResponse(Order o) {
        List<OrderItemResponse> items = (o.getItems() == null ? List.<OrderItem>of() : o.getItems())
            .stream()
            .map(i ->
                OrderItemResponse.builder()
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
                    .build()
            )
            .toList();

        return OrderResponse.builder()
            .id(o.getId())
            .reference(o.getReference())
            .userId(o.getUser() != null ? o.getUser().getId() : null)
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
            .paymentMethod(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : null)
            .status(o.getStatus() != null ? o.getStatus().name() : null)
            .items(items)
            .createdAt(o.getCreatedAt())
            .deliveredAt(o.getDeliveredAt())
            .build();
    }
}
