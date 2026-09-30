package com.naturessence.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ChurnPredictionService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${churn.python-command:python}")
    private String pythonCommand;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    /** Risk bands per churn model: {high, medium}. "general" = UCI Online Retail II, "clothes" = Kaggle H&M. */
    private final Map<String, double[]> thresholds = new HashMap<>(Map.of(
        "general", new double[] { 0.70, 0.40 },
        "clothes", new double[] { 0.70, 0.40 }
    ));

    @PostConstruct
    void loadThresholds() {
        readThresholds("general", "python/models/metrics.json", "thresholds");
        readThresholds("clothes", "python/models/hm_metrics.json", "churn", "thresholds");
    }

    private void readThresholds(String model, String file, String... path) {
        Path metrics = resolveWorkDir().resolve(file);
        if (!Files.exists(metrics)) {
            return;
        }
        try {
            JsonNode cuts = MAPPER.readTree(metrics.toFile());
            for (String key : path) {
                cuts = cuts.path(key);
            }
            double[] bands = thresholds.get(model);
            bands[0] = cuts.path("high").asDouble(bands[0]);
            bands[1] = cuts.path("medium").asDouble(bands[1]);
        } catch (Exception ignored) {
            // Keep the default 0.70 / 0.40 bands.
        }
    }

    /** Clothes shops use the model trained on fashion purchases; every other shop the general one. */
    public String modelFor(Long userId) {
        if (userId == null) return "general";
        return userRepository.findById(userId)
            .map(User::getShopId)
            .flatMap(shopRepository::findById)
            .map(shop -> "CLOTHES".equalsIgnoreCase(shop.getBusinessType()) ? "clothes" : "general")
            .orElse("general");
    }

    public String riskLabel(double score) {
        return riskLabel(score, "general");
    }

    public String riskLabel(double score, String model) {
        double[] bands = thresholds.getOrDefault(model, thresholds.get("general"));
        if (score > bands[0]) {
            return "HIGH";
        }
        if (score > bands[1]) {
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
            // Each row carries the model to use (see modelFor), read by predict.py.
            List<Map<String, Object>> rows = new ArrayList<>();
            for (UserFeaturesDTO dto : dtos) {
                @SuppressWarnings("unchecked")
                Map<String, Object> row = MAPPER.convertValue(dto, Map.class);
                row.put("model", modelFor(dto.getUserId()));
                rows.add(row);
            }
            Files.writeString(
                payload,
                MAPPER.writeValueAsString(rows),
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
