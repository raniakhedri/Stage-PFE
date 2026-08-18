package com.naturessence.analytics.controller;

import com.naturessence.analytics.service.ChurnPredictionService;
import com.naturessence.analytics.service.FeatureExtractionService;
import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class ChurnController {

    private final FeatureExtractionService featureService;
    private final ChurnPredictionService predictionService;
    private final UserRepository userRepository;

    // ── Single user ───────────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/churn/{userId}
     * Returns churn probability and risk level for one user.
     */
    @GetMapping("/churn/{userId}")
    public ResponseEntity<?> predictOne(@PathVariable Long userId) {
        try {
            UserFeaturesDTO features = featureService.extract(userId);
            double score = predictionService.predict(features);

            return ResponseEntity.ok(
                Map.of(
                    "userId",
                    userId,
                    "churnProbability",
                    Math.round(score * 10000.0) / 10000.0,
                    "risk",
                    riskLabel(score)
                )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("error", e.getMessage())
            );
        }
    }

    // ── Feature inspection ────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/churn/{userId}/features
     * Returns the raw feature vector extracted for a user (useful for debugging).
     */
    @GetMapping("/churn/{userId}/features")
    public ResponseEntity<?> getFeatures(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(featureService.extract(userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("error", e.getMessage())
            );
        }
    }

    // ── Batch ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/analytics/churn/batch?role=CLIENT&minRisk=HIGH
     * Runs churn prediction for every user with the given role (default CLIENT)
     * and returns only those whose risk level is >= minRisk (optional filter).
     *
     * @param role     role name to filter users (default: CLIENT)
     * @param minRisk  optional minimum risk level to include: LOW | MEDIUM | HIGH
     */
    @GetMapping("/churn/batch")
    public ResponseEntity<?> predictBatch(
        @RequestParam(defaultValue = "CLIENT") String role,
        @RequestParam(required = false) String minRisk
    ) {
        List<User> users = userRepository
            .findAll()
            .stream()
            .filter(
                u ->
                    u.getRole() != null &&
                    role.equalsIgnoreCase(u.getRole().getName())
            )
            .toList();

        List<Map<String, Object>> results = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();

        for (User user : users) {
            try {
                UserFeaturesDTO features = featureService.extract(user.getId());
                double score = predictionService.predict(features);
                String risk = riskLabel(score);

                if (
                    minRisk == null ||
                    riskRank(risk) >= riskRank(minRisk.toUpperCase())
                ) {
                    results.add(
                        Map.of(
                            "userId",
                            user.getId(),
                            "email",
                            user.getEmail(),
                            "fullName",
                            user.getFullName(),
                            "churnProbability",
                            Math.round(score * 10000.0) / 10000.0,
                            "risk",
                            risk
                        )
                    );
                }
            } catch (Exception e) {
                errors.add(
                    Map.of(
                        "userId",
                        user.getId(),
                        "error",
                        e.getMessage() != null ? e.getMessage() : "unknown"
                    )
                );
            }
        }

        // Sort results by descending churn probability
        results.sort((a, b) ->
            Double.compare(
                (double) b.get("churnProbability"),
                (double) a.get("churnProbability")
            )
        );

        return ResponseEntity.ok(
            Map.of(
                "totalProcessed",
                users.size(),
                "totalReturned",
                results.size(),
                "errors",
                errors,
                "predictions",
                results
            )
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String riskLabel(double score) {
        if (score > 0.70) return "HIGH";
        if (score > 0.40) return "MEDIUM";
        return "LOW";
    }

    private static int riskRank(String risk) {
        return switch (risk) {
            case "HIGH" -> 2;
            case "MEDIUM" -> 1;
            default -> 0;
        };
    }
}
