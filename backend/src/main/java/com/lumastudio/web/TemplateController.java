package com.lumastudio.web;

import com.lumastudio.dto.CategoryResponse;
import com.lumastudio.dto.TemplateResponse;
import com.lumastudio.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {
    private final TemplateService templateService;

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return templateService.categories();
    }

    @GetMapping
    public List<TemplateResponse> list(@RequestParam(required = false) String category) {
        return templateService.list(category);
    }

    @GetMapping("/{id}")
    public TemplateResponse get(@PathVariable String id) {
        return templateService.get(id);
    }
}
