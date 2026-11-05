package com.lumastudio.service;

import com.lumastudio.config.StorageProperties;
import com.lumastudio.exception.ApiException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {
    private static final int MAX_IMAGE_DIMENSION = 12000;

    private final StorageProperties properties;
    private Path uploadRoot;

    @PostConstruct
    void initialize() {
        uploadRoot = properties.getUploadDir().toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadRoot);
            log.info("Upload storage ready at {}", uploadRoot);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot create upload directory " + uploadRoot, exception);
        }
    }

    public Path getUploadRoot() {
        return uploadRoot;
    }

    public StoredImage store(MultipartFile file, String userId) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("EMPTY_FILE", "上传的图片为空");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw ApiException.badRequest("FILE_READ_FAILED", "无法读取上传的图片");
        }
        if (bytes.length > properties.getMaxFileSizeBytes()) {
            throw ApiException.badRequest("FILE_TOO_LARGE", "图片超过服务器允许的大小");
        }

        ImageFormat format = detectFormat(bytes);
        int[] dimensions = readDimensions(bytes, format);
        String extension = format == ImageFormat.JPEG ? ".jpg" : ".png";
        String fileName = UUID.randomUUID().toString().replace("-", "") + extension;
        Path userDirectory = uploadRoot.resolve(userId).normalize();
        if (!userDirectory.startsWith(uploadRoot)) {
            throw ApiException.badRequest("INVALID_PATH", "无效的存储路径");
        }
        Path destination = userDirectory.resolve(fileName).normalize();
        try {
            Files.createDirectories(userDirectory);
            Files.write(destination, bytes, StandardOpenOption.CREATE_NEW);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot store uploaded image", exception);
        }

        String safeOriginal = sanitizeFilename(file.getOriginalFilename());
        String publicUrl = "/media/uploads/" + userId + "/" + fileName;
        return new StoredImage(
                destination.toString(),
                publicUrl,
                format.mimeType,
                bytes.length,
                dimensions[0],
                dimensions[1],
                safeOriginal
        );
    }

    public boolean assetFileExists(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return false;
        }
        try {
            Path path = Path.of(storedPath).toAbsolutePath().normalize();
            return path.startsWith(uploadRoot) && Files.isRegularFile(path) && Files.size(path) > 0;
        } catch (Exception exception) {
            return false;
        }
    }

    private ImageFormat detectFormat(byte[] bytes) {
        if (bytes.length >= 4
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return ImageFormat.JPEG;
        }
        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A) {
            return ImageFormat.PNG;
        }
        throw ApiException.badRequest("UNSUPPORTED_IMAGE_TYPE", "仅支持 JPEG 或 PNG 图片");
    }

    private int[] readDimensions(byte[] bytes, ImageFormat format) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (input == null) {
                throw ApiException.badRequest("INVALID_IMAGE", "无法解析这张图片");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw ApiException.badRequest("INVALID_IMAGE", "无法解析这张图片");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String discovered = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!discovered.contains(format.formatName)) {
                    throw ApiException.badRequest("INVALID_IMAGE", "图片内容与格式不匹配");
                }
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0) {
                    throw ApiException.badRequest("INVALID_IMAGE", "图片尺寸无效");
                }
                if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                    throw ApiException.badRequest("IMAGE_TOO_LARGE", "图片分辨率过大");
                }
                return new int[]{width, height};
            } finally {
                reader.dispose();
            }
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw ApiException.badRequest("INVALID_IMAGE", "无法解析这张图片");
        }
    }

    private String sanitizeFilename(String originalFilename) {
        String value = StringUtils.hasText(originalFilename) ? originalFilename : "image";
        value = value.replace('\\', '/');
        int slash = value.lastIndexOf('/');
        if (slash >= 0) {
            value = value.substring(slash + 1);
        }
        value = value.replaceAll("[\\p{Cntrl}]", "").trim();
        if (value.isEmpty()) {
            value = "image";
        }
        return value.length() > 180 ? value.substring(0, 180) : value;
    }

    private enum ImageFormat {
        JPEG("image/jpeg", "jpeg"),
        PNG("image/png", "png");

        private final String mimeType;
        private final String formatName;

        ImageFormat(String mimeType, String formatName) {
            this.mimeType = mimeType;
            this.formatName = formatName;
        }
    }

    public record StoredImage(
            String storedPath,
            String publicUrl,
            String mimeType,
            long sizeBytes,
            int width,
            int height,
            String originalFilename
    ) {
    }
}
