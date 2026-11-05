package com.lumastudio.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TemplateCategory {
    private String slug;
    private String label;
    private int sortOrder;
    private int templateCount;
}
