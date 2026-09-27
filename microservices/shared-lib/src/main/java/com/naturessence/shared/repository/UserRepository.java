package com.naturessence.shared.repository;

import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    long countByShopId(Long shopId);

    Page<User> findByShopId(Long shopId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.shopId = :shopId AND u.role.name = 'CLIENT'")
    Page<User> findClientsByShopId(@Param("shopId") Long shopId, Pageable pageable);

    Page<User> findByShopIdAndStatus(Long shopId, AccountStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.shopId = :shopId AND u.status = :status AND u.role.name = 'CLIENT'")
    Page<User> findClientsByShopIdAndStatus(@Param("shopId") Long shopId, @Param("status") AccountStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.shopId = :shopId AND u.role.name = 'CLIENT' AND u.segment.name = :segmentName")
    Page<User> findByShopIdAndSegmentName(@Param("shopId") Long shopId, @Param("segmentName") String segmentName, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.shopId = :shopId AND u.role.name = 'CLIENT' AND (" +
            "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchInShop(@Param("shopId") Long shopId, @Param("search") String search, Pageable pageable);

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName")
    Page<User> findByRoleName(@Param("roleName") String roleName, Pageable pageable);

    Page<User> findByStatus(AccountStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.segment.name = :segmentName")
    Page<User> findBySegmentName(@Param("segmentName") String segmentName, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> search(@Param("search") String search, Pageable pageable);

    long countByStatus(AccountStatus status);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName")
    long countByRoleName(@Param("roleName") String roleName);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.id = :roleId")
    long countByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.segment.id = :segmentId")
    long countBySegmentId(@Param("segmentId") Long segmentId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.segment.name = :segmentName")
    long countBySegmentName(@Param("segmentName") String segmentName);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'CLIENT' AND u.createdAt >= :since")
    long countNewClientsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'CLIENT' AND u.shopId = :shopId")
    long countClientsByShop(@Param("shopId") Long shopId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'CLIENT' AND u.shopId = :shopId AND u.status = :status")
    long countClientsByShopAndStatus(@Param("shopId") Long shopId, @Param("status") AccountStatus status);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'CLIENT' AND u.shopId = :shopId AND u.createdAt >= :since")
    long countNewClientsByShopSince(@Param("shopId") Long shopId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = 'CLIENT' AND u.shopId = :shopId AND u.segment.name = :segmentName")
    long countClientsByShopAndSegment(@Param("shopId") Long shopId, @Param("segmentName") String segmentName);

    @Query("SELECT u FROM User u WHERE u.role.name = 'CLIENT' AND u.loyaltyPoints > 0 ORDER BY u.loyaltyPoints DESC")
    List<User> findTopClientsByLoyaltyPoints(Pageable pageable);
}
