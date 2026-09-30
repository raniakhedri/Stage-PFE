package com.naturessence.shared.repository;

import com.naturessence.shared.entity.MerchantVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MerchantVerificationRepository extends JpaRepository<MerchantVerification, Long> {

    Optional<MerchantVerification> findFirstByShopIdOrderBySubmittedAtDesc(Long shopId);

    List<MerchantVerification> findAllByOrderBySubmittedAtDesc();
}
