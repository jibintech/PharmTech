package com.pharmtech.controller;

import com.pharmtech.model.PharmacySettings;
import com.pharmtech.repository.PharmacySettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final PharmacySettingsRepository repository;

    @GetMapping
    public ResponseEntity<PharmacySettings> getSettings() {
        return ResponseEntity.ok(repository.findAll().stream().findFirst().orElse(new PharmacySettings()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PharmacySettings> updateSettings(@RequestBody PharmacySettings settings) {
        var existing = repository.findAll().stream().findFirst();
        if (existing.isPresent()) {
            settings.setId(existing.get().getId());
        }
        return ResponseEntity.ok(repository.save(settings));
    }
}
