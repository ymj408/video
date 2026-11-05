package com.lumastudio.dto;

public record CategoryResponse(
        String slug,
        String label,
        int count
) {
}
