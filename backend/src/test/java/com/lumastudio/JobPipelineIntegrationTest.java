package com.lumastudio;

import com.lumastudio.domain.AppUser;
import com.lumastudio.domain.JobStage;
import com.lumastudio.domain.JobStatus;
import com.lumastudio.dto.CreateJobRequest;
import com.lumastudio.dto.JobResponse;
import com.lumastudio.dto.UploadResponse;
import com.lumastudio.exception.ApiException;
import com.lumastudio.mapper.UserMapper;
import com.lumastudio.service.JobProcessor;
import com.lumastudio.service.JobService;
import com.lumastudio.service.SimulationService;
import com.lumastudio.service.UploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JobPipelineIntegrationTest {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UploadService uploadService;

    @Autowired
    private JobService jobService;

    @Autowired
    private JobProcessor jobProcessor;

    @Autowired
    private SimulationService simulationService;

    private AppUser junpeng;
    private AppUser mia;

    @BeforeEach
    void setUp() {
        junpeng = userMapper.findById("usr_junpeng");
        mia = userMapper.findById("usr_mia");
        simulationService.update(0L, "NONE", true);
    }

    @Test
    void successfulPipelinePersistsEveryStageInOrderAndKeepsResult() {
        UploadResponse asset = upload(junpeng, "pet-sticker");
        JobResponse accepted = jobService.accept(
                junpeng,
                new CreateJobRequest("pet-sticker", List.of(asset.id()))
        );

        assertThat(accepted.status()).isEqualTo(JobStatus.QUEUED);
        assertThat(accepted.stage()).isEqualTo(JobStage.QUEUED);
        assertThat(accepted.resultUrl()).isNull();

        // Querying is strictly read-only: it must not advance the job.
        JobResponse queryOne = jobService.getForUser(junpeng, accepted.id(), true);
        JobResponse queryTwo = jobService.getForUser(junpeng, accepted.id(), true);
        assertThat(queryOne.stage()).isEqualTo(JobStage.QUEUED);
        assertThat(queryTwo.stage()).isEqualTo(JobStage.QUEUED);
        assertThat(queryTwo.events()).hasSize(1);

        jobProcessor.process(accepted.id());
        JobResponse finished = jobService.getForUser(junpeng, accepted.id(), true);

        assertThat(finished.status()).isEqualTo(JobStatus.SUCCEEDED);
        assertThat(finished.stage()).isEqualTo(JobStage.COMPLETED);
        assertThat(finished.resultUrl()).isEqualTo("/media/results/pet-sticker.jpg");
        assertThat(finished.failureStage()).isNull();
        assertThat(finished.failureReason()).isNull();
        assertThat(finished.events())
                .extracting(event -> event.stage())
                .containsExactly(
                        JobStage.QUEUED,
                        JobStage.VALIDATING,
                        JobStage.GENERATING,
                        JobStage.FINALIZING,
                        JobStage.COMPLETED
                );
        assertThat(finished.events().get(finished.events().size() - 1).status())
                .isEqualTo(JobStatus.SUCCEEDED);

        // A completed job must remain completed after any number of reads.
        JobResponse finishedAgain = jobService.getForUser(junpeng, accepted.id(), false);
        assertThat(finishedAgain.status()).isEqualTo(JobStatus.SUCCEEDED);
        assertThat(finishedAgain.stage()).isEqualTo(JobStage.COMPLETED);
    }

    @ParameterizedTest
    @EnumSource(value = JobStage.class, names = {"VALIDATING", "GENERATING", "FINALIZING"})
    void configuredFailureStopsAtTheChosenStageAndSkipsRemainingWork(JobStage failureStage) {
        simulationService.update(0L, failureStage.name(), true);
        UploadResponse asset = upload(junpeng, "pet-sticker");
        JobResponse accepted = jobService.accept(
                junpeng,
                new CreateJobRequest("pet-sticker", List.of(asset.id()))
        );

        jobProcessor.process(accepted.id());
        JobResponse failed = jobService.getForUser(junpeng, accepted.id(), true);

        assertThat(failed.status()).isEqualTo(JobStatus.FAILED);
        assertThat(failed.stage()).isEqualTo(JobStage.FAILED);
        assertThat(failed.failureStage()).isEqualTo(failureStage);
        assertThat(failed.failureReason()).contains("模拟失败").contains(stageName(failureStage));
        assertThat(failed.resultUrl()).isNull();

        List<JobStage> stages = failed.events().stream().map(event -> event.stage()).toList();
        assertThat(stages.get(stages.size() - 1)).isEqualTo(failureStage);
        assertThat(stages).doesNotContain(JobStage.COMPLETED);
        assertThat(failed.events().get(failed.events().size() - 1).status()).isEqualTo(JobStatus.FAILED);

        if (failureStage == JobStage.VALIDATING) {
            assertThat(stages).doesNotContain(JobStage.GENERATING, JobStage.FINALIZING);
        }
        if (failureStage == JobStage.GENERATING) {
            assertThat(stages).doesNotContain(JobStage.FINALIZING);
        }
    }

    @Test
    void rejectsWrongImageCountBeforeCreatingAJob() {
        UploadResponse asset = upload(junpeng, "pet-sticker");

        assertThatThrownBy(() -> jobService.accept(
                junpeng,
                new CreateJobRequest("pet-editorial", List.of(asset.id()))
        ))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("IMAGE_COUNT_MISMATCH");
    }

    @Test
    void rejectsAnotherUsersAssetAndKeepsPersonalHistorySeparate() {
        UploadResponse asset = upload(junpeng, "pet-sticker");

        assertThatThrownBy(() -> jobService.accept(
                mia,
                new CreateJobRequest("pet-sticker", List.of(asset.id()))
        ))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("ASSET_FORBIDDEN");

        JobResponse job = jobService.accept(
                junpeng,
                new CreateJobRequest("pet-sticker", List.of(asset.id()))
        );

        assertThat(jobService.listForUser(mia, null, null, 50)).isEmpty();
        assertThat(jobService.listForUser(junpeng, null, null, 50))
                .extracting(JobResponse::id)
                .contains(job.id());

        assertThatThrownBy(() -> jobService.getForUser(mia, job.id(), true))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("JOB_NOT_FOUND");
    }

    private UploadResponse upload(AppUser user, String templateName) {
        try {
            byte[] bytes = new ClassPathResource(
                    "static/media/templates/" + templateName + ".jpg"
            ).getInputStream().readAllBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    templateName + ".jpg",
                    "image/jpeg",
                    bytes
            );
            return uploadService.upload(user, file);
        } catch (IOException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String stageName(JobStage stage) {
        return switch (stage) {
            case VALIDATING -> "素材检查";
            case GENERATING -> "模拟生成";
            case FINALIZING -> "结果整理";
            default -> stage.name();
        };
    }
}
