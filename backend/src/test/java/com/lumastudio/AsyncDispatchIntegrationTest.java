package com.lumastudio;

import com.lumastudio.domain.AppUser;
import com.lumastudio.domain.JobStatus;
import com.lumastudio.dto.CreateJobRequest;
import com.lumastudio.dto.JobResponse;
import com.lumastudio.dto.UploadResponse;
import com.lumastudio.mapper.UserMapper;
import com.lumastudio.service.JobDispatcher;
import com.lumastudio.service.JobService;
import com.lumastudio.service.SimulationService;
import com.lumastudio.service.UploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * Verifies the real background executor path, including the fact that accepting
 * a job returns before later steps are complete.
 */
@SpringBootTest
@ActiveProfiles("test")
class AsyncDispatchIntegrationTest {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UploadService uploadService;

    @Autowired
    private JobService jobService;

    @Autowired
    private JobDispatcher jobDispatcher;

    @Autowired
    private SimulationService simulationService;

    @BeforeEach
    void setUp() {
        simulationService.update(80L, "NONE", true);
    }

    @Test
    void acceptReturnsQueuedJobAndBackgroundExecutorFinishesIt() throws IOException {
        AppUser user = userMapper.findById("usr_junpeng");
        byte[] bytes = new ClassPathResource("static/media/templates/pet-sticker.jpg")
                .getInputStream().readAllBytes();
        UploadResponse asset = uploadService.upload(
                user,
                new MockMultipartFile("file", "pet.jpg", "image/jpeg", bytes)
        );

        JobResponse accepted = jobService.accept(
                user,
                new CreateJobRequest("pet-sticker", List.of(asset.id()))
        );
        assertThat(accepted.status()).isEqualTo(JobStatus.QUEUED);

        jobDispatcher.dispatch(accepted.id());

        await().atMost(Duration.ofSeconds(8)).untilAsserted(() -> {
            JobResponse current = jobService.getForUser(user, accepted.id(), true);
            assertThat(current.status()).isIn(JobStatus.SUCCEEDED, JobStatus.FAILED);
            assertThat(current.status()).isEqualTo(JobStatus.SUCCEEDED);
            assertThat(current.stage().name()).isEqualTo("COMPLETED");
            assertThat(current.resultUrl()).isNotBlank();
        });
    }
}
