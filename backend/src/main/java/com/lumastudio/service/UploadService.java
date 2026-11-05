package com.lumastudio.service;

import com.lumastudio.domain.AppUser;
import com.lumastudio.domain.UploadedAsset;
import com.lumastudio.dto.UploadResponse;
import com.lumastudio.mapper.AssetMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {
    private final StorageService storageService;
    private final AssetMapper assetMapper;

    @Transactional
    public UploadResponse upload(AppUser user, MultipartFile file) {
        StorageService.StoredImage stored = storageService.store(file, user.getId());
        UploadedAsset asset = new UploadedAsset();
        asset.setId("ast_" + UUID.randomUUID().toString().replace("-", ""));
        asset.setOwnerUserId(user.getId());
        asset.setOriginalFilename(stored.originalFilename());
        asset.setStoredPath(stored.storedPath());
        asset.setPublicUrl(stored.publicUrl());
        asset.setMimeType(stored.mimeType());
        asset.setSizeBytes(stored.sizeBytes());
        asset.setWidth(stored.width());
        asset.setHeight(stored.height());
        asset.setCreatedAt(Instant.now());
        assetMapper.insert(asset);

        return new UploadResponse(
                asset.getId(),
                asset.getOriginalFilename(),
                asset.getPublicUrl(),
                asset.getMimeType(),
                asset.getSizeBytes(),
                asset.getWidth(),
                asset.getHeight()
        );
    }
}
