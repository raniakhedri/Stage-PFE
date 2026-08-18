package com.naturessence.analytics.controller;

import com.naturessence.analytics.service.ChurnPredictionService;
import com.naturessence.analytics.service.FeatureExtractionService;
import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.UserRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
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

    @GetMapping("/churn/{userId:\\d+}")
    public ResponseEntity<?> predictOne(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(scoreUsers(List.of(userId)).get(0));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/churn/{userId:\\d+}/features")
    public ResponseEntity<?> getFeatures(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(featureService.extract(userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/churn/batch-ids")
    public ResponseEntity<?> predictByIds(@RequestBody List<Long> userIds) {
        List<Long> ids = userIds == null
            ? List.of()
            : userIds.stream().filter(Objects::nonNull).toList();
        return ResponseEntity.ok(Map.of("predictions", scoreUsers(ids)));
    }

    @GetMapping("/churn/batch")
    public ResponseEntity<?> predictBatch(
        @RequestParam(defaultValue = "CLIENT") String role,
        @RequestParam(required = false) String minRisk
    ) {
        List<User> users = userRepository
            .findAll()
            .stream()
            .filter(u -> u.getRole() != null && role.equalsIgnoreCase(u.getRole().getName()))
            .toList();

        Map<Long, User> byId = users
            .stream()
            .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a, LinkedHashMap::new));

        List<Map<String, Object>> results = scoreUsers(new ArrayList<>(byId.keySet()));
        List<Map<String, Object>> errors = new ArrayList<>();
        List<Map<String, Object>> kept = new ArrayList<>();

        for (Map<String, Object> row : results) {
            if ("UNAVAILABLE".equals(row.get("risk"))) {
                errors.add(row);
                continue;
            }
            User user = byId.get(asLong(row.get("userId")));
            if (user != null) {
                row.put("email", user.getEmail());
                row.put("fullName", user.getFullName());
            }
            String risk = String.valueOf(row.get("risk"));
            if (minRisk == null || riskRank(risk) >= riskRank(minRisk.toUpperCase())) {
                kept.add(row);
            }
        }

        kept.sort((a, b) -> {
            double pa = a.get("churnProbability") instanceof Number n ? n.doubleValue() : -1.0;
            double pb = b.get("churnProbability") instanceof Number n ? n.doubleValue() : -1.0;
            return Double.compare(pb, pa);
        });

        return ResponseEntity.ok(
            Map.of(
                "totalProcessed", users.size(),
                "totalReturned", kept.size(),
                "errors", errors,
                "predictions", kept
            )
        );
    }

    private List<Map<String, Object>> scoreUsers(List<Long> userIds) {
        List<Map<String, Object>> results = new ArrayList<>();
        List<UserFeaturesDTO> eligible = new ArrayList<>();
        List<Integer> eligibleAt = new ArrayList<>();

        for (Long userId : userIds) {
            try {
                UserFeaturesDTO features = featureService.extract(userId);
                Map<String, Object> body = baseRow(userId, features);
                if (features.getTotalOrders() == null || features.getTotalOrders() < 1) {
                    body.put("churnProbability", null);
                    body.put("risk", "INSUFFICIENT_HISTORY");
                    body.put(
                        "explanation",
                        "Churn is defined for customers with at least one completed purchase."
                    );
                    results.add(body);
                } else {
                    eligibleAt.add(results.size());
                    eligible.add(features);
                    results.add(body);
                }
            } catch (IllegalArgumentException e) {
                results.add(errorRow(userId, "User not found"));
            } catch (Exception e) {
                results.add(
                    errorRow(userId, e.getMessage() != null ? e.getMessage() : "unknown")
                );
            }
        }

        if (eligible.isEmpty()) {
            return results;
        }

        try {
            List<Double> scores = predictionService.predictAll(eligible);
            for (int i = 0; i < eligible.size(); i++) {
                Map<String, Object> body = results.get(eligibleAt.get(i));
                double score = scores.get(i);
                body.put("churnProbability", Math.round(score * 10000.0) / 10000.0);
                body.put("risk", predictionService.riskLabel(score));
            }
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "prediction failed";
            for (Integer idx : eligibleAt) {
                Map<String, Object> body = results.get(idx);
                body.put("churnProbability", null);
                body.put("risk", "UNAVAILABLE");
                body.put("error", msg);
            }
        }
        return results;
    }

    private static Map<String, Object> baseRow(Long userId, UserFeaturesDTO features) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userId", userId);
        body.put("totalOrders", features.getTotalOrders());
        body.put("daysSinceLastOrder", features.getDaysSinceLastOrder());
        return body;
    }

    private static Map<String, Object> errorRow(Long userId, String message) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("userId", userId);
        row.put("risk", "UNAVAILABLE");
        row.put("error", message);
        return row;
    }

    private static Long asLong(Object value) {
        if (value instanceof Number n) {
            return n.longValue();
        }
        return value != null ? Long.parseLong(String.valueOf(value)) : null;
    }

    private static int riskRank(String risk) {
        return switch (risk) {
            case "HIGH" -> 2;
            case "MEDIUM" -> 1;
            case "LOW" -> 0;
            default -> -1;
        };
    }
}
