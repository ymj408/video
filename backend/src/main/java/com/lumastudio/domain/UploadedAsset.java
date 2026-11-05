package com.lumastudio.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
public class UploadedAsset {
    private String id;
    private String ownerUserId;
    private String originalFilename;
    private String storedPath;
    private String publicUrl;
    private String mimeType;
    private long sizeBytes;
    private int width;
    private int height;
    private Instant createdAt;
}
