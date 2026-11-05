package com.lumastudio.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.file.Path;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {
    private Path uploadDir = Path.of("./data/uploads");
    private long maxFileSizeBytes = 10 * 1024 * 1024;
}
