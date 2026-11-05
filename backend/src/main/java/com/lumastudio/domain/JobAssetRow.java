package com.lumastudio.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Flat projection of uploaded_asset joined with job_asset, used to avoid an
 * N+1 query when rendering a feed of jobs.
 */
@Getter
@Setter
@NoArgsConstructor
public class JobAssetRow {
    private String jobId;
    private String id;
    private String ownerUserId;
    private String originalFilename;
    private String storedPath;
    private String publicUrl;
    private String mimeType;
    private long sizeBytes;
    private int width;
    private int height;
    private int sortOrder;
}
