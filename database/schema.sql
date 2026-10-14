-- =============================================================================
-- ETS AGBONOUGLA — Schéma Relationnel CRM, CMS, Analytics & Sécurité (Phase 2)
-- Compatible SQLite 3 & MySQL 8.0+ / MariaDB (Hébergement LWS / VPS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(190) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'OWNER', -- OWNER | EDITOR | VIEWER
    password_hash VARCHAR(255) NOT NULL,
    totp_secret VARCHAR(64) DEFAULT NULL,
    totp_enabled INTEGER NOT NULL DEFAULT 1,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until DATETIME DEFAULT NULL,
    last_login_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions_admin (
    id VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    csrf_token VARCHAR(64) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    user_agent VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users_admin(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads_crm (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(160) NOT NULL,
    company VARCHAR(160) DEFAULT '',
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(190) DEFAULT '',
    location VARCHAR(160) DEFAULT '',
    product_type VARCHAR(120) NOT NULL,
    dimensions VARCHAR(64) DEFAULT '20 pieds',
    quantity INTEGER NOT NULL DEFAULT 1,
    timeline VARCHAR(80) DEFAULT 'Sous 2 semaines',
    message TEXT NOT NULL,
    source_page VARCHAR(120) DEFAULT 'index.html',
    status VARCHAR(40) NOT NULL DEFAULT 'Nouveau', -- Nouveau | Étude en cours | Devis envoyé | En négociation | Validé / En production | Livré | Perdu / Archivé
    assigned_to VARCHAR(120) DEFAULT 'Direction Commerciale',
    estimated_value VARCHAR(64) DEFAULT 'Sur étude',
    consent_given INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    author VARCHAR(120) NOT NULL,
    note_text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads_crm(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cms_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    dimensions VARCHAR(80) NOT NULL DEFAULT '20'' / 40'' HC',
    short_desc TEXT NOT NULL,
    specs_json TEXT NOT NULL DEFAULT '[]',
    image_path VARCHAR(255) NOT NULL,
    image_alt VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    location VARCHAR(120) NOT NULL,
    year_completed VARCHAR(16) NOT NULL DEFAULT '2026',
    need_text TEXT NOT NULL,
    solution_text TEXT NOT NULL,
    result_text TEXT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    image_alt VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_settings (
    setting_key VARCHAR(120) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(80) DEFAULT 'Général',
    sort_order INTEGER NOT NULL DEFAULT 1,
    published INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cms_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(160) NOT NULL,
    department VARCHAR(80) NOT NULL,
    location VARCHAR(120) NOT NULL DEFAULT 'Attinguié (PK 26)',
    contract_type VARCHAR(64) NOT NULL DEFAULT 'Temps plein',
    description TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_seo (
    page_path VARCHAR(120) PRIMARY KEY,
    page_title VARCHAR(160) NOT NULL,
    meta_description TEXT NOT NULL,
    og_image VARCHAR(255) NOT NULL DEFAULT 'hero-container-crane.jpg',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_hash VARCHAR(64) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL, -- pageview | click | scroll_depth | session_end
    page_path VARCHAR(160) NOT NULL,
    target_key VARCHAR(120) DEFAULT '',
    event_value VARCHAR(64) DEFAULT '',
    device_type VARCHAR(32) DEFAULT 'Desktop',
    browser VARCHAR(64) DEFAULT 'Browser',
    referrer VARCHAR(190) DEFAULT 'Direct',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor VARCHAR(120) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    target_entity VARCHAR(120) NOT NULL,
    details TEXT NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
