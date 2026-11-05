package com.lumastudio.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
public class JobEvent {
    private String id;
    private String jobId;
    private int seqNo;
    private JobStage stage;
    private JobStatus status;
    private String message;
    private Instant createdAt;
}
