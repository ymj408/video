package com.lumastudio.service;

import com.lumastudio.domain.AppUser;
import com.lumastudio.domain.CreationJob;
import com.lumastudio.domain.CreationTemplate;
import com.lumastudio.domain.JobAssetRow;
import com.lumastudio.domain.JobEvent;
import com.lumastudio.domain.JobStage;
import com.lumastudio.domain.JobStatus;
import com.lumastudio.domain.UploadedAsset;
import com.lumastudio.dto.CreateJobRequest;
import com.lumastudio.dto.JobAssetResponse;
import com.lumastudio.dto.JobEventResponse;
import com.lumastudio.dto.JobResponse;
import com.lumastudio.exception.ApiException;
import com.lumastudio.mapper.AssetMapper;
import com.lumastudio.mapper.JobMapper;
import com.lumastudio.mapper.TemplateMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {
    private final TemplateMapper templateMapper;
    private final AssetMapper assetMapper;
    private final JobMapper jobMapper;

    @Transactional
    public JobResponse accept(AppUser user, CreateJobRequest request) {
        CreationTemplate template = templateMapper.findById(request.templateId());
        if (template == null) {
            throw ApiException.notFound("TEMPLATE_NOT_FOUND", "模板不存在或已下架");
        }

        List<String> assetIds = request.assetIds();
        if (assetIds.size() != template.getRequiredImageCount()) {
            throw ApiException.badRequest(
                    "IMAGE_COUNT_MISMATCH",
                    "「" + template.getTitle() + "」需要 " + template.getRequiredImageCount()
                            + " 张图片，当前为 " + assetIds.size() + " 张"
            );
        }
        if (new HashSet<>(assetIds).size() != assetIds.size()) {
            throw ApiException.badRequest("DUPLICATE_ASSET", "同一张素材不能重复提交");
        }

        List<UploadedAsset> assets = assetMapper.findByIdIn(assetIds);
        if (assets.size() != assetIds.size()) {
            throw ApiException.badRequest("ASSET_NOT_FOUND", "部分素材不存在，请重新上传");
        }
        Map<String, UploadedAsset> byId = assets.stream()
                .collect(Collectors.toMap(UploadedAsset::getId, Function.identity()));
        Set<String> acceptedTypes = new HashSet<>();
        for (String mimeType : template.getAcceptedMimeTypes().split(",")) {
            acceptedTypes.add(mimeType.trim().toLowerCase(Locale.ROOT));
        }
        for (String assetId : assetIds) {
            UploadedAsset asset = byId.get(assetId);
            if (asset == null) {
                throw ApiException.badRequest("ASSET_NOT_FOUND", "部分素材不存在，请重新上传");
            }
            if (!user.getId().equals(asset.getOwnerUserId())) {
                throw ApiException.forbidden("ASSET_FORBIDDEN", "素材不属于当前账号");
            }
            if (!acceptedTypes.contains(asset.getMimeType().toLowerCase(Locale.ROOT))) {
                throw ApiException.badRequest("ASSET_TYPE_NOT_ALLOWED", "该模板不支持此图片格式");
            }
            if (asset.getSizeBytes() > template.getMaxFileSizeBytes()) {
                throw ApiException.badRequest("ASSET_TOO_LARGE", "有图片超过模板允许的大小");
            }
        }

        Instant now = Instant.now();
        CreationJob job = new CreationJob();
        job.setId("job_" + UUID.randomUUID().toString().replace("-", ""));
        job.setUserId(user.getId());
        job.setTemplateId(template.getId());
        job.setTemplateTitle(template.getTitle());
        job.setTemplateCoverUrl(template.getCoverUrl());
        job.setStatus(JobStatus.QUEUED);
        job.setStage(JobStage.QUEUED);
        job.setProgress(4);
        job.setAssetCount(assetIds.size());
        job.setTargetResultUrl(template.getTargetResultUrl());
        job.setCreatedAt(now);
        job.setUpdatedAt(now);
        jobMapper.insertJob(job);

        for (int index = 0; index < assetIds.size(); index++) {
            jobMapper.insertJobAsset(job.getId(), assetIds.get(index), index + 1);
        }

        JobEvent acceptedEvent = new JobEvent();
        acceptedEvent.setId("evt_" + UUID.randomUUID().toString().replace("-", ""));
        acceptedEvent.setJobId(job.getId());
        acceptedEvent.setSeqNo(1);
        acceptedEvent.setStage(JobStage.QUEUED);
        acceptedEvent.setStatus(JobStatus.QUEUED);
        acceptedEvent.setMessage("任务已受理，等待后台开始处理");
        acceptedEvent.setCreatedAt(now);
        jobMapper.insertEvent(acceptedEvent);

        return toResponse(job, loadAssetRows(List.of(job.getId())), List.of(acceptedEvent));
    }

    public List<JobResponse> listForUser(AppUser user, String templateId, String status, int limit) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedTemplate = templateId == null || templateId.isBlank() ? null : templateId.trim();
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<CreationJob> jobs = jobMapper.findForUser(user.getId(), normalizedTemplate, normalizedStatus, safeLimit);
        if (jobs.isEmpty()) {
            return List.of();
        }
        Map<String, List<JobAssetRow>> assets = loadAssetRows(jobs.stream().map(CreationJob::getId).toList());
        return jobs.stream().map(job -> toResponse(job, assets, null)).toList();
    }

    public JobResponse getForUser(AppUser user, String jobId, boolean includeEvents) {
        CreationJob job = jobMapper.findById(jobId);
        if (job == null || !user.getId().equals(job.getUserId())) {
            throw ApiException.notFound("JOB_NOT_FOUND", "制作任务不存在");
        }
        Map<String, List<JobAssetRow>> assets = loadAssetRows(List.of(jobId));
        List<JobEvent> events = includeEvents ? jobMapper.findEvents(jobId) : null;
        return toResponse(job, assets, events);
    }

    @Transactional
    public void deleteForUser(AppUser user, String jobId) {
        CreationJob job = jobMapper.findById(jobId);
        if (job == null || !user.getId().equals(job.getUserId())) {
            throw ApiException.notFound("JOB_NOT_FOUND", "制作任务不存在");
        }
        if (job.getStatus() == JobStatus.QUEUED || job.getStatus() == JobStatus.PROCESSING) {
            throw ApiException.conflict("JOB_IN_PROGRESS", "任务仍在处理中，暂时不能删除");
        }
        int deleted = jobMapper.deleteTerminalForUser(jobId, user.getId());
        if (deleted != 1) {
            throw ApiException.conflict("JOB_DELETE_CONFLICT", "任务状态已变化，请刷新后重试");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            JobStatus parsed = JobStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            return parsed.name();
        } catch (IllegalArgumentException exception) {
            throw ApiException.badRequest("INVALID_JOB_STATUS", "不支持的任务状态筛选");
        }
    }

    private Map<String, List<JobAssetRow>> loadAssetRows(List<String> jobIds) {
        if (jobIds.isEmpty()) {
            return Map.of();
        }
        return jobMapper.findAssetRowsByJobIds(jobIds).stream()
                .collect(Collectors.groupingBy(
                        JobAssetRow::getJobId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private JobResponse toResponse(CreationJob job,
                                   Map<String, List<JobAssetRow>> assetRowsByJob,
                                   List<JobEvent> events) {
        List<JobAssetResponse> assets = assetRowsByJob
                .getOrDefault(job.getId(), List.of())
                .stream()
                .map(row -> new JobAssetResponse(
                        row.getId(),
                        row.getPublicUrl(),
                        row.getMimeType(),
                        row.getSizeBytes(),
                        row.getWidth(),
                        row.getHeight()
                ))
                .toList();

        List<JobEventResponse> eventResponses = null;
        if (events != null) {
            eventResponses = new ArrayList<>();
            for (JobEvent event : events) {
                eventResponses.add(new JobEventResponse(
                        event.getSeqNo(),
                        event.getStage(),
                        event.getStatus(),
                        event.getMessage(),
                        event.getCreatedAt()
                ));
            }
        }

        return new JobResponse(
                job.getId(),
                job.getTemplateId(),
                job.getTemplateTitle(),
                job.getTemplateCoverUrl(),
                job.getStatus(),
                job.getStage(),
                job.getProgress(),
                job.getAssetCount(),
                job.getResultUrl(),
                job.getFailureStage(),
                job.getFailureReason(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.getStartedAt(),
                job.getFinishedAt(),
                assets,
                eventResponses
        );
    }
}
