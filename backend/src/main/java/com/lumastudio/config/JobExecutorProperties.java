package com.lumastudio.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jobs")
public class JobExecutorProperties {
    private int corePoolSize = 2;
    private int maxPoolSize = 4;
    private int queueCapacity = 100;
}
