package com.lumastudio.mapper;

import com.lumastudio.domain.CreationJob;
import com.lumastudio.domain.JobAssetRow;
import com.lumastudio.domain.JobEvent;
import com.lumastudio.domain.JobStage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.util.List;

@Mapper
public interface JobMapper {
    void insertJob(CreationJob job);

    void insertJobAsset(@Param("jobId") String jobId,
                        @Param("assetId") String assetId,
                        @Param("sortOrder") int sortOrder);

    void insertEvent(JobEvent event);

    int nextEventSequence(@Param("jobId") String jobId);

    CreationJob findById(@Param("id") String id);

    List<CreationJob> findForUser(@Param("userId") String userId,
                                  @Param("templateId") String templateId,
                                  @Param("status") String status,
                                  @Param("limit") int limit);

    List<JobAssetRow> findAssetRowsByJobIds(@Param("jobIds") List<String> jobIds);

    List<JobEvent> findEvents(@Param("jobId") String jobId);

    int markProcessing(@Param("id") String id,
                       @Param("stage") JobStage stage,
                       @Param("progress") int progress,
                       @Param("now") Instant now);

    int advanceStage(@Param("id") String id,
                     @Param("stage") JobStage stage,
                     @Param("progress") int progress,
                     @Param("now") Instant now);

    int markSucceeded(@Param("id") String id,
                      @Param("resultUrl") String resultUrl,
                      @Param("now") Instant now);

    int markFailed(@Param("id") String id,
                   @Param("failureStage") JobStage failureStage,
                   @Param("failureReason") String failureReason,
                   @Param("progress") int progress,
                   @Param("now") Instant now);

    int deleteTerminalForUser(@Param("id") String id,
                              @Param("userId") String userId);

    int failUnfinishedOnStartup(@Param("reason") String reason,
                                @Param("now") Instant now);
}
