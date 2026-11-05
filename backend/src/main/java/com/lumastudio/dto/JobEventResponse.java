package com.lumastudio.dto;

import com.lumastudio.domain.JobStage;
import com.lumastudio.domain.JobStatus;

import java.time.Instant;

public record JobEventResponse(
        int seq,
        JobStage stage,
        JobStatus status,
        String message,
        Instant createdAt
) {
}
