package com.naturessence.shared.repository;

import com.naturessence.shared.entity.AppearanceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppearanceSettingsRepository extends JpaRepository<AppearanceSettings, Long> {
    Optional<AppearanceSettings> findByScope(String scope);
}
