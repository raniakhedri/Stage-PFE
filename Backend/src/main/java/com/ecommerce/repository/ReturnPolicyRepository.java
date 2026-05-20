package com.ecommerce.repository;

import com.ecommerce.entity.ReturnPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReturnPolicyRepository extends JpaRepository<ReturnPolicy, Long> {
}
