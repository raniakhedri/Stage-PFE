package com.naturessence.order.service;

import com.naturessence.shared.dto.request.OrderItemRequest;
import com.naturessence.shared.dto.request.OrderRequest;
import com.naturessence.shared.entity.Coupon;
import com.naturessence.shared.entity.Product;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.ShippingZone;
import com.naturessence.shared.entity.TvaConfig;
import com.naturessence.shared.repository.CouponRepository;
import com.naturessence.shared.repository.ProductRepository;
import com.naturessence.shared.repository.ShippingZoneRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.TvaConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Prices a cart on the server. Only the product ids, quantities and chosen size/colour are taken from
 * the browser: unit prices, stock, coupon, shipping and TVA come from the database. The same quote is
 * used to create the Stripe payment and, again, to save the order.
 */
@Service
@RequiredArgsConstructor
public class CheckoutPricingService {

    private static final int MAX_QUANTITY_PER_LINE = 99;

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ShippingZoneRepository shippingZoneRepository;
    private final TvaConfigRepository tvaConfigRepository;
    private final CouponRepository couponRepository;
    private final CouponService couponService;

    public record Line(Product product, OrderItemRequest request, int quantity, double unitPrice) {
        public double total() {
            return round(unitPrice * quantity);
        }
    }

    public record Quote(Long shopId, ShippingZone zone, double tvaRate, List<Line> lines, double subtotal,
                        Coupon coupon, double couponDiscount, double shippingCost, double tvaAmount, double total) {
        public long amountInCents() {
            return Math.round(total * 100);
        }
    }

    @Transactional(readOnly = true)
    public Quote quote(OrderRequest req, Long userId) {
        Long shopId = resolveShopId(req.getShopSlug());
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("Votre panier est vide.");
        }

        // 1. Lines: price and availability from the catalogue
        List<Line> lines = new ArrayList<>();
        Map<Long, Integer> requestedPerProduct = new HashMap<>();
        double subtotal = 0;
        for (OrderItemRequest item : req.getItems()) {
            if (item.getProductId() == null) throw new IllegalArgumentException("Article invalide dans le panier.");
            int qty = item.getQuantity() == null ? 0 : item.getQuantity();
            if (qty < 1 || qty > MAX_QUANTITY_PER_LINE) {
                throw new IllegalArgumentException("Quantité invalide pour « " + item.getProductName() + " ».");
            }
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("« " + item.getProductName() + " » n'est plus disponible."));
            if (shopId != null && !shopId.equals(product.getShopId())) {
                throw new IllegalArgumentException("« " + product.getNom() + " » n'appartient pas à cette boutique.");
            }
            if (!"actif".equals(product.getStatut()) || !product.isVisibleSite()) {
                throw new IllegalArgumentException("« " + product.getNom() + " » n'est plus en vente.");
            }
            int wanted = requestedPerProduct.merge(product.getId(), qty, Integer::sum);
            if (product.getStock() < wanted) {
                throw new IllegalArgumentException(product.getStock() <= 0
                        ? "« " + product.getNom() + " » est en rupture de stock."
                        : "Il ne reste que " + product.getStock() + " × « " + product.getNom() + " ».");
            }
            Line line = new Line(product, item, qty, effectivePrice(product));
            lines.add(line);
            subtotal += line.total();
        }
        subtotal = round(subtotal);

        // 2. Shipping zone and TVA of this shop
        ShippingZone zone = (shopId == null
                ? shippingZoneRepository.findAllByOrderByIdAsc()
                : shippingZoneRepository.findByShopIdOrderByIdAsc(shopId))
                .stream()
                .filter(z -> z.getNom().equalsIgnoreCase(req.getShippingZoneName()) && "Ouverte".equals(z.getStatut()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Zone de livraison introuvable ou fermée : " + req.getShippingZoneName()));
        TvaConfig tva = (shopId == null
                ? tvaConfigRepository.findAll().stream().findFirst()
                : tvaConfigRepository.findByShopId(shopId))
                .orElse(TvaConfig.builder().build());
        double tvaRate = Boolean.TRUE.equals(tva.getTvaActive()) && tva.getTauxDefaut() != null ? tva.getTauxDefaut() : 0.0;
        Double freeShippingFrom = Boolean.TRUE.equals(tva.getStandardEnabled()) ? tva.getStandardSeuil() : null;

        // 3. Coupon: every rule is checked here, not trusted from the earlier "validate" call
        Coupon coupon = null;
        double couponDiscount = 0;
        boolean couponFreeShipping = false;
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            couponService.validateCoupon(req.getCouponCode(), userId);
            coupon = couponRepository.findByCode(req.getCouponCode().trim().toUpperCase()).orElseThrow();
            if (coupon.getShopId() != null && !coupon.getShopId().equals(shopId)) {
                throw new IllegalArgumentException("Ce code promo n'est pas valable dans cette boutique.");
            }
            if (coupon.getMontantMin() > 0 && subtotal < coupon.getMontantMin()) {
                throw new IllegalArgumentException("Ce code promo demande un minimum d'achat de "
                        + String.format("%.2f", coupon.getMontantMin()) + " TND.");
            }
            switch (String.valueOf(coupon.getType())) {
                case "pourcentage" -> couponDiscount = round(subtotal * coupon.getValeur() / 100.0);
                case "fixe" -> couponDiscount = Math.min(coupon.getValeur(), subtotal);
                case "livraison" -> couponFreeShipping = true;
                default -> { /* gift / buy-one-get-one: handled by the merchant, no price change */ }
            }
        }
        double afterCoupon = round(subtotal - couponDiscount);

        double shipping = zone.getCout() != null ? zone.getCout() : 0.0;
        if (couponFreeShipping || (freeShippingFrom != null && freeShippingFrom > 0 && afterCoupon >= freeShippingFrom)) {
            shipping = 0.0;
        }

        // Prices are TTC: the TVA amount is informative, it is not added to the total.
        double tvaAmount = round(afterCoupon * tvaRate / 100.0);
        double total = round(afterCoupon + shipping);
        return new Quote(shopId, zone, tvaRate, lines, subtotal, coupon, couponDiscount, shipping, tvaAmount, total);
    }

    /** Same rule as the storefront: the promo price applies while the promotion is on and in its dates. */
    public static double effectivePrice(Product p) {
        LocalDate today = LocalDate.now();
        boolean promo = p.isPromoActive() && p.getPromoPrice() > 0 && p.getPromoPrice() < p.getSalePrice()
                && (p.getPromoStart() == null || !today.isBefore(p.getPromoStart()))
                && (p.getPromoEnd() == null || !today.isAfter(p.getPromoEnd()));
        return round(promo ? p.getPromoPrice() : p.getSalePrice());
    }

    private Long resolveShopId(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase())
                .map(Shop::getId)
                .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
