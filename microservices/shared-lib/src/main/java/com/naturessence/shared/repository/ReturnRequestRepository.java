package com.naturessence.shared.repository;

import com.naturessence.shared.entity.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    List<ReturnRequest> findAllByOrderByCreatedAtDesc();

    @Query("SELECT r FROM ReturnRequest r WHERE r.order.user.id = :userId ORDER BY r.createdAt DESC")
    List<ReturnRequest> findByOrderUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    boolean existsByOrderIdAndOrderItemId(Long orderId, Long orderItemId);
}
