package com.naturessence.shared.repository;

import com.naturessence.shared.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductIdOrderById(Long productId);

    void deleteByProductId(Long productId);
}
