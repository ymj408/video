package com.lumastudio.mapper;

import com.lumastudio.domain.UploadedAsset;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AssetMapper {
    void insert(UploadedAsset asset);

    UploadedAsset findById(@Param("id") String id);

    List<UploadedAsset> findByIdIn(@Param("ids") List<String> ids);
}
