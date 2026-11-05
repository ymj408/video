package com.lumastudio.service;

import com.lumastudio.domain.JobEvent;
import com.lumastudio.domain.JobStage;
import com.lumastudio.domain.JobStatus;
import com.lumastudio.mapper.JobMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobTransitionService {
    private final JobMapper jobMapper;

    @Transactional
    public boolean start(String jobId) {
        Instant now = Instant.now();
        int changed = jobMapper.markProcessing(jobId, JobStage.VALIDATING, 18, now);
        if (changed == 1) {
            appendEvent(jobId, JobStage.VALIDATING, JobStatus.PROCESSING,
                    "素材检查开始，后台正在核对图片与模板要求", now);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean advance(String jobId, JobStage stage, int progress, String message) {
        Instant now = Instant.now();
        int changed = jobMapper.advanceStage(jobId, stage, progress, now);
        if (changed == 1) {
            appendEvent(jobId, stage, JobStatus.PROCESSING, message, now);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean succeed(String jobId, String resultUrl) {
        Instant now = Instant.now();
        int changed = jobMapper.markSucceeded(jobId, resultUrl, now);
        if (changed == 1) {
            appendEvent(jobId, JobStage.COMPLETED, JobStatus.SUCCEEDED,
                    "结果整理完成，成品已经可以预览", now);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean fail(String jobId, JobStage failureStage, String reason, int progress) {
        Instant now = Instant.now();
        int changed = jobMapper.markFailed(
                jobId,
                failureStage,
                truncate(reason, 580),
                progress,
                now
        );
        if (changed == 1) {
            appendEvent(jobId, failureStage, JobStatus.FAILED,
                    truncate(reason, 580), now);
            return true;
        }
        return false;
    }

    private void appendEvent(String jobId, JobStage stage, JobStatus status, String message, Instant now) {
        JobEvent event = new JobEvent();
        event.setId("evt_" + UUID.randomUUID().toString().replace("-", ""));
        event.setJobId(jobId);
        event.setSeqNo(jobMapper.nextEventSequence(jobId));
        event.setStage(stage);
        event.setStatus(status);
        event.setMessage(truncate(message, 580));
        event.setCreatedAt(now);
        jobMapper.insertEvent(event);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
