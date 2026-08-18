package com.naturessence.catalog.service;

import com.naturessence.shared.dto.request.CollectionRequest;
import com.naturessence.shared.dto.response.CollectionResponse;
import com.naturessence.shared.entity.Collection;
import com.naturessence.shared.entity.Product;
import com.naturessence.shared.repository.CollectionRepository;
import com.naturessence.shared.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final ProductRepository productRepository;

    private static final String SEPARATOR = "||";

    // ── Get all collections (ordered) ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<CollectionResponse> getAllCollections() {
        return collectionRepository.findAllOrdered().stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get menu collections (public) ────────────────────────────────
    @Transactional(readOnly = true)
    public List<CollectionResponse> getMenuCollections() {
        return collectionRepository.findMenuCollections().stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get homepage bento collections (public) ───────────────────────
    @Transactional(readOnly = true)
    public List<CollectionResponse> getHomepageCollections() {
        return collectionRepository.findAll().stream()
                .filter(c -> c.getHomepagePosition() != null && !c.getHomepagePosition().isBlank())
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get collection by ID ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public CollectionResponse getCollectionById(Long id) {
        Collection collection = findOrThrow(id);
        CollectionResponse response = mapToResponse(collection);
        response.setProductIds(findProductIdsByCollectionName(collection.getNom()));
        return response;
    }

    // ── Get collection by slug (public) ────────────────────────────────
    @Transactional(readOnly = true)
    public CollectionResponse getCollectionBySlug(String slug) {
        Collection collection = collectionRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Collection introuvable: " + slug));
        CollectionResponse response = mapToResponse(collection);
        response.setProductIds(findProductIdsByCollectionName(collection.getNom()));
        return response;
    }

    // ── Create collection ──────────────────────────────────────────────
    @Transactional
    public CollectionResponse createCollection(CollectionRequest request) {
        String slug = generateSlug(request.getSlug(), request.getNom());

        if (collectionRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Une collection avec ce slug existe déjà: " + slug);
        }

        Collection collection = Collection.builder()
                .nom(request.getNom().trim())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .bannerUrl(request.getBannerUrl())
                .mobileImageUrl(request.getMobileImageUrl())
                .type(request.getType())
                .tags(request.getTags())
                .prixMax(request.getPrixMax())
                .performance(request.getPerformance())
                .statut(request.getStatut())
                .featured(request.isFeatured())
                .priorite(request.getPriorite())
                .visHomepage(request.isVisHomepage())
                .visMenu(request.isVisMenu())
                .visMobile(request.isVisMobile())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .menuFeatured(request.isMenuFeatured())
                .menuParentCategory(request.getMenuParentCategory())
                .homepagePosition(request.getHomepagePosition())
                .linkedCategories(joinCategories(request.getLinkedCategories()))
                .metaTitle(request.getMetaTitle())
                .metaDescription(request.getMetaDescription())
                .build();

        collection = collectionRepository.save(collection);
        syncProductCollections(collection.getNom(), request.getProductIds());
        CollectionResponse response = mapToResponse(collection);
        response.setProductIds(request.getProductIds() != null ? request.getProductIds() : Collections.emptyList());
        return response;
    }

    // ── Update collection ──────────────────────────────────────────────
    @Transactional
    public CollectionResponse updateCollection(Long id, CollectionRequest request) {
        Collection collection = findOrThrow(id);
        String oldName = collection.getNom();

        String slug = generateSlug(request.getSlug(), request.getNom());
        if (!collection.getSlug().equals(slug) && collectionRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Une collection avec ce slug existe déjà: " + slug);
        }

        collection.setNom(request.getNom().trim());
        collection.setSlug(slug);
        collection.setDescription(request.getDescription());
        collection.setImageUrl(request.getImageUrl());
        collection.setBannerUrl(request.getBannerUrl());
        collection.setMobileImageUrl(request.getMobileImageUrl());
        collection.setType(request.getType());
        collection.setTags(request.getTags());
        collection.setPrixMax(request.getPrixMax());
        collection.setPerformance(request.getPerformance());
        collection.setStatut(request.getStatut());
        collection.setFeatured(request.isFeatured());
        collection.setPriorite(request.getPriorite());
        collection.setVisHomepage(request.isVisHomepage());
        collection.setVisMenu(request.isVisMenu());
        collection.setVisMobile(request.isVisMobile());
        collection.setDateDebut(request.getDateDebut());
        collection.setDateFin(request.getDateFin());
        collection.setMenuFeatured(request.isMenuFeatured());
        collection.setMenuParentCategory(request.getMenuParentCategory());
        collection.setHomepagePosition(request.getHomepagePosition());
        collection.setLinkedCategories(joinCategories(request.getLinkedCategories()));
        collection.setMetaTitle(request.getMetaTitle());
        collection.setMetaDescription(request.getMetaDescription());

        collection = collectionRepository.save(collection);

        // If the collection name changed, update old references first
        if (!oldName.equals(collection.getNom())) {
            renameCollectionInProducts(oldName, collection.getNom());
        }
        syncProductCollections(collection.getNom(), request.getProductIds());

        CollectionResponse response = mapToResponse(collection);
        response.setProductIds(findProductIdsByCollectionName(collection.getNom()));
        return response;
    }

    // ── Delete collection ──────────────────────────────────────────────
    @Transactional
    public void deleteCollection(Long id) {
        Collection collection = findOrThrow(id);
        // Remove the collection name from all products
        removeCollectionFromAllProducts(collection.getNom());
        collectionRepository.delete(collection);
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private Collection findOrThrow(Long id) {
        return collectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collection introuvable: " + id));
    }

    private String generateSlug(String customSlug, String nom) {
        String base = (customSlug != null && !customSlug.isBlank()) ? customSlug : nom;
        String normalized = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private String joinCategories(List<String> categories) {
        if (categories == null || categories.isEmpty()) return null;
        return String.join(SEPARATOR, categories);
    }

    private List<String> splitCategories(String stored) {
        if (stored == null || stored.isBlank()) return Collections.emptyList();
        return Arrays.asList(stored.split("\\|\\|"));
    }

    private CollectionResponse mapToResponse(Collection c) {
        return CollectionResponse.builder()
                .id(c.getId())
                .nom(c.getNom())
                .slug(c.getSlug())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .bannerUrl(c.getBannerUrl())
                .mobileImageUrl(c.getMobileImageUrl())
                .type(c.getType())
                .tags(c.getTags())
                .prixMax(c.getPrixMax())
                .performance(c.getPerformance())
                .statut(c.getStatut())
                .featured(c.isFeatured())
                .priorite(c.getPriorite())
                .visHomepage(c.isVisHomepage())
                .visMenu(c.isVisMenu())
                .visMobile(c.isVisMobile())
                .dateDebut(c.getDateDebut())
                .dateFin(c.getDateFin())
                .menuFeatured(c.isMenuFeatured())
                .menuParentCategory(c.getMenuParentCategory())
                .homepagePosition(c.getHomepagePosition())
                .linkedCategories(splitCategories(c.getLinkedCategories()))
                .metaTitle(c.getMetaTitle())
                .metaDescription(c.getMetaDescription())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    // ── Product-Collection sync helpers ─────────────────────────────────

    private List<Long> findProductIdsByCollectionName(String collectionName) {
        return productRepository.findAll().stream()
                .filter(p -> hasCollection(p.getCollections(), collectionName))
                .map(Product::getId)
                .toList();
    }

    private void syncProductCollections(String collectionName, List<Long> productIds) {
        if (productIds == null) return;

        Set<Long> wantedIds = new HashSet<>(productIds);

        List<Product> allProducts = productRepository.findAll();
        for (Product p : allProducts) {
            boolean has    = hasCollection(p.getCollections(), collectionName);
            boolean wanted = wantedIds.contains(p.getId());
            if (wanted && !has) {
                p.setCollections(addCollection(p.getCollections(), collectionName));
                productRepository.save(p);
            } else if (!wanted && has) {
                p.setCollections(removeCollection(p.getCollections(), collectionName));
                productRepository.save(p);
            }
        }
    }

    private void removeCollectionFromAllProducts(String collectionName) {
        List<Product> allProducts = productRepository.findAll();
        for (Product p : allProducts) {
            if (hasCollection(p.getCollections(), collectionName)) {
                p.setCollections(removeCollection(p.getCollections(), collectionName));
                productRepository.save(p);
            }
        }
    }

    private void renameCollectionInProducts(String oldName, String newName) {
        List<Product> allProducts = productRepository.findAll();
        for (Product p : allProducts) {
            if (hasCollection(p.getCollections(), oldName)) {
                String updated = removeCollection(p.getCollections(), oldName);
                updated = addCollection(updated, newName);
                p.setCollections(updated);
                productRepository.save(p);
            }
        }
    }

    private boolean hasCollection(String collections, String name) {
        if (collections == null || collections.isBlank()) return false;
        return Arrays.stream(collections.split(","))
                .map(String::trim)
                .anyMatch(c -> c.equalsIgnoreCase(name));
    }

    private String addCollection(String collections, String name) {
        if (collections == null || collections.isBlank()) return name;
        return collections + "," + name;
    }

    private String removeCollection(String collections, String name) {
        if (collections == null || collections.isBlank()) return null;
        String result = Arrays.stream(collections.split(","))
                .map(String::trim)
                .filter(c -> !c.equalsIgnoreCase(name))
                .collect(Collectors.joining(","));
        return result.isEmpty() ? null : result;
    }
}
