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

    // Finalized OCR matching algorithm: Stepped confidence approach (100% down to 50%)
    public List<Medicine> identifyMedicinesFromText(String extractedText) {
        if (extractedText == null || extractedText.trim().isEmpty() || 
            extractedText.equalsIgnoreCase("NONE") || 
            extractedText.startsWith("GEMINI_")) {
            return new ArrayList<>();
        }

        List<Medicine> allMedicines = medicineRepository.findAll();
        
        // 1. Pre-process scanned text
        String cleanOcr = extractedText.toUpperCase().replaceAll("[^A-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        String superCleanOcr = cleanOcr.replaceAll(" ", "");
        String[] ocrWords = cleanOcr.split(" ");
        
        System.out.println("OCR Matching: Stepped scan start. Text: [" + extractedText + "]");

        // Requirement: Decreasing threshold from 100% (1.0) down to 50% (0.5)
        double[] thresholds = {1.0, 0.9, 0.8, 0.7, 0.6, 0.5};
        
        for (double threshold : thresholds) {
            Set<Medicine> identified = new HashSet<>();
            
            for (Medicine m : allMedicines) {
                if (m.getStockQuantity() == null || m.getStockQuantity() <= 0) continue;

                String originalName = m.getName().toUpperCase();
                String cleanName = originalName.replaceAll("[^A-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
                String superCleanName = cleanName.replaceAll(" ", "");

                // Case A: Higher confidence Check (Direct or super-clean)
                if (threshold >= 0.9) {
                    if (cleanOcr.contains(cleanName) || superCleanOcr.contains(superCleanName)) {
                        identified.add(m);
                        continue;
                    }
                }

                // Case B: Component Matching at current threshold
                String[] nameParts = cleanName.split(" ");
                int matchedParts = 0;
                for (String part : nameParts) {
                    if (part.length() < 2) continue;

                    boolean partFound = false;
                    for (String word : ocrWords) {
                        if (word.length() < 2) continue;
                        
                        double similarity = calculateSimilarity(word, part);
                        if (similarity >= threshold || word.contains(part) || part.contains(word)) {
                            partFound = true;
                            break;
                        }
                    }
                    if (partFound) matchedParts++;
                }

                // Check if current part-match ratio meets the threshold
                if (nameParts.length > 0 && (double) matchedParts / nameParts.length >= threshold) {
                    identified.add(m);
                }
            }
            
            // If we found ANY matches at this confidence level, take them and stop
            if (!identified.isEmpty()) {
                System.out.println("OCR Matching: Found " + identified.size() + " medicines at " + (int)(threshold*100) + "% confidence!");
                return new ArrayList<>(identified);
            }
        }
        
        return new ArrayList<>();
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
