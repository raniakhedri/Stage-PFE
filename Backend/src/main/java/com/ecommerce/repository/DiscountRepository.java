package com.ecommerce.repository;

import com.ecommerce.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiscountRepository extends JpaRepository<Discount, Long> {

    List<Discount> findByStatut(String statut);

    List<Discount> findByCategoryId(Long categoryId);

    List<Discount> findByProductId(Long productId);

    @Query("SELECT d FROM Discount d ORDER BY d.createdAt DESC")
    List<Discount> findAllOrderByCreatedAtDesc();

    @Query("SELECT d FROM Discount d WHERE " +
            "LOWER(d.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(d.productName) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Discount> search(@Param("search") String search);

    long countByStatut(String statut);
}
