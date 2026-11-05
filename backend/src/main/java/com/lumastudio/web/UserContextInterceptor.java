package com.lumastudio.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumastudio.domain.AppUser;
import com.lumastudio.dto.ApiError;
import com.lumastudio.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class UserContextInterceptor implements HandlerInterceptor {
    public static final String CURRENT_USER_ATTRIBUTE = "currentUser";

    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            writeUnauthorized(response, "AUTH_REQUIRED", "请先选择一个演示账号");
            return false;
        }
        AppUser user = userMapper.findById(userId.trim());
        if (user == null) {
            writeUnauthorized(response, "UNKNOWN_USER", "当前演示账号不存在，请重新选择");
            return false;
        }
        request.setAttribute(CURRENT_USER_ATTRIBUTE, user);
        return true;
    }

    private void writeUnauthorized(HttpServletResponse response, String code, String message) throws Exception {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new ApiError(code, message));
    }
}
