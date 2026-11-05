package com.lumastudio.service;

import com.lumastudio.domain.AppUser;
import com.lumastudio.exception.ApiException;
import com.lumastudio.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserMapper userMapper;

    public List<AppUser> demoUsers() {
        return userMapper.findAll();
    }

    public AppUser requireUser(String userId) {
        AppUser user = userMapper.findById(userId);
        if (user == null) {
            throw ApiException.unauthorized("UNKNOWN_USER", "当前演示账号不存在，请重新选择");
        }
        return user;
    }
}
