package com.lumastudio.dto;

import com.lumastudio.domain.CreationTemplate;

import java.util.Arrays;
import java.util.List;

public record TemplateResponse(
        String id,
        String title,
        String category,
        String categoryLabel,
        String description,
        String coverUrl,
        int requiredImageCount,
        List<String> acceptedMimeTypes,
        long maxFileSizeBytes,
        boolean featured
) {
    public static TemplateResponse from(CreationTemplate template) {
        List<String> mimeTypes = Arrays.stream(template.getAcceptedMimeTypes().split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
        return new TemplateResponse(
                template.getId(),
                template.getTitle(),
                template.getCategorySlug(),
                template.getCategoryLabel(),
                template.getDescription(),
                template.getCoverUrl(),
                template.getRequiredImageCount(),
                mimeTypes,
                template.getMaxFileSizeBytes(),
                template.isFeatured()
        );
    }
}
