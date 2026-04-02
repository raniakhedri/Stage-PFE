package com.ecommerce.service;

import com.ecommerce.dto.request.CollectionRequest;
import com.ecommerce.dto.response.CollectionResponse;
import com.ecommerce.entity.Collection;
import com.ecommerce.repository.CollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;

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
        return mapToResponse(collection);
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
        return mapToResponse(collection);
    }

    // ── Update collection ──────────────────────────────────────────────
    @Transactional
    public CollectionResponse updateCollection(Long id, CollectionRequest request) {
        Collection collection = findOrThrow(id);

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
        return mapToResponse(collection);
    }

    // ── Delete collection ──────────────────────────────────────────────
    @Transactional
    public void deleteCollection(Long id) {
        Collection collection = findOrThrow(id);
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
        if (categories == null || categories.isEmpty())
            return null;
        return String.join(SEPARATOR, categories);
    }

    private List<String> splitCategories(String stored) {
        if (stored == null || stored.isBlank())
            return Collections.emptyList();
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
}
