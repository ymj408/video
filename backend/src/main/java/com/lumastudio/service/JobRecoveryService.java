package com.lumastudio.service;

import com.lumastudio.mapper.JobMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobRecoveryService {
    private final JobMapper jobMapper;

    @Value("${app.recovery.fail-unfinished-on-startup:true}")
    private boolean failUnfinishedOnStartup;

    @EventListener(ApplicationReadyEvent.class)
    public void failUnfinishedJobs() {
        if (!failUnfinishedOnStartup) {
            return;
        }
        int count = jobMapper.failUnfinishedOnStartup(
                "服务已重启，未完成的后台任务已停止；当前版本不执行断点续跑。",
                Instant.now()
        );
        if (count > 0) {
            log.warn("Marked {} unfinished jobs as failed after application startup", count);
        }
    }
}
