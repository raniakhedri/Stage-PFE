package com.naturessence.shared.repository;

import com.naturessence.shared.entity.Order;
import com.naturessence.shared.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByReference(String reference);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByEmailOrderByCreatedAtDesc(String email);

    long countByStatus(OrderStatus status);
}
