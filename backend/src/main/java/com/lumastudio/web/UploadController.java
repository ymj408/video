package com.lumastudio.web;

import com.lumastudio.domain.AppUser;
import com.lumastudio.dto.UploadResponse;
import com.lumastudio.service.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {
    private final UploadService uploadService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(
            @RequestAttribute(UserContextInterceptor.CURRENT_USER_ATTRIBUTE) AppUser user,
            @RequestParam("file") MultipartFile file
    ) {
        return uploadService.upload(user, file);
    }
}
