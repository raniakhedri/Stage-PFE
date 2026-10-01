package com.naturessence.shared.exception;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 404 ──────────────────────────────────────────────────────────────────

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(
        EntityNotFoundException ex
    ) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // ── 400 ──────────────────────────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
        IllegalArgumentException ex
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Bean Validation failures: returns a map of {@code fieldName -> errorMessage}
     * under the "error" key instead of a plain string.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
        MethodArgumentNotValidException ex
    ) {
        Map<String, String> fieldErrors = ex
            .getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(
                Collectors.toMap(
                    FieldError::getField,
                    fe ->
                        fe.getDefaultMessage() != null
                            ? fe.getDefaultMessage()
                            : "Invalid value",
                    // keep first message when the same field has multiple violations
                    (existing, replacement) -> existing
                )
            );

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", fieldErrors);
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(
        HttpMessageNotReadableException ex
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Malformed JSON request");
    }

    // ── 401 ──────────────────────────────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(
        BadCredentialsException ex
    ) {
        return buildResponse(
            HttpStatus.UNAUTHORIZED,
            "Email ou mot de passe incorrect"
        );
    }

    @ExceptionHandler({ DisabledException.class, LockedException.class })
    public ResponseEntity<Map<String, Object>> handleAccountStatus(
        Exception ex
    ) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    // ── 403 ──────────────────────────────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
        AccessDeniedException ex
    ) {
        return buildResponse(HttpStatus.FORBIDDEN, "Accès refusé");
    }

    /** Keeps the status chosen by the code (404, 403…) instead of turning it into a 500. */
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
        org.springframework.web.server.ResponseStatusException ex
    ) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        return buildResponse(
            status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR,
            ex.getReason() != null ? ex.getReason() : String.valueOf(status)
        );
    }

    // ── 500 ──────────────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Internal server error"
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> buildResponse(
        HttpStatus status,
        String message
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", message);
        body.put("message", message);
        body.put("status", status.value());
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(status).body(body);
    }
}
