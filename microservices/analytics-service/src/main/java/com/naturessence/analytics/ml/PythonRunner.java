package com.naturessence.analytics.ml;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

/** Runs python/ml_train.py with JSON files in and out (same Python setup as the churn model). */
@Component
public class PythonRunner {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${churn.python-command:python}")
    private String pythonCommand;

    public JsonNode run(String task, Object input) throws Exception {
        Path workDir = workDir();
        Path in = Files.createTempFile("ml-" + task + "-in-", ".json");
        Path out = Files.createTempFile("ml-" + task + "-out-", ".json");
        try {
            MAPPER.writeValue(in.toFile(), input);
            ProcessBuilder pb = new ProcessBuilder(pythonCommand, "python/ml_train.py", "--task", task,
                "--in", in.toAbsolutePath().toString(), "--out", out.toAbsolutePath().toString());
            pb.directory(workDir.toFile());
            pb.redirectErrorStream(true);
            pb.environment().put("PYTHONIOENCODING", "utf-8");
            pb.environment().put("PYTHONUTF8", "1");
            Process process = pb.start();
            String log = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (!process.waitFor(5, TimeUnit.MINUTES)) {
                process.destroyForcibly();
                throw new IllegalStateException("ml_train.py " + task + " timed out");
            }
            if (process.exitValue() != 0) {
                throw new IllegalStateException("ml_train.py " + task + " failed: " + log.trim());
            }
            return MAPPER.readTree(out.toFile());
        } finally {
            Files.deleteIfExists(in);
            Files.deleteIfExists(out);
        }
    }

    static Path workDir() {
        Path cwd = Paths.get("").toAbsolutePath();
        for (Path candidate : new Path[] { cwd, cwd.resolve("microservices/analytics-service"), cwd.resolve("analytics-service") }) {
            if (Files.exists(candidate.resolve("python/ml_train.py"))) return candidate;
        }
        return cwd;
    }
}
