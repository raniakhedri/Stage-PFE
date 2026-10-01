package com.naturessence.shared.repository;

import com.naturessence.shared.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    /** Takes stock only if enough is left; returns 0 when another order got there first. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
    int decrementStockIfAvailable(@Param("id") Long id, @Param("qty") int qty);

    Optional<Product> findByShopIdAndSlug(Long shopId, String slug);

    boolean existsBySlug(String slug);

    boolean existsByShopIdAndSlug(Long shopId, String slug);

    List<Product> findByStatutOrderByCreatedAtDesc(String statut);

    List<Product> findAllByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Product p WHERE p.statut = 'actif' AND p.visibleSite = true ORDER BY p.createdAt DESC")
    List<Product> findPublicProducts();

    @Query("SELECT p FROM Product p WHERE p.statut = 'actif' AND p.visibleSite = true AND p.category.id = :categoryId ORDER BY p.pinnedInSubCategory DESC, p.createdAt DESC")
    List<Product> findPublicProductsByCategory(Long categoryId);

    @Query("SELECT p FROM Product p WHERE p.statut = 'actif' AND p.visibleSite = true AND (p.category.id = :parentId OR p.category.parent.id = :parentId) ORDER BY p.visibleCategory DESC, p.createdAt DESC")
    List<Product> findPublicProductsByParentCategory(Long parentId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId AND p.statut <> 'archive'")
    long countNonArchivedByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(p) FROM Product p JOIN p.category c LEFT JOIN c.parent parent WHERE p.statut <> 'archive' AND (c.id = :categoryId OR parent.id = :categoryId)")
    long countNonArchivedInCategoryTree(@Param("categoryId") Long categoryId);

    @Query("SELECT c.id, COUNT(p) FROM Product p JOIN p.category c WHERE p.statut <> 'archive' GROUP BY c.id")
    List<Object[]> countNonArchivedGroupedByCategoryId();

    long countByStatut(String statut);

    long countByShopId(Long shopId);

    long countByShopIdAndStatut(Long shopId, String statut);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock = 0")
    long countRupture();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.shopId = :shopId AND p.stock = 0")
    long countRuptureByShopId(@Param("shopId") Long shopId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.promoActive = true AND p.statut = 'actif'")
    long countEnPromo();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.shopId = :shopId AND p.promoActive = true AND p.statut = 'actif'")
    long countEnPromoByShopId(@Param("shopId") Long shopId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.statut IN ('actif', 'desactive')")
    long countNonArchived();

    List<Product> findByNomIn(List<String> noms);
}
