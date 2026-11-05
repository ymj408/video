package com.lumastudio.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record SimulationUpdateRequest(
        @Min(value = 0, message = "模拟耗时不能小于 0 毫秒")
        @Max(value = 60000, message = "模拟耗时不能超过 60000 毫秒")
        Long stepDelayMs,
        @Pattern(regexp = "NONE|VALIDATING|GENERATING|FINALIZING", message = "不支持的失败阶段")
        String failStage,
        Boolean failNextOnly
) {
}
