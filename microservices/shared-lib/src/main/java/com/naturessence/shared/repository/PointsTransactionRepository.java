package com.naturessence.shared.repository;

import com.naturessence.shared.entity.PointsTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointsTransactionRepository extends JpaRepository<PointsTransaction, Long> {

    List<PointsTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByOrderIdAndType(Long orderId, String type);

    List<PointsTransaction> findByOrderId(Long orderId);

    boolean existsByUser_IdAndTypeAndDescription(Long userId, String type, String description);
}
