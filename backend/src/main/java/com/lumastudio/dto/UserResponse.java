package com.lumastudio.dto;

import com.lumastudio.domain.AppUser;

import java.time.Instant;

public record UserResponse(
        String id,
        String displayName,
        String email,
        String avatarColor,
        String planName,
        int credits,
        Instant createdAt
) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getDisplayName(),
                user.getEmail(),
                user.getAvatarColor(),
                user.getPlanName(),
                user.getCredits(),
                user.getCreatedAt()
        );
    }
}
