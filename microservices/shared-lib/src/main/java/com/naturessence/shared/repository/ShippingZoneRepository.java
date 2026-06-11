package com.naturessence.shared.repository;

import com.naturessence.shared.entity.ShippingZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShippingZoneRepository extends JpaRepository<ShippingZone, Long> {
    List<ShippingZone> findAllByOrderByIdAsc();

    long countByStatut(String statut);
}
