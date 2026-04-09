package com.ecommerce.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class FileUploadController {

    @Value("${app.upload.dir:${user.home}/naturessence-uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    @PostMapping("/admin/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Type de fichier non autorisé"));
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier trop volumineux (max 10MB)"));
        }

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        // Generate unique filename to prevent overwrites
        String originalName = Optional.ofNullable(file.getOriginalFilename()).orElse("file");
        // Sanitize: keep only alphanumeric, dots, hyphens, underscores
        String sanitized = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String uniqueName = UUID.randomUUID().toString().substring(0, 8) + "-" + sanitized;

        Path targetPath = uploadPath.resolve(uniqueName).normalize();
        // Prevent path traversal
        if (!targetPath.startsWith(uploadPath)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Chemin de fichier invalide"));
        }

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String url = "/uploads/" + uniqueName;
        return ResponseEntity.ok(Map.of("url", url));
    }
}
