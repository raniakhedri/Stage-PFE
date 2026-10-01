package com.naturessence.shared.repository;

import com.naturessence.shared.entity.AuthCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AuthCodeRepository extends JpaRepository<AuthCode, Long> {

    Optional<AuthCode> findTopByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);

    @Modifying
    @Query("DELETE FROM AuthCode c WHERE c.email = :email AND c.purpose = :purpose")
    void deleteAllFor(@Param("email") String email, @Param("purpose") String purpose);
}
