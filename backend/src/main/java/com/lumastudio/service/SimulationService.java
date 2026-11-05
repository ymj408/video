package com.lumastudio.service;

import com.lumastudio.config.SimulationProperties;
import com.lumastudio.domain.JobStage;
import com.lumastudio.dto.SimulationResponse;
import com.lumastudio.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Slf4j
@Service
public class SimulationService {
    public static final List<JobStage> FAILABLE_STAGES = List.of(
            JobStage.VALIDATING,
            JobStage.GENERATING,
            JobStage.FINALIZING
    );

    private final SimulationProperties properties;

    private long stepDelayMs;
    private JobStage failStage;
    private boolean failNextOnly;

    public SimulationService(SimulationProperties properties) {
        this.properties = properties;
        this.stepDelayMs = clampDelay(properties.getStepDelayMs());
        this.failStage = parseStage(properties.getFailStage());
        this.failNextOnly = properties.isFailNextOnly();
    }

    public synchronized SimulationResponse snapshot() {
        return new SimulationResponse(
                properties.isControlEnabled(),
                stepDelayMs,
                failStage == JobStage.QUEUED ? "NONE" : failStage.name(),
                failNextOnly,
                FAILABLE_STAGES.stream().map(Enum::name).toList()
        );
    }

    public synchronized SimulationResponse update(Long newDelayMs, String newFailStage, Boolean newFailNextOnly) {
        if (newDelayMs != null) {
            if (newDelayMs < 0 || newDelayMs > 60_000) {
                throw ApiException.badRequest("INVALID_SIMULATION_DELAY", "模拟耗时必须在 0 到 60000 毫秒之间");
            }
            stepDelayMs = newDelayMs;
        }
        if (newFailStage != null) {
            failStage = parseStage(newFailStage);
        }
        if (newFailNextOnly != null) {
            failNextOnly = newFailNextOnly;
        }
        log.info("Simulation updated: delay={}ms, failStage={}, failNextOnly={}",
                stepDelayMs, failStage, failNextOnly);
        return snapshot();
    }

    public synchronized long currentDelayMs() {
        return stepDelayMs;
    }

    /**
     * Consumes a one-shot failure exclusively. If two jobs race for the same
     * simulated failure, only one can claim it.
     */
    public synchronized boolean shouldFailAt(JobStage stage) {
        if (failStage != stage) {
            return false;
        }
        if (!failNextOnly) {
            return true;
        }
        failStage = JobStage.QUEUED;
        return true;
    }

    private JobStage parseStage(String value) {
        if (value == null || value.isBlank()) {
            return JobStage.QUEUED;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if ("NONE".equals(normalized)) {
            return JobStage.QUEUED;
        }
        try {
            JobStage stage = JobStage.valueOf(normalized);
            if (!FAILABLE_STAGES.contains(stage)) {
                throw ApiException.badRequest(
                        "INVALID_FAIL_STAGE",
                        "失败阶段只能是 NONE、VALIDATING、GENERATING 或 FINALIZING"
                );
            }
            return stage;
        } catch (IllegalArgumentException exception) {
            throw ApiException.badRequest(
                    "INVALID_FAIL_STAGE",
                    "失败阶段只能是 NONE、VALIDATING、GENERATING 或 FINALIZING"
            );
        }
    }

    private long clampDelay(long value) {
        return Math.max(0, Math.min(value, 60_000));
    }
}
