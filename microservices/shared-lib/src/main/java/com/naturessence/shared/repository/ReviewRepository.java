package com.naturessence.shared.repository;

import com.naturessence.shared.entity.Review;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findAllByOrderByCreatedAtDesc();

    @Query("SELECT r FROM Review r JOIN r.order o WHERE o.shopId = :shopId ORDER BY r.createdAt DESC")
    List<Review> findByOrderShopId(@Param("shopId") Long shopId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Review> findByProductIdAndStatutOrderByCreatedAtDesc(Long productId, String statut);

    Optional<Review> findByOrderIdAndProductId(Long orderId, Long productId);

    boolean existsByOrderIdAndProductId(Long orderId, Long productId);
}
