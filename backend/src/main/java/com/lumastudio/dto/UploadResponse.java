package com.lumastudio.dto;

public record UploadResponse(
        String id,
        String originalFilename,
        String url,
        String mimeType,
        long sizeBytes,
        int width,
        int height
) {
}
