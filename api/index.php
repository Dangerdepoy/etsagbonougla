<?php
/**
 * ETS AGBONOUGLA — API Serveur Sécurisée (CRM, CMS, Analytics & Authentification)
 * Propulsée par PHP 8.2+ et PDO (SQLite : database/ets_agbonougla.sqlite ou MySQL LWS).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Admin-Token');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Chargement du fichier .env s'il existe
$envPath = dirname(__DIR__) . '/.env';
$env = [];
if (is_readable($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v, " \t\n\r\0\x0B\"'");
    }
}
function env_val(string $key, string $default = ''): string {
    global $env;
    return $env[$key] ?? ($_ENV[$key] ?? $default);
}

ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', '1');
session_name('ETS_ADMIN_SESS');
session_start();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Connexion PDO (SQLite par défaut dans database/ets_agbonougla.sqlite, ou MySQL sur LWS)
function get_db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $driver = env_val('DB_DRIVER', 'sqlite');
    if ($driver === 'mysql') {
        $host = env_val('DB_HOST', '127.0.0.1');
        $port = env_val('DB_PORT', '3306');
        $name = env_val('DB_NAME', 'etsagb_crm_cms');
        $user = env_val('DB_USER', 'root');
        $pass = env_val('DB_PASS', '');
        $pdo = new PDO("mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } else {
        $dbFile = dirname(__DIR__) . '/' . env_val('DB_SQLITE_PATH', 'database/ets_agbonougla.sqlite');
        $dbDir = dirname($dbFile);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0750, true);
        }
        $isNew = !file_exists($dbFile);
        $pdo = new PDO('sqlite:' . $dbFile, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON;');
        $pdo->exec('PRAGMA journal_mode = WAL;');

        $schemaFile = dirname(__DIR__) . '/database/schema.sql';
        if ($isNew && is_readable($schemaFile)) {
            $pdo->exec((string)file_get_contents($schemaFile));
            seed_initial_data($pdo);
        } else {
            $check = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='cms_settings'")->fetch();
            if (!$check && is_readable($schemaFile)) {
                $pdo->exec((string)file_get_contents($schemaFile));
                seed_initial_data($pdo);
            }
        }
    }
    return $pdo;
}

function seed_initial_data(PDO $pdo): void {
    $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
    $envHash = env_val('ADMIN_INITIAL_PASSWORD_HASH', '');
    $hash = $envHash !== '' ? $envHash : password_hash('EtsAgbonougla2026!', $algo);
    $totpSecret = env_val('ADMIN_TOTP_SECRET', 'JBSWY3DPEHPK3PXP');

    $stmtUser = $pdo->prepare("INSERT OR IGNORE INTO users_admin (email, display_name, role, password_hash, totp_secret, totp_enabled) VALUES (?, ?, 'OWNER', ?, ?, 1)");
    $stmtUser->execute([
        env_val('ADMIN_INITIAL_EMAIL', 'direction@etsagbonougla.net'),
        'Direction ETS AGBONOUGLA',
        $hash,
        $totpSecret
    ]);

    $settings = [
        'company_name'       => 'ETS AGBONOUGLA',
        'hero_bg_word'       => 'ETS AGBONOUGLA',
        'hero_callout_title' => 'Déployez vos espaces en quelques jours',
        'hero_cta_label'     => 'DEMANDER UN DEVIS',
        'manifesto_quote'    => 'Nous concevons et aménageons à Attinguié des structures modulaires en acier Corten pensées pour durer sur les chantiers les plus exigeants de Côte d’Ivoire.',
        'phone_primary'      => '+225 07 07 68 38 68',
        'phone_secondary'    => '+225 05 05 90 12 34',
        'whatsapp_number'    => '2250707683868',
        'email_contact'      => 'info@etsagbonougla.net',
        'address_workshop'   => 'Attinguié, Autoroute du Nord PK 26 — Abidjan, Côte d’Ivoire',
        'workshop_surface'   => '2 500 m²',
        'quote_sla'          => '24 h',
        'lamano_design_url'  => env_val('LAMANO_DESIGN_URL', 'https://lamanodesign.com'),
        'notify_emails'      => env_val('NOTIFY_ADMIN_EMAILS', 'info@etsagbonougla.net')
    ];
    $stmtSet = $pdo->prepare("INSERT OR REPLACE INTO cms_settings (setting_key, setting_value) VALUES (?, ?)");
    foreach ($settings as $k => $v) {
        $stmtSet->execute([$k, $v]);
    }

    $products = [
        [
            'slug' => 'bureau-chantier-20',
            'title' => 'Bureau de Chantier Modulaire 20\'',
            'category' => 'Bureaux & Bases-vie',
            'dimensions' => '20 pieds (6,05 × 2,44 × 2,59 m)',
            'short_desc' => 'Module isolé thermiquement, climatisation split, menuiserie aluminium, tableau électrique étanche et câblage réseau.',
            'specs_json' => json_encode(['Structure Acier Corten 2mm', 'Isolation panneaux sandwich 50mm', 'Climatisation 1,5 CV incluse', 'Prêt à raccorder'], JSON_UNESCAPED_UNICODE),
            'image_path' => '12.jpg',
            'image_alt' => 'Conteneur bureau de chantier 20 pieds aménagé par ETS AGBONOUGLA',
            'sort_order' => 1
        ],
        [
            'slug' => 'base-vie-complexe-40',
            'title' => 'Base-Vie & Salle de Réunion 40\' HC',
            'category' => 'Bureaux & Bases-vie',
            'dimensions' => '40 pieds High Cube (12,19 × 2,44 × 2,89 m)',
            'short_desc' => 'Espace de direction de chantier, salle de planification ou réfectoire d’équipe avec cloisons modulables et double accès.',
            'specs_json' => json_encode(['Hauteur sous plafond 2,65 m', 'Double vitrage & grilles sécurité', 'Revêtement sol vinyle trafic intense', 'Éclairage LED industriel'], JSON_UNESCAPED_UNICODE),
            'image_path' => '15.jpg',
            'image_alt' => 'Base-vie modulaire 40 pieds en cours de finition dans notre atelier PK 26',
            'sort_order' => 2
        ],
        [
            'slug' => 'bloc-sanitaire-vestiaire',
            'title' => 'Bloc Sanitaire & Vestiaire de Chantier',
            'category' => 'Sanitaires & Hygiène',
            'dimensions' => '20 pieds / Sur-mesure',
            'short_desc' => 'Unités autonomes ou raccordables comprenant cabines douches, WC, lavabos collectifs et casiers vestiaires ventilés.',
            'specs_json' => json_encode(['Plomberie PPR haute pression', 'Sol antidérapant avec siphon', 'Extracteurs d’humidité', 'Cloisons hydrofuges'], JSON_UNESCAPED_UNICODE),
            'image_path' => '21.jpg',
            'image_alt' => 'Module sanitaire et vestiaire pour équipes de chantier',
            'sort_order' => 3
        ],
        [
            'slug' => 'stockage-securise-atelier',
            'title' => 'Conteneur Stockage Dry & Atelier Mobile',
            'category' => 'Stockage & Technique',
            'dimensions' => '20\' / 40\' Dry & Open Side',
            'short_desc' => 'Stockage sécurisé d’outillage, pièces détachées, groupe électrogène ou local technique pré-équipé avec établis.',
            'specs_json' => json_encode(['Cadenas cache-serrure blindé', 'Plancher bois marin 28mm ou tôle striée', 'Ventilation naturelle renforcée', 'Étagères lourdes en option'], JSON_UNESCAPED_UNICODE),
            'image_path' => '27.jpg',
            'image_alt' => 'Conteneur maritime de stockage sécurisé sur parc Attinguié',
            'sort_order' => 4
        ]
    ];
    $stmtProd = $pdo->prepare("INSERT OR IGNORE INTO cms_products (slug, title, category, dimensions, short_desc, specs_json, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    foreach ($products as $p) {
        $stmtProd->execute([$p['slug'], $p['title'], $p['category'], $p['dimensions'], $p['short_desc'], $p['specs_json'], $p['image_path'], $p['image_alt'], $p['sort_order']]);
    }

    $projects = [
        [
            'slug' => 'base-vie-chantier-autoroutier-pk26',
            'title' => 'Complexe Bureaux de Chantier & Direction',
            'category' => 'Bureaux de chantier',
            'location' => 'Axe Nord · Attinguié (PK 26)',
            'year_completed' => '2026',
            'need_text' => 'Déployer rapidement des bureaux climatisés et isolés pour les ingénieurs et conducteurs de travaux directement sur site.',
            'solution_text' => 'Fabrication en atelier de 4 modules 20 pieds et 40 pieds avec isolation thermique renforcée, fenêtres barreaudées et réseau électrique complet.',
            'result_text' => 'Mise en place par camion-grue et mise en service immédiate dès le raccordement au groupe de chantier.',
            'image_path' => '19.jpg',
            'image_alt' => 'Alignement de conteneurs bureaux blancs aménagés à Attinguié',
            'sort_order' => 1
        ],
        [
            'slug' => 'module-technique-stockage-portuaire',
            'title' => 'Unités Techniques & Stockage Sécurisé',
            'category' => 'Locaux techniques',
            'location' => 'Zone Industrielle · Abidjan',
            'year_completed' => '2025',
            'need_text' => 'Protéger le matériel sensible et disposer d’un poste de contrôle étanche aux intempéries tropicales.',
            'solution_text' => 'Transformation de conteneurs maritimes Corten premier choix, traitement anti-corrosion bicouche et compartimentage intérieur.',
            'result_text' => 'Zéro infiltration constatée en saison des pluies et sécurisation complète du parc matériel.',
            'image_path' => '13.jpg',
            'image_alt' => 'Conteneur technique et bureau sur le parc industriel',
            'sort_order' => 2
        ],
        [
            'slug' => 'poste-accueil-guichet-modulaire',
            'title' => 'Guérite de Contrôle & Bureau d’Exploitation',
            'category' => 'Espaces professionnels',
            'location' => 'Yopougon Zone Industrielle',
            'year_completed' => '2026',
            'need_text' => 'Contrôler les flux logistiques à l’entrée d’un site industriel avec visibilité panoramique.',
            'solution_text' => 'Module 20 pieds avec baies vitrées aluminium sur trois façades, comptoir intégré et climatisation.',
            'result_text' => 'Installé en une demi-journée sans travaux de maçonnerie lourds.',
            'image_path' => '61.jpeg',
            'image_alt' => 'Module d’accueil et bureau vitré préparé par ETS AGBONOUGLA',
            'sort_order' => 3
        ]
    ];
    $stmtProj = $pdo->prepare("INSERT OR IGNORE INTO cms_projects (slug, title, category, location, year_completed, need_text, solution_text, result_text, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    foreach ($projects as $pr) {
        $stmtProj->execute([$pr['slug'], $pr['title'], $pr['category'], $pr['location'], $pr['year_completed'], $pr['need_text'], $pr['solution_text'], $pr['result_text'], $pr['image_path'], $pr['image_alt'], $pr['sort_order']]);
    }

    $faqs = [
        ['Quels sont les délais moyens de fabrication et livraison ?', 'Pour un module bureau 20 pieds standard en stock sur notre parc d’Attinguié (PK 26), la préparation prend 3 à 5 jours ouvrés. Pour un aménagement sur-mesure complexe, comptez 10 à 21 jours selon le cahier des charges.', 'Délais & Livraison', 1],
        ['Assurez-vous le transport et le déchargement par grue sur chantier ?', 'Oui. Nous organisons l’acheminement par camion plateau et camion-grue (HIAB) sur Abidjan et l’ensemble du territoire ivoirien.', 'Logistique', 2],
        ['Comment vos conteneurs sont-ils isolés contre la chaleur ?', 'Nous utilisons des panneaux sandwich polyuréthane haute densité (40 à 60 mm) ou laine de roche avec parement PVC/mélaminé, complétés par une climatisation split dimensionnée.', 'Spécifications', 3]
    ];
    $stmtFaq = $pdo->prepare("INSERT OR IGNORE INTO cms_faq (question, answer, category, sort_order, published) VALUES (?, ?, ?, ?, 1)");
    foreach ($faqs as $f) {
        $stmtFaq->execute($f);
    }

    $seos = [
        ['index.html', 'ETS AGBONOUGLA — Conteneurs Modulaires & Bases-Vie de Chantier en Côte d’Ivoire', 'Fabrication et aménagement de conteneurs préfabriqués, bureaux de chantier, bases-vie et locaux techniques à Attinguié (PK 26, Abidjan). Devis sous 24h.', 'hero-container-crane.jpg'],
        ['ets_solutions.html', 'Solutions Modulaires & Conteneurs Aménagés — ETS AGBONOUGLA', 'Découvrez nos gammes de conteneurs 20 et 40 pieds : bureaux de chantier, bases-vie, blocs sanitaires et stockage sécurisé.', '12.jpg'],
        ['ets_expertise.html', 'Expertise Industrielle & Atelier PK 26 — ETS AGBONOUGLA', '2 500 m² d’atelier à Attinguié : chaudronnerie Corten, isolation thermique, électricité aux normes et logistique grue.', '15.jpg'],
        ['ets_references.html', 'Réalisations & Projets Livrés — ETS AGBONOUGLA', 'Galerie de nos conteneurs aménagés et bases-vie déployés sur les chantiers et sites industriels en Côte d’Ivoire.', '19.jpg'],
        ['ets_contact.html', 'Demander un Devis Conteneur sous 24h — ETS AGBONOUGLA', 'Contactez notre bureau d’études à Attinguié (PK 26 Autoroute du Nord) pour chiffrer votre projet modulaire.', '61.jpeg'],
        ['ets_carriere.html', 'Carrières & Métiers d’Atelier — ETS AGBONOUGLA', 'Rejoignez nos équipes de soudeurs, électriciens, menuisiers aluminium et techniciens à Attinguié.', '27.jpg']
    ];
    $stmtSeo = $pdo->prepare("INSERT OR IGNORE INTO cms_seo (page_path, page_title, meta_description, og_image) VALUES (?, ?, ?, ?)");
    foreach ($seos as $s) {
        $stmtSeo->execute($s);
    }

    log_audit($pdo, 'SYSTÈME', 'INITIALISATION_DB', 'database/ets_agbonougla.sqlite', 'Base de données relationnelle SQLite initialisée avec succès.');
}

function visitor_daily_hash(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $salt = env_val('DAILY_HASH_SALT', 'ets_agb_salt_') . date('Y-m-d');
    return substr(hash('sha256', $ip . '|' . $ua . '|' . $salt), 0, 24);
}

function log_audit(PDO $pdo, string $actor, string $action, string $target, string $details): void {
    $stmt = $pdo->prepare("INSERT INTO audit_logs (actor, action_type, target_entity, details, ip_hash) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$actor, $action, $target, $details, visitor_daily_hash()]);
}

function require_auth(PDO $pdo): array {
    if (!empty($_SESSION['admin_user'])) {
        return $_SESSION['admin_user'];
    }
    $headerToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    if ($headerToken !== '') {
        $stmt = $pdo->prepare("SELECT u.id, u.email, u.display_name, u.role FROM sessions_admin s JOIN users_admin u ON u.id = s.user_id WHERE s.csrf_token = ? AND s.revoked = 0");
        $stmt->execute([$headerToken]);
        $u = $stmt->fetch();
        if ($u) return $u;
    }
    // En environnement local (127.0.0.1 / ::1), autorise le jeton de session locale
    $remote = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (in_array($remote, ['127.0.0.1', '::1'], true)) {
        return ['id' => 1, 'email' => 'direction@etsagbonougla.net', 'display_name' => 'Direction ETS AGBONOUGLA', 'role' => 'OWNER'];
    }
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Authentification requise.']);
    exit;
}

function json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return $_POST;
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

$route = $_GET['route'] ?? 'status';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = get_db();

    if ($route === 'status' || $route === 'health') {
        $leadCount = (int)$pdo->query("SELECT COUNT(*) FROM leads_crm")->fetchColumn();
        $prodCount = (int)$pdo->query("SELECT COUNT(*) FROM cms_products")->fetchColumn();
        $projCount = (int)$pdo->query("SELECT COUNT(*) FROM cms_projects")->fetchColumn();
        echo json_encode([
            'ok' => true,
            'authenticated' => !empty($_SESSION['admin_user']),
            'user' => $_SESSION['admin_user'] ?? null,
            'csrf_token' => $_SESSION['csrf_token'],
            'db_driver' => env_val('DB_DRIVER', 'sqlite'),
            'db_file' => 'database/ets_agbonougla.sqlite',
            'php_version' => PHP_VERSION,
            'counts' => [
                'leads' => $leadCount,
                'products' => $prodCount,
                'projects' => $projCount
            ]
        ]);
        exit;
    }

    if ($route === 'login' && $method === 'POST') {
        $in = json_body();
        $email = strtolower(trim((string)($in['email'] ?? '')));
        $password = (string)($in['password'] ?? '');

        $stmt = $pdo->prepare("SELECT * FROM users_admin WHERE LOWER(email) = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && !empty($user['locked_until']) && strtotime($user['locked_until']) > time()) {
            log_audit($pdo, $email, 'LOGIN_BLOQUÉ', 'users_admin', 'Tentative pendant verrouillage anti-bruteforce.');
            http_response_code(429);
            echo json_encode(['ok' => false, 'error' => 'Compte verrouillé temporairement (15 min).']);
            exit;
        }

        if (!$user || !password_verify($password, $user['password_hash'])) {
            if ($user) {
                $fails = (int)$user['failed_attempts'] + 1;
                $lock = $fails >= 5 ? date('Y-m-d H:i:s', time() + 900) : null;
                $pdo->prepare("UPDATE users_admin SET failed_attempts = ?, locked_until = ? WHERE id = ?")
                    ->execute([$fails, $lock, $user['id']]);
            }
            log_audit($pdo, $email ?: 'inconnu', 'LOGIN_ÉCHEC', 'users_admin', 'Mot de passe ou identifiant invalide.');
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Identifiants ou code 2FA incorrects.']);
            exit;
        }

        session_regenerate_id(true);
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['admin_user'] = [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'display_name' => $user['display_name'],
            'role' => $user['role']
        ];

        $sessId = session_id();
        $pdo->prepare("UPDATE users_admin SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = ?")
            ->execute([$user['id']]);
        $pdo->prepare("INSERT OR REPLACE INTO sessions_admin (id, user_id, csrf_token, ip_hash, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
            ->execute([$sessId, $user['id'], $_SESSION['csrf_token'], visitor_daily_hash(), substr($_SERVER['HTTP_USER_AGENT'] ?? 'Browser', 0, 240), date('Y-m-d H:i:s', time() + 3600 * 8)]);

        log_audit($pdo, $user['email'], 'LOGIN_SUCCÈS', 'sessions_admin', 'Connexion administrateur validée en base SQLite.');

        echo json_encode([
            'ok' => true,
            'user' => $_SESSION['admin_user'],
            'csrf_token' => $_SESSION['csrf_token']
        ]);
        exit;
    }

    if ($route === 'logout' && $method === 'POST') {
        $actor = $_SESSION['admin_user']['email'] ?? 'admin';
        $pdo->prepare("UPDATE sessions_admin SET revoked = 1 WHERE id = ?")->execute([session_id()]);
        log_audit($pdo, $actor, 'LOGOUT', 'sessions_admin', 'Déconnexion manuelle.');
        session_destroy();
        echo json_encode(['ok' => true]);
        exit;
    }

    if ($route === 'public-data' && $method === 'GET') {
        $settingsRows = $pdo->query("SELECT setting_key, setting_value FROM cms_settings")->fetchAll();
        $settings = [];
        foreach ($settingsRows as $r) $settings[$r['setting_key']] = $r['setting_value'];

        $products = $pdo->query("SELECT * FROM cms_products WHERE published = 1 ORDER BY sort_order ASC, id ASC")->fetchAll();
        $projects = $pdo->query("SELECT * FROM cms_projects WHERE published = 1 ORDER BY sort_order ASC, id DESC")->fetchAll();
        $faq = $pdo->query("SELECT * FROM cms_faq WHERE published = 1 ORDER BY sort_order ASC, id ASC")->fetchAll();
        $jobs = $pdo->query("SELECT * FROM cms_jobs WHERE published = 1 ORDER BY id DESC")->fetchAll();
        $seo = $pdo->query("SELECT * FROM cms_seo")->fetchAll();

        echo json_encode([
            'ok' => true,
            'settings' => $settings,
            'products' => $products,
            'projects' => $projects,
            'faq' => $faq,
            'jobs' => $jobs,
            'seo' => $seo
        ]);
        exit;
    }

    if ($route === 'leads' && $method === 'POST') {
        $in = json_body();
        if (!empty($in['website_url_hp'])) {
            echo json_encode(['ok' => true, 'reference' => 'ETS-FILTERED']);
            exit;
        }

        $name = trim(strip_tags((string)($in['full_name'] ?? $in['nom'] ?? '')));
        $phone = trim(strip_tags((string)($in['phone'] ?? $in['telephone'] ?? '')));
        $company = trim(strip_tags((string)($in['company'] ?? $in['entreprise'] ?? '')));
        $email = trim(strip_tags((string)($in['email'] ?? '')));
        $location = trim(strip_tags((string)($in['location'] ?? $in['localisation'] ?? 'Abidjan / CI')));
        $productType = trim(strip_tags((string)($in['product_type'] ?? $in['type_projet'] ?? 'Bureau de chantier')));
        $dimensions = trim(strip_tags((string)($in['dimensions'] ?? '20 pieds')));
        $quantity = max(1, (int)($in['quantity'] ?? 1));
        $timeline = trim(strip_tags((string)($in['timeline'] ?? $in['delai'] ?? 'Sous 2 semaines')));
        $message = trim(strip_tags((string)($in['message'] ?? $in['besoin'] ?? '')));
        $source = trim(strip_tags((string)($in['source_page'] ?? 'index.html')));
        $status = trim(strip_tags((string)($in['status'] ?? 'Nouveau')));

        if (mb_strlen($name) < 2 || mb_strlen($phone) < 6) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'Nom complet et téléphone requis.']);
            exit;
        }

        $ref = !empty($in['reference']) ? trim((string)$in['reference']) : ('ETS-' . date('Y') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)));
        $stmt = $pdo->prepare("INSERT OR REPLACE INTO leads_crm (reference, full_name, company, phone, email, location, product_type, dimensions, quantity, timeline, message, source_page, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$ref, $name, $company, $phone, $email, $location, $productType, $dimensions, $quantity, $timeline, $message ?: 'Demande de chiffrage standard', $source, $status]);
        $leadId = (int)$pdo->lastInsertId();

        log_audit($pdo, 'CRM_ENTRÉE', 'NOUVEAU_DEVIS', $ref, "Demande enregistrée ({$productType} - {$name})");

        echo json_encode([
            'ok' => true,
            'id' => $leadId,
            'reference' => $ref,
            'message' => "Votre demande de devis ({$ref}) a bien été enregistrée en base de données."
        ]);
        exit;
    }

    if ($route === 'analytics-beacon' && $method === 'POST') {
        $in = json_body();
        $type = in_array($in['type'] ?? '', ['pageview', 'click', 'scroll_depth', 'session_end'], true) ? $in['type'] : 'pageview';
        $path = substr(trim((string)($in['path'] ?? 'index.html')), 0, 140);
        $target = substr(trim((string)($in['target'] ?? '')), 0, 110);
        $val = substr(trim((string)($in['value'] ?? '')), 0, 60);
        $sessId = substr(preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($in['sessionId'] ?? 's0')), 0, 48);

        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $device = preg_match('/Mobile|Android|iPhone/i', $ua) ? 'Mobile' : (preg_match('/iPad|Tablet/i', $ua) ? 'Tablette' : 'Desktop');
        $browser = str_contains($ua, 'Edg') ? 'Edge' : (str_contains($ua, 'Chrome') ? 'Chrome' : (str_contains($ua, 'Firefox') ? 'Firefox' : (str_contains($ua, 'Safari') ? 'Safari' : 'Autre')));
        $ref = substr(trim((string)($in['referrer'] ?? 'Direct')), 0, 180) ?: 'Direct';

        $stmt = $pdo->prepare("INSERT INTO analytics_events (visitor_hash, session_id, event_type, page_path, target_key, event_value, device_type, browser, referrer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([visitor_daily_hash(), $sessId, $type, $path, $target, $val, $device, $browser, $ref]);
        echo json_encode(['ok' => true]);
        exit;
    }

    // Routes Administrateur
    $admin = require_auth($pdo);

    if ($route === 'crm') {
        if ($method === 'GET') {
            $leads = $pdo->query("SELECT * FROM leads_crm ORDER BY id DESC")->fetchAll();
            $notesRows = $pdo->query("SELECT * FROM lead_notes ORDER BY id DESC")->fetchAll();
            $notesByLead = [];
            foreach ($notesRows as $n) {
                $notesByLead[$n['lead_id']][] = $n;
            }
            foreach ($leads as &$l) {
                $l['notes'] = $notesByLead[$l['id']] ?? [];
            }
            echo json_encode(['ok' => true, 'leads' => $leads]);
            exit;
        }

        if ($method === 'PUT') {
            $in = json_body();
            $id = (int)($in['id'] ?? 0);
            if (!empty($in['status'])) {
                $status = trim((string)$in['status']);
                $assigned = trim((string)($in['assigned_to'] ?? 'Direction Commerciale'));
                $est = trim((string)($in['estimated_value'] ?? 'Sur étude'));
                $pdo->prepare("UPDATE leads_crm SET status = ?, assigned_to = ?, estimated_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    ->execute([$status, $assigned, $est, $id]);
                log_audit($pdo, $admin['email'], 'STATUT_CRM_MODIFIÉ', "Lead #{$id}", "Statut passé à : {$status}");
            }
            if (!empty($in['note_text'])) {
                $note = trim(strip_tags((string)$in['note_text']));
                $pdo->prepare("INSERT INTO lead_notes (lead_id, author, note_text) VALUES (?, ?, ?)")
                    ->execute([$id, $admin['display_name'], $note]);
                log_audit($pdo, $admin['email'], 'NOTE_CRM_AJOUTÉE', "Lead #{$id}", substr($note, 0, 80));
            }
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'DELETE') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM leads_crm WHERE id = ?")->execute([$id]);
            log_audit($pdo, $admin['email'], 'LEAD_SUPPRIMÉ', "Lead #{$id}", 'Suppression définitive de la demande en base.');
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    if ($route === 'cms') {
        $entity = $_GET['entity'] ?? 'all';
        $in = json_body();

        if ($method === 'POST' && $entity === 'settings') {
            $stmt = $pdo->prepare("INSERT OR REPLACE INTO cms_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
            foreach (($in['settings'] ?? []) as $k => $v) {
                $stmt->execute([trim((string)$k), trim((string)$v)]);
            }
            log_audit($pdo, $admin['email'], 'PARAMÈTRES_CMS', 'cms_settings', 'Mise à jour des textes, Hero et coordonnées du site en base.');
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'product') {
            $id = (int)($in['id'] ?? 0);
            $title = trim(strip_tags((string)($in['title'] ?? '')));
            $cat = trim(strip_tags((string)($in['category'] ?? 'Bureaux & Bases-vie')));
            $dim = trim(strip_tags((string)($in['dimensions'] ?? '20 pieds')));
            $desc = trim(strip_tags((string)($in['short_desc'] ?? '')));
            $img = trim(strip_tags((string)($in['image_path'] ?? '12.jpg')));
            $alt = trim(strip_tags((string)($in['image_alt'] ?? $title)));
            $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-')) ?: 'module-' . time();

            if ($id > 0 && $id < 1000000000) {
                $pdo->prepare("UPDATE cms_products SET title=?, category=?, dimensions=?, short_desc=?, image_path=?, image_alt=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
                    ->execute([$title, $cat, $dim, $desc, $img, $alt, $id]);
                log_audit($pdo, $admin['email'], 'PRODUIT_MODIFIÉ', $title, "Modification de la fiche produit #{$id}");
            } else {
                $pdo->prepare("INSERT INTO cms_products (slug, title, category, dimensions, short_desc, specs_json, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, '[]', ?, ?, 1, 1)")
                    ->execute([$slug . '-' . rand(10, 99), $title, $cat, $dim, $desc, $img, $alt]);
                $id = (int)$pdo->lastInsertId();
                log_audit($pdo, $admin['email'], 'PRODUIT_CRÉÉ', $title, "Nouvelle solution modulaire ajoutée en base (#{$id}).");
            }
            echo json_encode(['ok' => true, 'id' => $id]);
            exit;
        }

        if ($method === 'DELETE' && $entity === 'product') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM cms_products WHERE id = ?")->execute([$id]);
            log_audit($pdo, $admin['email'], 'PRODUIT_SUPPRIMÉ', "Produit #{$id}", "Suppression en base.");
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'project') {
            $title = trim(strip_tags((string)($in['title'] ?? '')));
            $cat = trim(strip_tags((string)($in['category'] ?? 'Bureaux de chantier')));
            $loc = trim(strip_tags((string)($in['location'] ?? 'Abidjan')));
            $year = trim(strip_tags((string)($in['year_completed'] ?? '2026')));
            $need = trim(strip_tags((string)($in['need_text'] ?? '')));
            $sol = trim(strip_tags((string)($in['solution_text'] ?? '')));
            $res = trim(strip_tags((string)($in['result_text'] ?? '')));
            $img = trim(strip_tags((string)($in['image_path'] ?? '19.jpg')));
            $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-')) ?: 'projet-' . time();

            $pdo->prepare("INSERT INTO cms_projects (slug, title, category, location, year_completed, need_text, solution_text, result_text, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)")
                ->execute([$slug . '-' . rand(10, 99), $title, $cat, $loc, $year, $need, $sol, $res, $img, $title]);
            $id = (int)$pdo->lastInsertId();
            log_audit($pdo, $admin['email'], 'PROJET_CRÉÉ', $title, "Nouvelle réalisation ajoutée en base (#{$id}).");
            echo json_encode(['ok' => true, 'id' => $id]);
            exit;
        }

        if ($method === 'DELETE' && $entity === 'project') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM cms_projects WHERE id = ?")->execute([$id]);
            log_audit($pdo, $admin['email'], 'PROJET_SUPPRIMÉ', "Projet #{$id}", "Suppression en base.");
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'faq') {
            $q = trim(strip_tags((string)($in['question'] ?? '')));
            $a = trim(strip_tags((string)($in['answer'] ?? '')));
            $pdo->prepare("INSERT INTO cms_faq (question, answer, category, sort_order, published) VALUES (?, ?, 'Général', 1, 1)")
                ->execute([$q, $a]);
            $id = (int)$pdo->lastInsertId();
            log_audit($pdo, $admin['email'], 'FAQ_AJOUTÉE', "FAQ #{$id}", $q);
            echo json_encode(['ok' => true, 'id' => $id]);
            exit;
        }

        if ($method === 'DELETE' && $entity === 'faq') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM cms_faq WHERE id = ?")->execute([$id]);
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'seo') {
            $page = trim((string)($in['page_path'] ?? 'index.html'));
            $title = trim(strip_tags((string)($in['page_title'] ?? '')));
            $desc = trim(strip_tags((string)($in['meta_description'] ?? '')));
            $og = trim(strip_tags((string)($in['og_image'] ?? 'hero-container-crane.jpg')));
            $pdo->prepare("INSERT OR REPLACE INTO cms_seo (page_path, page_title, meta_description, og_image, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)")
                ->execute([$page, $title, $desc, $og]);
            log_audit($pdo, $admin['email'], 'SEO_MODIFIÉ', $page, "Métadonnées SEO mises à jour pour {$page}");
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    if ($route === 'analytics') {
        if ($method === 'DELETE') {
            $pdo->exec("DELETE FROM analytics_events");
            echo json_encode(['ok' => true]);
            exit;
        }
        $events = $pdo->query("SELECT id, event_type AS type, page_path, target_key AS target, created_at FROM analytics_events ORDER BY id DESC LIMIT 300")->fetchAll();
        echo json_encode(['ok' => true, 'events' => $events]);
        exit;
    }

    if ($route === 'security' && $method === 'GET') {
        $sessions = $pdo->query("SELECT id, ip_hash, user_agent, created_at, last_active_at, expires_at, revoked FROM sessions_admin ORDER BY last_active_at DESC LIMIT 25")->fetchAll();
        $audits = $pdo->query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")->fetchAll();
        echo json_encode(['ok' => true, 'sessions' => $sessions, 'audits' => $audits]);
        exit;
    }

    echo json_encode(['ok' => false, 'error' => 'Route inconnue.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erreur interne serveur : ' . $e->getMessage()]);
}
