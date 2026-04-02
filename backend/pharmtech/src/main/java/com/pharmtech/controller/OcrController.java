package com.pharmtech.controller;

import com.pharmtech.model.Medicine;
import com.pharmtech.service.OcrService;
import com.pharmtech.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;
    private final MedicineService medicineService;

    @PostMapping("/extract")
    public ResponseEntity<Map<String, Object>> extractMedicineFromImage(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            // 1. Extract text using Tesseract Free OCR
            String extractedText = ocrService.extractTextFromImage(file);

            // 2. Identify medicines from the text against Database
            List<Medicine> identifiedMedicines = medicineService.identifyMedicinesFromText(extractedText);

            // 3. Return results
            Map<String, Object> response = new HashMap<>();
            response.put("extractedText", extractedText);
            response.put("identifiedMedicines", identifiedMedicines);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to process image: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
