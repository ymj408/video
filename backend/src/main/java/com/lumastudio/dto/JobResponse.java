package com.lumastudio.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.lumastudio.domain.JobStage;
import com.lumastudio.domain.JobStatus;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobResponse(
        String id,
        String templateId,
        String templateTitle,
        String templateCoverUrl,
        JobStatus status,
        JobStage stage,
        int progress,
        int assetCount,
        String resultUrl,
        JobStage failureStage,
        String failureReason,
        Instant createdAt,
        Instant updatedAt,
        Instant startedAt,
        Instant finishedAt,
        List<JobAssetResponse> assets,
        List<JobEventResponse> events
) {
}
