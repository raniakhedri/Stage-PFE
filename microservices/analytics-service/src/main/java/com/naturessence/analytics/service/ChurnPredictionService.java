package com.naturessence.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ChurnPredictionService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Serialises the feature DTO to JSON, invokes python/predict.py as a
     * subprocess, and returns the churn probability (0.0 – 1.0).
     *
     * The working directory is set to the analytics-service root so that
     * the script can locate python/models/churn_model.pkl via relative paths.
     */
    public double predict(UserFeaturesDTO dto) throws Exception {
        String json = MAPPER.writeValueAsString(dto);

        // Resolve the analytics-service root from the running JAR's location
        String serviceRoot = Paths.get("").toAbsolutePath().toString();

        ProcessBuilder pb = new ProcessBuilder(
            "python",
            "python/predict.py",
            json
        );
        pb.directory(Paths.get(serviceRoot).toFile());
        pb.redirectErrorStream(false); // keep stderr separate

        Process process = pb.start();

        // Read stdout (the probability)
        String stdout;
        try (
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            )
        ) {
            stdout = reader.lines().collect(Collectors.joining()).trim();
        }

        // Read stderr for diagnostics
        String stderr;
        try (
            BufferedReader err = new BufferedReader(
                new InputStreamReader(process.getErrorStream())
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

        return Double.parseDouble(stdout);
    }
}
