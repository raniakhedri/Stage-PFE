package com.naturessence.shared.repository;

import com.naturessence.shared.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Category> findByParentIsNullOrderByDisplayOrderAsc();

    List<Category> findByParentIdOrderByDisplayOrderAsc(Long parentId);

    @Query("SELECT c FROM Category c WHERE c.statut = 'actif' AND c.visMenu = true ORDER BY c.menuPosition ASC, c.displayOrder ASC")
    List<Category> findMenuCategories();

    @Query("SELECT c FROM Category c WHERE c.statut = 'actif' AND c.visHomepage = true ORDER BY c.displayOrder ASC")
    List<Category> findHomepageCategories();

    @Query("SELECT c FROM Category c WHERE c.statut = 'actif' AND c.visFooter = true ORDER BY c.displayOrder ASC")
    List<Category> findFooterCategories();

    long countByParentId(Long parentId);

    long countByStatut(String statut);

    @Query("SELECT c FROM Category c ORDER BY c.menuPosition ASC, c.displayOrder ASC")
    List<Category> findAllOrdered();

    List<Category> findByParentIsNullOrderByMenuPositionAsc();

    List<Category> findByParentIdOrderByMenuPositionAsc(Long parentId);
}
