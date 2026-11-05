package com.lumastudio.dto;

import java.util.List;

public record SimulationResponse(
        boolean controlEnabled,
        long stepDelayMs,
        String failStage,
        boolean failNextOnly,
        List<String> availableStages
) {
}
