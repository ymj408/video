package com.lumastudio.dto;

public record JobAssetResponse(
        String id,
        String url,
        String mimeType,
        long sizeBytes,
        int width,
        int height
) {
}
