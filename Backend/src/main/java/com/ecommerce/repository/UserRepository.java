package com.ecommerce.repository;

import com.ecommerce.entity.User;
import com.ecommerce.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

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
}
