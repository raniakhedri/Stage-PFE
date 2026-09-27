package com.naturessence.shared.repository;

import com.naturessence.shared.entity.TvaConfig;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TvaConfigRepository extends JpaRepository<TvaConfig, Long> {
    Optional<TvaConfig> findByShopId(Long shopId);
}
