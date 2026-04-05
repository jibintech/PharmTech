package com.pharmtech.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@SuppressWarnings({"unchecked", "rawtypes"})
public class OcrService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // A simple cache to store recent scan results and avoid Gemini API limits (15 RPM)
    private final java.util.Map<String, String> ocrCache = new java.util.concurrent.ConcurrentHashMap<>();

    public String extractTextFromImage(MultipartFile multipartFile) throws IOException {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new RuntimeException("Gemini API Key is not configured in application.properties");
        }

        // 1. Check Cache first to save API limits
        byte[] fileBytes = multipartFile.getBytes();
        String fileHash = java.util.UUID.nameUUIDFromBytes(fileBytes).toString(); // Quick hash for cache key
        
        if (ocrCache.containsKey(fileHash)) {
            System.out.println("OcrCache: Serving cached result for " + fileHash);
            return ocrCache.get(fileHash);
        }
        
        System.out.println("Using Gemini 1.5 Flash Vision AI for Extraction...");
        String extractedResult = extractTextWithGemini(multipartFile);
        
        // Only cache successful results
        if (!extractedResult.startsWith("GEMINI_ERROR")) {
            ocrCache.put(fileHash, extractedResult);
        }
        
        return extractedResult;
    }

    private String extractTextWithGemini(MultipartFile multipartFile) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            // Using the stable 'gemini-flash-latest' alias for maximum free-tier quota
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + geminiApiKey;

            // 1. Encode image to Base64
            String base64Image = Base64.getEncoder().encodeToString(multipartFile.getBytes());
            String mimeType = multipartFile.getContentType() != null ? multipartFile.getContentType() : "image/jpeg";

            // 2. Prepare the prompt for Gemini - Strictly extracting text ONLY
            String prompt = "Read this prescription image. List ONLY the absolute medicine names found. " +
                           "Do not include instructions, strengths (like 40mg), or patient info. " +
                           "If no medicines are found, output 'NONE'. " +
                           "Separated by space.";

            // 3. Build JSON payload for Gemini 1.5 Flash API
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", mimeType);
            inlineData.put("data", base64Image);

            Map<String, Object> part1 = new HashMap<>();
            part1.put("text", prompt);

            Map<String, Object> part2 = new HashMap<>();
            part2.put("inline_data", inlineData);

            Map<String, Object> contentPart = new HashMap<>();
            contentPart.put("parts", List.of(part1, part2));

            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(contentPart));

            // 4. Send request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map responseBody = response.getBody();
                List<Map> candidates = (List<Map>) responseBody.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map content = (Map) candidates.get(0).get("content");
                    List<Map> parts = (List<Map>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        String rawResult = (String) parts.get(0).get("text");
                        System.out.println("GEMINI EXTRACTED: " + rawResult);
                        // Cleanup markers like markdown and return
                        return rawResult != null ? rawResult.trim().replace("\n", " ") : "";
                    }
                }
            }
            return "NONE";
        } catch (Exception e) {
            String cleanMsg = e.getMessage() != null ? e.getMessage() : "Unknown Connection Error";
            System.err.println("Gemini Vision API Error: " + cleanMsg);
            return "GEMINI_ERROR: " + cleanMsg;
        }
    }
}
