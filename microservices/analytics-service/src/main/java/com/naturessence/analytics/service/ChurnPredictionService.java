package com.naturessence.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ChurnPredictionService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${churn.python-command:python}")
    private String pythonCommand;

    private double highThreshold = 0.70;
    private double mediumThreshold = 0.40;

    @PostConstruct
    void loadThresholds() {
        Path metrics = resolveWorkDir().resolve("python/models/metrics.json");
        if (!Files.exists(metrics)) {
            return;
        }
        try {
            JsonNode root = MAPPER.readTree(metrics.toFile());
            JsonNode cuts = root.path("thresholds");
            if (cuts.has("high")) {
                highThreshold = cuts.get("high").asDouble(highThreshold);
            }
            if (cuts.has("medium")) {
                mediumThreshold = cuts.get("medium").asDouble(mediumThreshold);
            }
        } catch (Exception ignored) {
            // Keep the default 0.70 / 0.40 bands.
        }
    }

    public String riskLabel(double score) {
        if (score > highThreshold) {
            return "HIGH";
        }
        if (score > mediumThreshold) {
            return "MEDIUM";
        }
        return "LOW";
    }

    public double predict(UserFeaturesDTO dto) throws Exception {
        return predictAll(List.of(dto)).get(0);
    }

    public List<Double> predictAll(List<UserFeaturesDTO> dtos) throws Exception {
        if (dtos == null || dtos.isEmpty()) {
            return List.of();
        }
        Path workDir = resolveWorkDir();
        Path payload = Files.createTempFile("churn-features-", ".json");
        try {
            Files.writeString(
                payload,
                MAPPER.writeValueAsString(dtos),
                StandardCharsets.UTF_8
            );

            ProcessBuilder pb = new ProcessBuilder(
                pythonCommand,
                "python/predict.py",
                "--file",
                payload.toAbsolutePath().toString()
            );
            pb.directory(workDir.toFile());
            pb.redirectErrorStream(false);
            pb.environment().put("PYTHONIOENCODING", "utf-8");
            pb.environment().put("PYTHONUTF8", "1");

            Process process = pb.start();
            String stdout;
            try (
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8)
                )
            ) {
                stdout = reader.lines().collect(Collectors.joining()).trim();
            }
            String stderr;
            try (
                BufferedReader err = new BufferedReader(
                    new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8)
                )
            ) {
                stderr = err.lines().collect(Collectors.joining("\n")).trim();
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException(
                    "predict.py exited with code " +
                        exitCode +
                        (stderr.isBlank() ? "" : ": " + stderr)
                );
            }
            if (stdout.isBlank()) {
                throw new RuntimeException("predict.py produced no output");
            }

            List<Double> parsed = new ArrayList<>();
            if (stdout.startsWith("[")) {
                for (Object v : MAPPER.readValue(stdout, List.class)) {
                    parsed.add(
                        v instanceof Number n
                            ? n.doubleValue()
                            : Double.parseDouble(String.valueOf(v))
                    );
                }
            } else {
                parsed.add(Double.parseDouble(stdout));
            }
            if (parsed.size() != dtos.size()) {
                throw new RuntimeException(
                    "predict.py returned " + parsed.size() + " scores for " + dtos.size() + " customers"
                );
            }
            return parsed;
        } finally {
            Files.deleteIfExists(payload);
        }
    }

    private Path resolveWorkDir() {
        Path cwd = Paths.get("").toAbsolutePath();
        if (Files.exists(cwd.resolve("python/predict.py"))) {
            return cwd;
        }
        Path nested = cwd.resolve("microservices/analytics-service");
        if (Files.exists(nested.resolve("python/predict.py"))) {
            return nested;
        }
        Path parent = cwd.resolve("analytics-service");
        if (Files.exists(parent.resolve("python/predict.py"))) {
            return parent;
        }
        return cwd;
    }
}
