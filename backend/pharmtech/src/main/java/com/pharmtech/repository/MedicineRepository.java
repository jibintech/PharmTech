package com.pharmtech.repository;

import com.pharmtech.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    Optional<Medicine> findByNameIgnoreCase(String name);
    boolean existsByName(String name);
}
