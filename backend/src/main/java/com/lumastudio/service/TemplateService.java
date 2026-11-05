package com.lumastudio.service;

import com.lumastudio.domain.CreationTemplate;
import com.lumastudio.domain.TemplateCategory;
import com.lumastudio.dto.CategoryResponse;
import com.lumastudio.dto.TemplateResponse;
import com.lumastudio.exception.ApiException;
import com.lumastudio.mapper.TemplateMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateService {
    private final TemplateMapper templateMapper;

    public List<CategoryResponse> categories() {
        List<TemplateCategory> categories = templateMapper.findCategories();
        int total = categories.stream().mapToInt(TemplateCategory::getTemplateCount).sum();
        int featured = templateMapper.findFeatured().size();

        List<CategoryResponse> response = new ArrayList<>();
        response.add(new CategoryResponse("all", "全部", total));
        response.add(new CategoryResponse("featured", "热门", featured));
        for (TemplateCategory category : categories) {
            response.add(new CategoryResponse(
                    category.getSlug(),
                    category.getLabel(),
                    category.getTemplateCount()
            ));
        }
        return response;
    }

    public List<TemplateResponse> list(String category) {
        String normalized = category == null ? "all" : category.trim();
        List<CreationTemplate> templates;
        if (normalized.isEmpty() || "all".equals(normalized)) {
            templates = templateMapper.findAll();
        } else if ("featured".equals(normalized)) {
            templates = templateMapper.findFeatured();
        } else {
            boolean known = templateMapper.findCategories().stream()
                    .anyMatch(item -> item.getSlug().equals(normalized));
            if (!known) {
                throw ApiException.badRequest("UNKNOWN_CATEGORY", "未知的模板分类");
            }
            templates = templateMapper.findByCategory(normalized);
        }
        return templates.stream().map(TemplateResponse::from).toList();
    }

    public TemplateResponse get(String id) {
        CreationTemplate template = templateMapper.findById(id);
        if (template == null) {
            throw ApiException.notFound("TEMPLATE_NOT_FOUND", "模板不存在或已下架");
        }
        return TemplateResponse.from(template);
    }

    public CreationTemplate requireEntity(String id) {
        CreationTemplate template = templateMapper.findById(id);
        if (template == null) {
            throw ApiException.notFound("TEMPLATE_NOT_FOUND", "模板不存在或已下架");
        }
        return template;
    }
}
