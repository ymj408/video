package com.lumastudio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateJobRequest(
        @NotBlank(message = "模板不能为空") String templateId,
        @NotEmpty(message = "请至少上传一张图片")
        @Size(max = 6, message = "单个任务最多使用 6 张图片")
        List<@NotBlank(message = "素材编号不能为空") String> assetIds
) {
}
