package com.pharmtech.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.core.io.ByteArrayResource;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@SuppressWarnings({"unchecked", "rawtypes"})
public class OcrService {

    @Value("${ocr.space.api.key}")
    private String ocrSpaceKey;

    public String extractTextFromImage(MultipartFile multipartFile) throws IOException {
        if (ocrSpaceKey == null || ocrSpaceKey.isEmpty()) {
            throw new RuntimeException("OCR.space API Key is not configured in application.properties");
        }
        
        System.out.println("Using Free OCR.space API Engine...");
        return extractTextWithOcrSpace(multipartFile);
    }

    private String extractTextWithOcrSpace(MultipartFile multipartFile) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://api.ocr.space/parse/image";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Prepare the file as a resource with normalized filename
            // Some OCR engines are picky about 4-letter extensions, so normalize .jpeg to .jpg
            ByteArrayResource fileResource = new ByteArrayResource(multipartFile.getBytes()) {
                @Override
                public String getFilename() {
                    String original = multipartFile.getOriginalFilename();
                    if (original != null && original.toLowerCase().endsWith(".jpeg")) {
                        return original.substring(0, original.length() - 4) + "jpg";
                    }
                    return original != null ? original : "prescription.jpg";
                }
            };

            // Enhanced body construction with explicit Content-Type for the file part
            HttpHeaders fileHeaders = new HttpHeaders();
            String contentType = multipartFile.getContentType();
            fileHeaders.setContentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.IMAGE_JPEG);
            HttpEntity<ByteArrayResource> fileEntity = new HttpEntity<>(fileResource, fileHeaders);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("apikey", ocrSpaceKey);
            body.add("file", fileEntity);
            body.add("language", "eng");
            body.add("isOverlayRequired", "false");
            body.add("detectOrientation", "true");
            body.add("scale", "true"); 
            body.add("OCREngine", "2");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map responseBody = response.getBody();
                
                // OCR.space returns ParsedResults as a List
                List<Map> parsedResults = (List<Map>) responseBody.get("ParsedResults");
                if (parsedResults != null && !parsedResults.isEmpty()) {
                    String rawText = (String) parsedResults.get(0).get("ParsedText");
                    // Important Cleanup: Remove carriage returns and normalize spaces
                    return rawText != null ? rawText.trim().replace("\r\n", " ").replace("\n", " ").replaceAll("\\s+", " ") : "";
                }
                
                // Handle possible errors from OCR.space
                if (responseBody.containsKey("ErrorMessage")) {
                    return "OCR_SPACE_ERROR: " + responseBody.get("ErrorMessage");
                }
            }
            return "OCR_SPACE_NO_TEXT_FOUND";
        } catch (Exception e) {
            System.err.println("OCR.space API Error: " + e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "CONNECTION_ERROR";
            return "OCR_ERROR_" + msg.toUpperCase().replaceAll("[^A-Z]", "_");
        }
    }
}
