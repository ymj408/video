package com.lumastudio.mapper;

import com.lumastudio.domain.CreationTemplate;
import com.lumastudio.domain.TemplateCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TemplateMapper {
    List<TemplateCategory> findCategories();

    List<CreationTemplate> findAll();

    List<CreationTemplate> findFeatured();

    List<CreationTemplate> findByCategory(@Param("category") String category);

    CreationTemplate findById(@Param("id") String id);
}
