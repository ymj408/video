package com.lumastudio.mapper;

import com.lumastudio.domain.AppUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {
    AppUser findById(@Param("id") String id);

    List<AppUser> findAll();
}
