package com.lumastudio.dto;

import java.time.Instant;
import java.util.Map;

public record ApiError(
        String code,
        String message,
        Instant timestamp,
        Map<String, String> fieldErrors
) {
    public ApiError(String code, String message) {
        this(code, message, Instant.now(), null);
    }
}
