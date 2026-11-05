package com.lumastudio.web;

import com.lumastudio.dto.SimulationResponse;
import com.lumastudio.dto.SimulationUpdateRequest;
import com.lumastudio.service.SimulationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Development-only controls for the deterministic simulator. This endpoint is
 * absent when app.simulation.control-enabled=false.
 */
@RestController
@RequestMapping("/api/dev/simulation")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.simulation", name = "control-enabled", havingValue = "true", matchIfMissing = true)
public class DevSimulationController {
    private final SimulationService simulationService;

    @GetMapping
    public SimulationResponse current() {
        return simulationService.snapshot();
    }

    @PutMapping
    public SimulationResponse update(@Valid @RequestBody SimulationUpdateRequest request) {
        return simulationService.update(request.stepDelayMs(), request.failStage(), request.failNextOnly());
    }
}
