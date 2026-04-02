package com.ecommerce.repository;

import com.ecommerce.entity.Banner;
import com.ecommerce.enums.BannerAudience;
import com.ecommerce.enums.BannerPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findAllByOrderByOrdreAscPrioriteAsc();

    /**
     * Banners visible on frontoffice:
     * - actif = true
     * - position matches
     * - audience = ALL or audience matches
     * - date in range (or no dates set)
     */
    @Query("""
                SELECT b FROM Banner b
                WHERE b.actif = true
                  AND b.position = :position
                  AND (b.audience = com.ecommerce.enums.BannerAudience.ALL OR b.audience = :audience)
                  AND (b.dateDebut IS NULL OR b.dateDebut <= :today)
                  AND (b.dateFin IS NULL OR b.dateFin >= :today)
                ORDER BY b.ordre ASC, b.priorite ASC
            """)
    List<Banner> findPublicBanners(
            @Param("position") BannerPosition position,
            @Param("audience") BannerAudience audience,
            @Param("today") LocalDate today);

    /**
     * For visitors not logged-in: only ALL audience banners
     */
    @Query("""
                SELECT b FROM Banner b
                WHERE b.actif = true
                  AND b.position = :position
                  AND b.audience = com.ecommerce.enums.BannerAudience.ALL
                  AND (b.dateDebut IS NULL OR b.dateDebut <= :today)
                  AND (b.dateFin IS NULL OR b.dateFin >= :today)
                ORDER BY b.ordre ASC, b.priorite ASC
            """)
    List<Banner> findPublicBannersForGuest(
            @Param("position") BannerPosition position,
            @Param("today") LocalDate today);
}
