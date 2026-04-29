package com.ecommerce.service;

import com.ecommerce.dto.request.DiscountRequest;
import com.ecommerce.dto.response.DiscountResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Discount;
import com.ecommerce.entity.Product;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.DiscountRepository;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    // ── Get all discounts ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DiscountResponse> getAllDiscounts() {
        return discountRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get discount by ID ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public DiscountResponse getDiscountById(Long id) {
        return mapToResponse(findOrThrow(id));
    }

    // ── Create discount ────────────────────────────────────────────
    @Transactional
    public DiscountResponse createDiscount(DiscountRequest request) {
        Discount discount = Discount.builder()
                .nom(request.getNom())
                .type(request.getType())
                .valeur(request.getValeur())
                .productId(request.getProductId())
                .productName(request.getProductName())
                .prixOriginal(request.getPrixOriginal())
                .prixFinal(computeFinalPrice(request.getType(), request.getValeur(), request.getPrixOriginal()))
                .statut(request.getStatut() != null ? request.getStatut() : "actif")
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .build();

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Catégorie introuvable avec l'ID: " + request.getCategoryId()));
            discount.setCategory(category);
        }

        discount = discountRepository.save(discount);
        syncProductsPromo(discount);
        return mapToResponse(discount);
    }

    // ── Update discount ────────────────────────────────────────────
    @Transactional
    public DiscountResponse updateDiscount(Long id, DiscountRequest request) {
        Discount discount = findOrThrow(id);

        // Clear promo on old products before updating
        clearProductsPromo(discount);

        discount.setNom(request.getNom());
        discount.setType(request.getType());
        discount.setValeur(request.getValeur());
        discount.setProductId(request.getProductId());
        discount.setProductName(request.getProductName());
        discount.setPrixOriginal(request.getPrixOriginal());
        discount.setPrixFinal(computeFinalPrice(request.getType(), request.getValeur(), request.getPrixOriginal()));
        discount.setStatut(request.getStatut() != null ? request.getStatut() : "actif");
        discount.setDateDebut(request.getDateDebut());
        discount.setDateFin(request.getDateFin());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Catégorie introuvable avec l'ID: " + request.getCategoryId()));
            discount.setCategory(category);
        } else {
            discount.setCategory(null);
        }

        discount = discountRepository.save(discount);
        syncProductsPromo(discount);
        return mapToResponse(discount);
    }

    // ── Delete discount ────────────────────────────────────────────
    @Transactional
    public void deleteDiscount(Long id) {
        Discount discount = findOrThrow(id);
        clearProductsPromo(discount);
        discountRepository.delete(discount);
    }

    // ── Toggle statut ──────────────────────────────────────────────
    @Transactional
    public DiscountResponse toggleStatut(Long id) {
        Discount discount = findOrThrow(id);
        discount.setStatut("actif".equals(discount.getStatut()) ? "inactif" : "actif");
        discount = discountRepository.save(discount);
        syncProductsPromo(discount);
        return mapToResponse(discount);
    }

    // ── Helpers ────────────────────────────────────────────────────

    private Discount findOrThrow(Long id) {
        return discountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Remise introuvable avec l'ID: " + id));
    }

    private double computeFinalPrice(String type, double valeur, double prixOriginal) {
        if (prixOriginal <= 0)
            return 0;
        if ("pourcentage".equals(type)) {
            return Math.max(0, prixOriginal - (prixOriginal * valeur / 100));
        }
        return Math.max(0, prixOriginal - valeur);
    }

    /**
     * Sync Product entities when a discount is created/updated/toggled.
     * Sets promoActive, promoPrice, promoStart, promoEnd on each matched product.
     */
    private void syncProductsPromo(Discount discount) {
        List<Product> products = resolveProducts(discount);
        if (products.isEmpty())
            return;

        boolean active = "actif".equals(discount.getStatut());
        for (Product product : products) {
            if (active) {
                double finalPrice = computeFinalPrice(discount.getType(), discount.getValeur(), product.getSalePrice());
                product.setPromoActive(true);
                product.setPromoPrice(finalPrice);
                product.setPromoStart(discount.getDateDebut());
                product.setPromoEnd(discount.getDateFin());
            } else {
                product.setPromoActive(false);
                product.setPromoPrice(0);
                product.setPromoStart(null);
                product.setPromoEnd(null);
            }
        }
        productRepository.saveAll(products);
    }

    /**
     * Clear promo fields on products linked to this discount.
     */
    private void clearProductsPromo(Discount discount) {
        List<Product> products = resolveProducts(discount);
        for (Product product : products) {
            product.setPromoActive(false);
            product.setPromoPrice(0);
            product.setPromoStart(null);
            product.setPromoEnd(null);
        }
        if (!products.isEmpty()) {
            productRepository.saveAll(products);
        }
    }

    /**
     * Resolve products from the discount's productName (comma-separated) or
     * category.
     */
    private List<Product> resolveProducts(Discount discount) {
        if (discount.getProductName() != null && !discount.getProductName().isBlank()) {
            List<String> names = Arrays.stream(discount.getProductName().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            return productRepository.findByNomIn(names);
        }
        // If category-based, could extend here in the future
        return List.of();
    }

    private DiscountResponse mapToResponse(Discount d) {
        return DiscountResponse.builder()
                .id(d.getId())
                .nom(d.getNom())
                .type(d.getType())
                .valeur(d.getValeur())
                .productId(d.getProductId())
                .productName(d.getProductName())
                .categoryId(d.getCategory() != null ? d.getCategory().getId() : null)
                .categoryName(d.getCategory() != null ? d.getCategory().getNom() : null)
                .prixOriginal(d.getPrixOriginal())
                .prixFinal(d.getPrixFinal())
                .statut(d.getStatut())
                .dateDebut(d.getDateDebut())
                .dateFin(d.getDateFin())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
