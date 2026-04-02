package com.pharmtech.controller;

import com.pharmtech.model.Medicine;
import com.pharmtech.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    @PostMapping
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        return ResponseEntity.ok(medicineService.createMedicine(medicine));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medicine> updateMedicine(
            @PathVariable Long id,
            @RequestBody Medicine medicine
    ) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, medicine));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok().build();
    }
}
