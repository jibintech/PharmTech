package com.pharmtech.repository;

import com.pharmtech.model.PharmacySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PharmacySettingsRepository extends JpaRepository<PharmacySettings, Long> {
}
