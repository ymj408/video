package com.lumastudio.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank(message = "请选择一个演示账号") String userId) {
}
