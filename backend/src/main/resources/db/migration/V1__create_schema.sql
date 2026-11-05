CREATE TABLE app_user (
    id VARCHAR(40) PRIMARY KEY,
    display_name VARCHAR(80) NOT NULL,
    email VARCHAR(190) NOT NULL,
    avatar_color VARCHAR(16) NOT NULL,
    plan_name VARCHAR(40) NOT NULL,
    credits INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE template_category (
    slug VARCHAR(32) PRIMARY KEY,
    label VARCHAR(40) NOT NULL,
    sort_order INT NOT NULL
);

CREATE TABLE creation_template (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    category_slug VARCHAR(32) NOT NULL,
    description VARCHAR(500) NOT NULL,
    cover_url VARCHAR(255) NOT NULL,
    target_result_url VARCHAR(255) NOT NULL,
    required_image_count INT NOT NULL,
    accepted_mime_types VARCHAR(255) NOT NULL,
    max_file_size_bytes BIGINT NOT NULL,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_template_category FOREIGN KEY (category_slug) REFERENCES template_category (slug)
);

CREATE TABLE uploaded_asset (
    id VARCHAR(40) PRIMARY KEY,
    owner_user_id VARCHAR(40) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_asset_user FOREIGN KEY (owner_user_id) REFERENCES app_user (id)
);

CREATE TABLE creation_job (
    id VARCHAR(48) PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    template_id VARCHAR(64) NOT NULL,
    template_title VARCHAR(120) NOT NULL,
    template_cover_url VARCHAR(255) NOT NULL,
    status VARCHAR(24) NOT NULL,
    stage VARCHAR(24) NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    asset_count INT NOT NULL,
    target_result_url VARCHAR(255) NOT NULL,
    result_url VARCHAR(255),
    failure_stage VARCHAR(24),
    failure_reason VARCHAR(600),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    CONSTRAINT fk_job_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_job_template FOREIGN KEY (template_id) REFERENCES creation_template (id)
);

CREATE INDEX idx_job_user_created ON creation_job (user_id, created_at);
CREATE INDEX idx_job_status ON creation_job (status);

CREATE TABLE job_asset (
    job_id VARCHAR(48) NOT NULL,
    asset_id VARCHAR(40) NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (job_id, sort_order),
    CONSTRAINT fk_job_asset_job FOREIGN KEY (job_id) REFERENCES creation_job (id) ON DELETE CASCADE,
    CONSTRAINT fk_job_asset_asset FOREIGN KEY (asset_id) REFERENCES uploaded_asset (id)
);

CREATE TABLE job_event (
    id VARCHAR(48) PRIMARY KEY,
    job_id VARCHAR(48) NOT NULL,
    seq_no INT NOT NULL,
    stage VARCHAR(24) NOT NULL,
    status VARCHAR(24) NOT NULL,
    message VARCHAR(600) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_job_event_job FOREIGN KEY (job_id) REFERENCES creation_job (id) ON DELETE CASCADE,
    CONSTRAINT uq_job_event_seq UNIQUE (job_id, seq_no)
);
