package com.ecommerce.repository;

import com.ecommerce.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    List<Permission> findByRoleId(Long roleId);

    @Query(value = "SELECT DISTINCT module FROM permissions", nativeQuery = true)
    Set<String> findAllModuleNamesNative();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM permissions", nativeQuery = true)
    void deleteAllNative();
}
