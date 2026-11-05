package com.lumastudio.service;

import com.lumastudio.domain.CreationJob;
import com.lumastudio.domain.JobAssetRow;
import com.lumastudio.domain.JobStage;
import com.lumastudio.domain.JobStatus;
import com.lumastudio.mapper.JobMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobProcessor {
    private final JobMapper jobMapper;
    private final JobTransitionService transitions;
    private final SimulationService simulationService;
    private final StorageService storageService;

    /**
     * Executes one job start-to-finish. The method is intentionally synchronous
     * so it can be called directly from tests; production dispatch happens on
     * the bounded jobExecutor thread pool.
     */
    public void process(String jobId) {
        CreationJob job = jobMapper.findById(jobId);
        if (job == null || job.getStatus() != JobStatus.QUEUED) {
            return;
        }

        JobStage currentStage = JobStage.QUEUED;
        try {
            if (!transitions.start(jobId)) {
                log.info("Job {} was not claimed because it is no longer queued", jobId);
                return;
            }
            currentStage = JobStage.VALIDATING;
            pause();

            if (simulationService.shouldFailAt(JobStage.VALIDATING)) {
                failAt(jobId, JobStage.VALIDATING, "模拟失败：素材检查阶段被调试开关中断。");
                return;
            }
            String validationError = validateAssets(job);
            if (validationError != null) {
                failAt(jobId, JobStage.VALIDATING, validationError);
                return;
            }

            currentStage = JobStage.GENERATING;
            if (!transitions.advance(
                    jobId,
                    JobStage.GENERATING,
                    55,
                    "素材检查通过，正在模拟生成画面")) {
                return;
            }
            pause();

            if (simulationService.shouldFailAt(JobStage.GENERATING)) {
                failAt(jobId, JobStage.GENERATING, "模拟失败：模拟生成阶段被调试开关中断。");
                return;
            }
            if (job.getTargetResultUrl() == null || job.getTargetResultUrl().isBlank()) {
                failAt(jobId, JobStage.GENERATING, "模板缺少成品配置，无法整理结果。");
                return;
            }

            currentStage = JobStage.FINALIZING;
            if (!transitions.advance(
                    jobId,
                    JobStage.FINALIZING,
                    82,
                    "画面生成完成，正在整理可预览的成品")) {
                return;
            }
            pause();

            if (simulationService.shouldFailAt(JobStage.FINALIZING)) {
                failAt(jobId, JobStage.FINALIZING, "模拟失败：结果整理阶段被调试开关中断。");
                return;
            }

            if (!transitions.succeed(jobId, job.getTargetResultUrl())) {
                log.warn("Job {} could not be marked successful; it may have been cancelled", jobId);
                return;
            }
            log.info("Job {} completed successfully", jobId);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            transitions.fail(jobId, currentStage, "后台任务被中断，未能完成制作。", progressOf(currentStage));
            log.warn("Job {} was interrupted", jobId);
        } catch (Exception exception) {
            log.error("Job {} failed unexpectedly", jobId, exception);
            transitions.fail(
                    jobId,
                    currentStage,
                    "后台处理出现异常，任务已停止。请重新创建任务。",
                    progressOf(currentStage)
            );
        }
    }

    private void pause() throws InterruptedException {
        long delay = simulationService.currentDelayMs();
        if (delay > 0) {
            Thread.sleep(delay);
        }
    }

    private String validateAssets(CreationJob job) {
        List<JobAssetRow> assets = jobMapper.findAssetRowsByJobIds(List.of(job.getId()));
        if (assets.size() != job.getAssetCount()) {
            return "素材检查失败：图片数量与任务记录不一致。";
        }
        for (JobAssetRow asset : assets) {
            if (!job.getUserId().equals(asset.getOwnerUserId())) {
                return "素材检查失败：图片不属于当前账号。";
            }
            if (!"image/jpeg".equals(asset.getMimeType()) && !"image/png".equals(asset.getMimeType())) {
                return "素材检查失败：仅支持 JPEG 或 PNG 图片。";
            }
            if (!storageService.assetFileExists(asset.getStoredPath())) {
                return "素材检查失败：上传的图片文件已不可用，请重新上传。";
            }
        }
        return null;
    }

    private void failAt(String jobId, JobStage stage, String reason) {
        transitions.fail(jobId, stage, reason, progressOf(stage));
        log.info("Job {} failed at {}: {}", jobId, stage, reason);
    }

    private int progressOf(JobStage stage) {
        return switch (stage) {
            case QUEUED -> 4;
            case VALIDATING -> 18;
            case GENERATING -> 55;
            case FINALIZING -> 82;
            case COMPLETED -> 100;
            case FAILED -> 82;
        };
    }
}
