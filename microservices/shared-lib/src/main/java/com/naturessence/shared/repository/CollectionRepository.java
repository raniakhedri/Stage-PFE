package com.naturessence.shared.repository;

import com.naturessence.shared.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CollectionRepository extends JpaRepository<Collection, Long> {

    Optional<Collection> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("SELECT c FROM Collection c ORDER BY c.priorite DESC, c.createdAt DESC")
    List<Collection> findAllOrdered();

    List<Collection> findByStatut(String statut);

    @Query("SELECT c FROM Collection c WHERE c.visHomepage = true AND c.statut = 'active' ORDER BY c.priorite DESC")
    List<Collection> findHomepageCollections();

    @Query("SELECT c FROM Collection c WHERE c.visMenu = true AND c.statut = 'active' ORDER BY c.priorite DESC")
    List<Collection> findMenuCollections();

    @Query("SELECT c FROM Collection c WHERE c.visMenu = true AND c.statut = 'active' AND c.menuParentCategory = :categoryName ORDER BY c.priorite DESC")
    List<Collection> findMenuCollectionsByCategory(String categoryName);

    long countByStatut(String statut);
}
