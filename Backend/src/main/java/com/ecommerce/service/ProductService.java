package com.ecommerce.service;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.dto.response.ProductStatsResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.CollectionRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final CollectionRepository collectionRepository;

    // ── Get all products ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get product by ID ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return mapToResponse(findOrThrow(id));
    }

    // ── Get product by slug (public) ───────────────────────────────
    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable: " + slug));
        return mapToResponse(product);
    }

    // ── Get public products ────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProducts() {
        return productRepository.findPublicProducts()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get public products by category ───────────────────────────
    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProductsByCategory(Long categoryId) {
        return productRepository.findPublicProductsByCategory(categoryId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get public products by parent category (includes children) ─
    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProductsByParentCategory(Long parentId) {
        return productRepository.findPublicProductsByParentCategory(parentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get public products by collection name ────────────────────
    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProductsByCollectionName(String collectionName) {
        return productRepository.findPublicProducts().stream()
                .filter(p -> {
                    String cols = p.getCollections();
                    if (cols == null || cols.isBlank())
                        return false;
                    for (String c : cols.split(",")) {
                        if (c.trim().equalsIgnoreCase(collectionName))
                            return true;
                    }
                    return false;
                })
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get public products by collection slug ────────────────────
    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProductsByCollectionSlug(String slug) {
        var collection = collectionRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Collection introuvable: " + slug));
        return getPublicProductsByCollectionName(collection.getNom());
    }

    // ── Stats ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ProductStatsResponse getStats() {
        return ProductStatsResponse.builder()
                .total(productRepository.count())
                .actifs(productRepository.countByStatut("actif"))
                .archives(productRepository.countByStatut("archive"))
                .desactives(productRepository.countByStatut("desactive"))
                .rupture(productRepository.countRupture())
                .enPromo(productRepository.countEnPromo())
                .build();
    }

    // ── Create product ─────────────────────────────────────────────
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        String slug = generateSlug(request.getSlug(), request.getNom());
        if (productRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Un produit avec ce slug existe déjà: " + slug);
        }

        Product product = Product.builder()
                .nom(request.getNom().trim())
                .slug(slug)
                .sku(request.getSku())
                .description(request.getDescription())
                .subCategory(request.getSubCategory())
                .collections(request.getCollections())
                .salePrice(request.getSalePrice())
                .costPrice(request.getCostPrice())
                .promoActive(request.isPromoActive())
                .promoPrice(request.getPromoPrice())
                .promoStart(request.getPromoStart())
                .promoEnd(request.getPromoEnd())
                .stock(request.getStock())
                .statut(request.getStatut() != null ? request.getStatut() : "actif")
                .badgeNouveau(request.isBadgeNouveau())
                .badgeBestSeller(request.isBadgeBestSeller())
                .badgePromo(request.isBadgePromo())
                .badgeExclusif(request.isBadgeExclusif())
                .visibleSite(request.isVisibleSite())
                .visibleCategory(request.isVisibleCategory())
                .pinnedInSubCategory(request.isPinnedInSubCategory())
                .metaTitle(request.getMetaTitle())
                .weight(request.getWeight())
                .dimensionLength(request.getDimensionLength())
                .dimensionWidth(request.getDimensionWidth())
                .dimensionHeight(request.getDimensionHeight())
                .specificFees(request.isSpecificFees())
                .latin(request.getLatin())
                .bio(request.isBio())
                .volumes(request.getVolumes())
                .performance(request.getPerformance())
                .imageUrl(request.getImageUrl())
                .images(request.getImages())
                .upsellTags(request.getUpsellTags())
                .build();

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Catégorie introuvable: " + request.getCategoryId()));
            product.setCategory(category);
        }

        product = productRepository.save(product);

        // Save variants
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            List<ProductVariant> variants = buildVariants(request.getVariants(), product);
            variantRepository.saveAll(variants);
            product.setVariants(variants);
        }

        return mapToResponse(product);
    }

    // ── Update product ─────────────────────────────────────────────
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findOrThrow(id);

        String slug = generateSlug(request.getSlug(), request.getNom());
        if (!product.getSlug().equals(slug) && productRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Un produit avec ce slug existe déjà: " + slug);
        }

        product.setNom(request.getNom().trim());
        product.setSlug(slug);
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        product.setSubCategory(request.getSubCategory());
        product.setCollections(request.getCollections());
        product.setSalePrice(request.getSalePrice());
        product.setCostPrice(request.getCostPrice());
        product.setPromoActive(request.isPromoActive());
        product.setPromoPrice(request.getPromoPrice());
        product.setPromoStart(request.getPromoStart());
        product.setPromoEnd(request.getPromoEnd());
        product.setStock(request.getStock());
        if (request.getStatut() != null)
            product.setStatut(request.getStatut());
        product.setBadgeNouveau(request.isBadgeNouveau());
        product.setBadgeBestSeller(request.isBadgeBestSeller());
        product.setBadgePromo(request.isBadgePromo());
        product.setBadgeExclusif(request.isBadgeExclusif());
        product.setVisibleSite(request.isVisibleSite());
        product.setVisibleCategory(request.isVisibleCategory());
        product.setPinnedInSubCategory(request.isPinnedInSubCategory());
        product.setMetaTitle(request.getMetaTitle());
        product.setWeight(request.getWeight());
        product.setDimensionLength(request.getDimensionLength());
        product.setDimensionWidth(request.getDimensionWidth());
        product.setDimensionHeight(request.getDimensionHeight());
        product.setSpecificFees(request.isSpecificFees());
        product.setLatin(request.getLatin());
        product.setBio(request.isBio());
        product.setVolumes(request.getVolumes());
        product.setPerformance(request.getPerformance());
        product.setImageUrl(request.getImageUrl());
        product.setImages(request.getImages());
        product.setUpsellTags(request.getUpsellTags());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Catégorie introuvable: " + request.getCategoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        // Replace variants — clear & re-add to keep the same managed collection
        product.getVariants().clear();
        productRepository.flush();
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            List<ProductVariant> variants = buildVariants(request.getVariants(), product);
            product.getVariants().addAll(variants);
        }

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    // ── Archive toggle ─────────────────────────────────────────────
    @Transactional
    public ProductResponse toggleArchive(Long id) {
        Product product = findOrThrow(id);
        if ("archive".equals(product.getStatut())) {
            product.setStatut("actif");
        } else {
            product.setStatut("archive");
        }
        return mapToResponse(productRepository.save(product));
    }

    // ── Deactivate toggle ──────────────────────────────────────────
    @Transactional
    public ProductResponse toggleDeactivate(Long id) {
        Product product = findOrThrow(id);
        if ("desactive".equals(product.getStatut())) {
            product.setStatut("actif");
        } else {
            product.setStatut("desactive");
        }
        return mapToResponse(productRepository.save(product));
    }

    // ── Delete product ─────────────────────────────────────────────
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findOrThrow(id);
        productRepository.delete(product);
    }

    // ── Helpers ────────────────────────────────────────────────────
    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable avec l'ID: " + id));
    }

    private String generateSlug(String providedSlug, String nom) {
        String base = (providedSlug != null && !providedSlug.isBlank()) ? providedSlug : nom;
        String normalized = Normalizer.normalize(base.trim().toLowerCase(), Normalizer.Form.NFD);
        return normalized
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String computeStockStatus(int stock) {
        if (stock == 0)
            return "Rupture";
        if (stock <= 10)
            return "Critique";
        if (stock <= 30)
            return "Faible";
        return "Optimal";
    }

    private double computeMargin(double salePrice, double costPrice) {
        if (salePrice <= 0)
            return 0;
        return Math.round(((salePrice - costPrice) / salePrice) * 100.0);
    }

    private List<ProductVariant> buildVariants(
            List<ProductRequest.ProductVariantRequest> requests, Product product) {
        List<ProductVariant> result = new ArrayList<>();
        for (ProductRequest.ProductVariantRequest vr : requests) {
            result.add(ProductVariant.builder()
                    .product(product)
                    .label(vr.getLabel())
                    .colorSwatch(vr.getColorSwatch())
                    .sku(vr.getSku())
                    .price(vr.getPrice())
                    .stock(vr.getStock())
                    .build());
        }
        return result;
    }

    public ProductResponse mapToResponse(Product p) {
        List<ProductResponse.ProductVariantResponse> variantResponses = (p.getVariants() == null
                ? List.<ProductVariant>of()
                : p.getVariants()).stream()
                .map(v -> ProductResponse.ProductVariantResponse.builder()
                        .id(v.getId())
                        .label(v.getLabel())
                        .colorSwatch(v.getColorSwatch())
                        .sku(v.getSku())
                        .price(v.getPrice())
                        .stock(v.getStock())
                        .build())
                .toList();

        return ProductResponse.builder()
                .id(p.getId())
                .nom(p.getNom())
                .slug(p.getSlug())
                .sku(p.getSku())
                .description(p.getDescription())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .parentCategoryId(p.getCategory() != null && p.getCategory().getParent() != null
                        ? p.getCategory().getParent().getId()
                        : null)
                .parentCategoryNom(p.getCategory() != null && p.getCategory().getParent() != null
                        ? p.getCategory().getParent().getNom()
                        : null)
                .categoryNom(p.getCategory() != null ? p.getCategory().getNom() : null)
                .subCategory(p.getSubCategory())
                .collections(p.getCollections())
                .salePrice(p.getSalePrice())
                .costPrice(p.getCostPrice())
                .promoActive(p.isPromoActive())
                .promoPrice(p.getPromoPrice())
                .promoStart(p.getPromoStart())
                .promoEnd(p.getPromoEnd())
                .marginPct(computeMargin(p.getSalePrice(), p.getCostPrice()))
                .stock(p.getStock())
                .stockStatus(computeStockStatus(p.getStock()))
                .statut(p.getStatut())
                .badgeNouveau(p.isBadgeNouveau())
                .badgeBestSeller(p.isBadgeBestSeller())
                .badgePromo(p.isBadgePromo())
                .badgeExclusif(p.isBadgeExclusif())
                .visibleSite(p.isVisibleSite())
                .visibleCategory(p.isVisibleCategory())
                .pinnedInSubCategory(p.isPinnedInSubCategory())
                .metaTitle(p.getMetaTitle())
                .weight(p.getWeight())
                .dimensionLength(p.getDimensionLength())
                .dimensionWidth(p.getDimensionWidth())
                .dimensionHeight(p.getDimensionHeight())
                .specificFees(p.isSpecificFees())
                .latin(p.getLatin())
                .bio(p.isBio())
                .volumes(p.getVolumes())
                .performance(p.getPerformance())
                .imageUrl(p.getImageUrl())
                .images(p.getImages())
                .upsellTags(p.getUpsellTags())
                .variants(variantResponses)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
