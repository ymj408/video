package com.lumastudio.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.simulation")
public class SimulationProperties {
    private long stepDelayMs = 2500;
    private String failStage = "NONE";
    private boolean failNextOnly = true;
    private boolean controlEnabled = true;
}
