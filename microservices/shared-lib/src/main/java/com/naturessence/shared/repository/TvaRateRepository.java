package com.naturessence.shared.repository;

import com.naturessence.shared.entity.TvaRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TvaRateRepository extends JpaRepository<TvaRate, Long> {
    List<TvaRate> findAllByOrderByIdAsc();

    long countByActifTrue();
}
