package com.pharmtech.service;

import com.pharmtech.model.Medicine;
import com.pharmtech.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final MedicineRepository medicineRepository;

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    public Medicine createMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }

    public Medicine updateMedicine(Long id, Medicine medicineDetails) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with id: " + id));

        medicine.setName(medicineDetails.getName());
        medicine.setManufacturer(medicineDetails.getManufacturer());
        medicine.setUnitPrice(medicineDetails.getUnitPrice());
        medicine.setStockQuantity(medicineDetails.getStockQuantity());
        medicine.setExpiryDate(medicineDetails.getExpiryDate());

        return medicineRepository.save(medicine);
    }

    public void deleteMedicine(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with id: " + id));
        medicineRepository.delete(medicine);
    }

    // Advanced fuzzy search algorithm to identify medicines from OCR text
    public List<Medicine> identifyMedicinesFromText(String extractedText) {
        if (extractedText == null || extractedText.trim().isEmpty()) {
            return new ArrayList<>();
        }

        List<Medicine> allMedicines = medicineRepository.findAll();
        Set<Medicine> uniqueMedicines = new HashSet<>();
        
        // Normalize OCR text
        String upperText = extractedText.toUpperCase().replaceAll("[^A-Z0-9 ]", " ");
        String[] ocrWords = upperText.split("\\s+");
        
        for (Medicine m : allMedicines) {
            String medName = m.getName().toUpperCase();
            
            // 1. Direct match
            if (upperText.contains(medName)) {
                uniqueMedicines.add(m);
                continue;
            } 
            
            // 2. Fuzzy Token Match (Check each word in OCR against medicine name)
            boolean found = false;
            for (String ocrWord : ocrWords) {
                if (ocrWord.length() < 3) continue;
                
                // Lowered threshold (0.6) to be more tolerant of OCR errors
                if (calculateSimilarity(ocrWord, medName) > 0.6) {
                    found = true;
                    break;
                }
                
                String[] medWords = medName.split("\\s+");
                for (String medWord : medWords) {
                    if (medWord.length() < 3) continue;
                    if (calculateSimilarity(ocrWord, medWord) > 0.6) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            
            if (found) {
                uniqueMedicines.add(m);
            }
        }
        return new ArrayList<>(uniqueMedicines);
    }

    private double calculateSimilarity(String s1, String s2) {
        int distance = levenshteinDistance(s1, s2);
        return 1.0 - ((double) distance / Math.max(s1.length(), s2.length()));
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) dp[i][j] = j;
                else if (j == 0) dp[i][j] = i;
                else {
                    dp[i][j] = Math.min(dp[i - 1][j - 1] + (s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1),
                            Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1));
                }
            }
        }
        return dp[s1.length()][s2.length()];
    }
}
