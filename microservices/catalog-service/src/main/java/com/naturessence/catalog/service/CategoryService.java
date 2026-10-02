package com.naturessence.catalog.service;

import com.naturessence.shared.security.TenantGuard;
import com.naturessence.shared.dto.request.CategoryRequest;
import com.naturessence.shared.dto.response.CategoryResponse;
import com.naturessence.shared.entity.Category;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.CategoryRepository;
import com.naturessence.shared.repository.ProductRepository;
import com.naturessence.shared.repository.ShopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;

    public CategoryService(
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        ShopRepository shopRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
    }

    // ── Admin: Get all categories (flat, ordered) ──────────────────────
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        List<Category> all = categoryRepository.findAllOrdered().stream()
                .filter(c -> inShop(c.getShopId(), shopId))
                .toList();
        Map<Long, Long> counts = productCountsByCategory(all);
        return all.stream()
                .map(c -> mapToResponse(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    // ── Admin: Get category by ID ──────────────────────────────────────
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = findOrThrow(id);
        return mapToResponse(category);
    }

    // ── Admin: Create category ─────────────────────────────────────────
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = generateSlug(request.getSlug(), request.getNom());

        if (categoryRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Une catégorie avec ce slug existe déjà: " + slug);
        }

        Category category = Category.builder()
                .nom(request.getNom().trim())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .type(request.getType())
                .visMenu(request.isVisMenu())
                .visHomepage(request.isVisHomepage())
                .visMobile(request.isVisMobile())
                .visFooter(request.isVisFooter())
                .menuPosition(request.getMenuPosition())
                .displayOrder(request.getDisplayOrder())
                .statut(request.getStatut())
                .vedette(request.isVedette())
                .badgeBestseller(request.isBadgeBestseller())
                .badgeNouveau(request.isBadgeNouveau())
                .badgePromo(request.isBadgePromo())
                .metaTitle(request.getMetaTitle())
                .metaDescription(request.getMetaDescription())
                .shopId(resolveShopId(TenantGuard.shopForCreation(request.getShopSlug())))
                .build();

        if (request.getParentId() != null) {
            Category parent = findOrThrow(request.getParentId());
            category.setParent(parent);
        }

        // Shift siblings at or after the new position
        int newPos = request.getMenuPosition();
        List<Category> siblings = getSiblings(request.getParentId());
        for (Category s : siblings) {
            if (s.getMenuPosition() >= newPos) {
                s.setMenuPosition(s.getMenuPosition() + 1);
                categoryRepository.save(s);
            }
        }

        category = categoryRepository.save(category);
        return mapToResponse(category);
    }

    // ── Admin: Update category ─────────────────────────────────────────
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findOrThrow(id);

        String slug = generateSlug(request.getSlug(), request.getNom());
        if (!category.getSlug().equals(slug) && categoryRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Une catégorie avec ce slug existe déjà: " + slug);
        }

        int oldPos = category.getMenuPosition();
        int newPos = request.getMenuPosition();
        Long oldParentId = category.getParent() != null ? category.getParent().getId() : null;
        Long newParentId = request.getParentId();
        boolean parentChanged = (oldParentId == null && newParentId != null)
                || (oldParentId != null && !oldParentId.equals(newParentId));

        // Shift sibling positions when position or parent changes
        if (parentChanged) {
            // Remove from old group: shift old siblings down
            List<Category> oldSiblings = getSiblings(oldParentId);
            for (Category s : oldSiblings) {
                if (!s.getId().equals(id) && s.getMenuPosition() > oldPos) {
                    s.setMenuPosition(s.getMenuPosition() - 1);
                    categoryRepository.save(s);
                }
            }
            // Insert into new group: shift new siblings up
            List<Category> newSiblings = getSiblings(newParentId);
            for (Category s : newSiblings) {
                if (s.getMenuPosition() >= newPos) {
                    s.setMenuPosition(s.getMenuPosition() + 1);
                    categoryRepository.save(s);
                }
            }
        } else if (oldPos != newPos) {
            // Same group, position changed: shift siblings between old and new
            List<Category> siblings = getSiblings(oldParentId);
            if (newPos < oldPos) {
                // Moving up: shift those in [newPos, oldPos-1] down by 1
                for (Category s : siblings) {
                    if (!s.getId().equals(id) && s.getMenuPosition() >= newPos && s.getMenuPosition() < oldPos) {
                        s.setMenuPosition(s.getMenuPosition() + 1);
                        categoryRepository.save(s);
                    }
                }
            } else {
                // Moving down: shift those in [oldPos+1, newPos] up by 1
                for (Category s : siblings) {
                    if (!s.getId().equals(id) && s.getMenuPosition() > oldPos && s.getMenuPosition() <= newPos) {
                        s.setMenuPosition(s.getMenuPosition() - 1);
                        categoryRepository.save(s);
                    }
                }
            }
        }

        category.setNom(request.getNom().trim());
        category.setSlug(slug);
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        category.setType(request.getType());
        category.setVisMenu(request.isVisMenu());
        category.setVisHomepage(request.isVisHomepage());
        category.setVisMobile(request.isVisMobile());
        category.setVisFooter(request.isVisFooter());
        category.setMenuPosition(newPos);
        category.setDisplayOrder(request.getDisplayOrder());
        category.setStatut(request.getStatut());
        category.setVedette(request.isVedette());
        category.setBadgeBestseller(request.isBadgeBestseller());
        category.setBadgeNouveau(request.isBadgeNouveau());
        category.setBadgePromo(request.isBadgePromo());
        category.setMetaTitle(request.getMetaTitle());
        category.setMetaDescription(request.getMetaDescription());

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new IllegalArgumentException("Une catégorie ne peut pas être son propre parent");
            }
            Category parent = findOrThrow(request.getParentId());
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        category = categoryRepository.save(category);
        return mapToResponse(category);
    }

    // ── Admin: Delete category ─────────────────────────────────────────
    @Transactional
    public void deleteCategory(Long id) {
        Category category = findOrThrow(id);
        long childCount = categoryRepository.countByParentId(id);
        if (childCount > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer : " + childCount
                            + " sous-catégorie(s) y sont rattachées. Supprimez-les d'abord.");
        }
        categoryRepository.delete(category);
    }

    // ── Public: Get menu categories (tree) ─────────────────────────────
    @Transactional(readOnly = true)
    public List<CategoryResponse> getMenuCategories(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        List<Category> menuCats = categoryRepository.findMenuCategories().stream()
                .filter(c -> inShop(c.getShopId(), shopId))
                .toList();

        // Build tree: only root categories, attach children
        List<Category> roots = menuCats.stream()
                .filter(c -> c.getParent() == null)
                .toList();

        return roots.stream()
                .map(root -> {
                    CategoryResponse resp = mapToResponse(root);
                    List<CategoryResponse> childrenResp = menuCats.stream()
                            .filter(c -> c.getParent() != null && c.getParent().getId().equals(root.getId()))
                            .sorted((a, b) -> Integer.compare(a.getMenuPosition(), b.getMenuPosition()))
                            .map(this::mapToResponse)
                            .toList();
                    resp.setChildren(childrenResp);
                    return resp;
                })
                .toList();
    }

    // ── Public: Get homepage categories ─────────────────────────────────
    @Transactional(readOnly = true)
    public List<CategoryResponse> getHomepageCategories(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        return categoryRepository.findHomepageCategories().stream()
                .filter(c -> inShop(c.getShopId(), shopId))
                .map(this::mapToResponse)
                .toList();
    }

    // ── Public: Get footer categories ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<CategoryResponse> getFooterCategories(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        return categoryRepository.findFooterCategories().stream()
                .filter(c -> inShop(c.getShopId(), shopId))
                .map(this::mapToResponse)
                .toList();
    }

    // ── Admin: Reorder categories by drag & drop ───────────────────────
    @Transactional
    public void reorderCategories(List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Category cat = findOrThrow(orderedIds.get(i));
            cat.setMenuPosition(i + 1);
            categoryRepository.save(cat);
        }
    }

    private Long shopIdOf(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase()).map(Shop::getId).orElse(-1L);
    }

    private Long resolveShopId(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase())
                .map(Shop::getId)
                .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
    }

    private boolean inShop(Long entityShopId, Long shopId) {
        if (shopId == null) return true;
        return shopId.equals(entityShopId);
    }

    // ── Helpers ────────────────────────────────────────────────────────
    private List<Category> getSiblings(Long parentId) {
        if (parentId == null) {
            return categoryRepository.findByParentIsNullOrderByMenuPositionAsc();
        }
        return categoryRepository.findByParentIdOrderByMenuPositionAsc(parentId);
    }

    private Map<Long, Long> productCountsByCategory(List<Category> all) {
        Map<Long, Long> direct = new HashMap<>();
        try {
            for (Object[] row : productRepository.countNonArchivedGroupedByCategoryId()) {
                if (row[0] instanceof Number id) {
                    direct.put(id.longValue(), row[1] instanceof Number n ? n.longValue() : 0L);
                }
            }
        } catch (Exception ignored) {
            return Map.of();
        }
        Map<Long, Long> tree = new HashMap<>(direct);
        for (Category c : all) {
            if (c.getParent() != null) {
                tree.merge(c.getParent().getId(), direct.getOrDefault(c.getId(), 0L), Long::sum);
            }
        }
        return tree;
    }

    private long countProducts(Category category) {
        try {
            if (category.getId() == null) return 0;
            if (category.getParent() == null) {
                return productRepository.countNonArchivedInCategoryTree(category.getId());
            }
            return productRepository.countNonArchivedByCategoryId(category.getId());
        } catch (Exception e) {
            return 0;
        }
    }

    private Category findOrThrow(Long id) {
        Category found = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id: " + id));
        // Merchants only reach their own shop's records (TenantGuard).
        TenantGuard.assertOwned(found.getShopId(), shopRepository);
        return found;
    }

    private String generateSlug(String requestSlug, String nom) {
        String base = (requestSlug != null && !requestSlug.isBlank()) ? requestSlug : nom;
        String normalized = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        String slug = normalized.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return "/" + slug;
    }

    private CategoryResponse mapToResponse(Category category) {
        return mapToResponse(category, countProducts(category));
    }

    private CategoryResponse mapToResponse(Category category, long productCount) {
        return CategoryResponse.builder()
                .id(category.getId())
                .nom(category.getNom())
                .slug(category.getSlug())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .parentNom(category.getParent() != null ? category.getParent().getNom() : null)
                .type(category.getType())
                .niveau(category.getParent() == null ? 0 : 1)
                .childrenCount(categoryRepository.countByParentId(category.getId()))
                .productCount(productCount)
                .visMenu(category.isVisMenu())
                .visHomepage(category.isVisHomepage())
                .visMobile(category.isVisMobile())
                .visFooter(category.isVisFooter())
                .menuPosition(category.getMenuPosition())
                .displayOrder(category.getDisplayOrder())
                .statut(category.getStatut())
                .vedette(category.isVedette())
                .badgeBestseller(category.isBadgeBestseller())
                .badgeNouveau(category.isBadgeNouveau())
                .badgePromo(category.isBadgePromo())
                .metaTitle(category.getMetaTitle())
                .metaDescription(category.getMetaDescription())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
