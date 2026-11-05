package com.lumastudio.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
public class CreationJob {
    private String id;
    private String userId;
    private String templateId;
    private String templateTitle;
    private String templateCoverUrl;
    private JobStatus status;
    private JobStage stage;
    private int progress;
    private int assetCount;
    private String targetResultUrl;
    private String resultUrl;
    private JobStage failureStage;
    private String failureReason;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant startedAt;
    private Instant finishedAt;
}
