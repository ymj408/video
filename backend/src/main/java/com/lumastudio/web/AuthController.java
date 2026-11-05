package com.lumastudio.web;

import com.lumastudio.domain.AppUser;
import com.lumastudio.dto.LoginRequest;
import com.lumastudio.dto.UserResponse;
import com.lumastudio.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @GetMapping("/users")
    public List<UserResponse> demoUsers() {
        return authService.demoUsers().stream().map(UserResponse::from).toList();
    }

    @GetMapping("/me")
    public UserResponse me(
            @RequestAttribute(UserContextInterceptor.CURRENT_USER_ATTRIBUTE) AppUser user
    ) {
        return UserResponse.from(user);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request) {
        return UserResponse.from(authService.requireUser(request.userId()));
    }
}
