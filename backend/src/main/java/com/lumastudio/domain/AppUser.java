package com.lumastudio.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
public class AppUser {
    private String id;
    private String displayName;
    private String email;
    private String avatarColor;
    private String planName;
    private int credits;
    private Instant createdAt;
}
