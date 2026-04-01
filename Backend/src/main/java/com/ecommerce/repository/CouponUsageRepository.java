package com.ecommerce.repository;

import com.ecommerce.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    Optional<CouponUsage> findByCouponIdAndUserId(Long couponId, Long userId);

    @Query("SELECT COALESCE(SUM(cu.count), 0) FROM CouponUsage cu WHERE cu.coupon.id = :couponId AND cu.user.id = :userId")
    int countUsageByUserAndCoupon(@Param("couponId") Long couponId, @Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(cu.count), 0) FROM CouponUsage cu WHERE cu.coupon.id = :couponId")
    int countTotalUsages(@Param("couponId") Long couponId);

    void deleteByCouponId(Long couponId);

    void deleteByUserId(Long userId);
}
