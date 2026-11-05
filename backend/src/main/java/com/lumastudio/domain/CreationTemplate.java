package com.lumastudio.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
public class CreationTemplate {
    private String id;
    private String title;
    private String categorySlug;
    private String categoryLabel;
    private String description;
    private String coverUrl;
    private String targetResultUrl;
    private int requiredImageCount;
    private String acceptedMimeTypes;
    private long maxFileSizeBytes;
    private boolean featured;
    private int sortOrder;
    private Instant createdAt;
}
