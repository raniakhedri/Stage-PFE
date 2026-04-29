package com.ecommerce.repository;

import com.ecommerce.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCode(String code);

    boolean existsByCode(String code);

    List<Coupon> findByStatut(String statut);

    List<Coupon> findByType(String type);

    List<Coupon> findByAutoTrue();

    @Query("SELECT c FROM Coupon c WHERE c.segment = :segment OR c.segment IS NULL")
    List<Coupon> findBySegmentOrAll(@Param("segment") String segment);

    long countByStatut(String statut);

    @Query("SELECT SUM(c.revenus) FROM Coupon c")
    Double sumRevenus();

    @Query("SELECT SUM(c.utilisations) FROM Coupon c")
    Long sumUtilisations();

    @Query("SELECT AVG(c.conversion) FROM Coupon c WHERE c.conversion > 0")
    Double avgConversion();

    @Query("SELECT c FROM Coupon c ORDER BY c.createdAt DESC")
    List<Coupon> findAllOrderByCreatedAtDesc();

        @Query("""
            SELECT c FROM Coupon c
            WHERE c.statut = 'actif'
              AND (c.dateDebut IS NULL OR c.dateDebut <= :today)
              AND (c.dateFin IS NULL OR c.dateFin >= :today)
            ORDER BY c.createdAt DESC
            """)
        List<Coupon> findActiveValidCouponsForDate(@Param("today") LocalDate today);

    @Query("SELECT c FROM Coupon c WHERE " +
            "LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Coupon> search(@Param("search") String search);
}
