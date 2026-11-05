package com.lumastudio.service;

import com.lumastudio.domain.JobStage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class JobDispatcher {
    private final ThreadPoolTaskExecutor executor;
    private final JobProcessor processor;
    private final JobTransitionService transitions;

    public JobDispatcher(
            @Qualifier("jobExecutor") ThreadPoolTaskExecutor executor,
            JobProcessor processor,
            JobTransitionService transitions
    ) {
        this.executor = executor;
        this.processor = processor;
        this.transitions = transitions;
    }

    public void dispatch(String jobId) {
        try {
            executor.execute(() -> processor.process(jobId));
            log.info("Job {} accepted by background executor", jobId);
        } catch (TaskRejectedException exception) {
            log.error("Job {} rejected by background executor", jobId, exception);
            transitions.fail(
                    jobId,
                    JobStage.QUEUED,
                    "后台任务队列已满，任务未能开始执行，请稍后重新创建。",
                    0
            );
        }
    }
}
