<?php
/**
 * ETS AGBONOUGLA — API Serveur de Production (CRM, CMS, Médiathèque, Analytics & Sécurité)
 * Propulsée par PHP 8.2+ et PDO (SQLite : database/ets_agbonougla.sqlite ou MySQL LWS).
 */
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Gestion stricte des origines CORS (aucun wildcard '*' en production)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$allowedOrigins = [
    'https://etsagbonougla.net',
    'https://www.etsagbonougla.net',
    'http://etsagbonougla.net',
    'http://www.etsagbonougla.net',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://' . $host,
    'https://' . $host
];
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Admin-Token');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Chargement du fichier .env (auto-initialisé depuis .env.example s'il n'existe pas encore sur l'hébergeur)
$envPath = dirname(__DIR__) . '/.env';
$envExamplePath = dirname(__DIR__) . '/.env.example';
if (!file_exists($envPath) && is_readable($envExamplePath)) {
    @copy($envExamplePath, $envPath);
}
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

// Verrouillage automatique du QR Code dans .env après le premier scan validé
function consume_2fa_qr_in_env(): void {
    global $envPath, $env;
    $env['ADMIN_SHOW_2FA_QR_ONCE'] = 'false';
    if (is_readable($envPath) && is_writable($envPath)) {
        $content = (string)file_get_contents($envPath);
        if (preg_match('/^ADMIN_SHOW_2FA_QR_ONCE\s*=/m', $content)) {
            $content = (string)preg_replace('/^ADMIN_SHOW_2FA_QR_ONCE\s*=.*$/m', 'ADMIN_SHOW_2FA_QR_ONCE=false', $content);
        } else {
            $content .= "\nADMIN_SHOW_2FA_QR_ONCE=false\n";
        }
        @file_put_contents($envPath, $content, LOCK_EX);
    }
}

// Implémentation RFC 6238 TOTP (Google Authenticator)
function base32_decode_totp(string $b32): string {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $b32 = strtoupper((string)preg_replace('/[^A-Za-z2-7]/', '', $b32));
    $bits = '';
    $len = strlen($b32);
    for ($i = 0; $i < $len; $i++) {
        $val = strpos($alphabet, $b32[$i]);
        if ($val === false) continue;
        $bits .= str_pad(decbin($val), 5, '0', STR_PAD_LEFT);
    }
    $binary = '';
    $bitLen = strlen($bits);
    for ($i = 0; $i + 8 <= $bitLen; $i += 8) {
        $binary .= chr((int)bindec(substr($bits, $i, 8)));
    }
    return $binary;
}

function compute_totp_code(string $secret, int $timeSlice): string {
    $key = base32_decode_totp($secret);
    $time = pack('N*', 0) . pack('N*', $timeSlice);
    $hmac = hash_hmac('sha1', $time, $key, true);
    $offset = ord($hmac[19]) & 0x0F;
    $code = (
        ((ord($hmac[$offset]) & 0x7F) << 24) |
        ((ord($hmac[$offset + 1]) & 0xFF) << 16) |
        ((ord($hmac[$offset + 2]) & 0xFF) << 8) |
        (ord($hmac[$offset + 3]) & 0xFF)
    ) % 1000000;
    return str_pad((string)$code, 6, '0', STR_PAD_LEFT);
}

function verify_totp_code(string $secret, string $code, int $window = 1): bool {
    $cleanCode = preg_replace('/\s+/', '', $code);
    if (!preg_match('/^\d{6}$/', (string)$cleanCode)) return false;
    $currentSlice = (int)floor(time() / 30);
    for ($i = -$window; $i <= $window; $i++) {
        if (hash_equals(compute_totp_code($secret, $currentSlice + $i), (string)$cleanCode)) {
            return true;
        }
    }
    return false;
}

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', '1');
if ($isHttps) {
    ini_set('session.cookie_secure', '1');
}
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
        try {
            $pdo->exec('PRAGMA busy_timeout = 5000;');
            $pdo->exec('PRAGMA journal_mode = WAL;');
        } catch (Throwable $e) {
            // Fallback automatique en journal_mode standard sur hébergement mutualisé NFS
        }

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
        'manifesto_quote'    => 'Nous concevons, aménageons et déployons des modules préfabriqués et conteneurs maritimes robustes, spécialement pensés pour résister aux contraintes sévères des chantiers et des opérations intensives en Côte d\'Ivoire.',
        'phone_primary'      => '+225 07 07 83 17 91',
        'phone_secondary'    => '+225 07 07 83 17 91',
        'whatsapp_number'    => '2250707831791',
        'email_contact'      => 'contact@ets-agbonougla.ci',
        'address_workshop'   => 'Attinguié, Autoroute du Nord PK 26 — Abidjan, Côte d’Ivoire',
        'workshop_surface'   => '2 500 m²',
        'quote_sla'          => '24 h',
        'lamano_design_url'  => env_val('LAMANO_DESIGN_URL', 'https://lamanodesign.com'),
        'notify_emails'      => env_val('NOTIFY_ADMIN_EMAILS', 'contact@ets-agbonougla.ci')
    ];
    $stmtSet = $pdo->prepare("INSERT OR REPLACE INTO cms_settings (setting_key, setting_value) VALUES (?, ?)");
    foreach ($settings as $k => $v) {
        $stmtSet->execute([$k, $v]);
    }

    $products = [
        [
            'slug' => 'bases-vie-cantonnements-chantier',
            'title' => 'Bases-Vie & Cantonnements de Chantier',
            'category' => 'Bureaux & Bases-vie',
            'dimensions' => '20\' / 40\' High Cube (Juxtaposables)',
            'short_desc' => 'Conçues pour accueillir vos équipes d\'encadrement et de terrain dans d\'excellentes conditions d\'hygiène et de sécurité : dortoirs, réfectoires, infirmeries et vestiaires.',
            'specs_json' => json_encode(['Isolation polyuréthane 60–80 mm', 'Fenêtres coulissantes avec barreaux', 'Tableau de protection différentiel', 'Revêtement sol PVC grand passage'], JSON_UNESCAPED_UNICODE),
            'image_path' => 'complexe-base-vie-plateforme.jpg',
            'image_alt' => 'Complexe de base-vie modulaire installé sur chantier en Côte d\'Ivoire',
            'sort_order' => 1
        ],
        [
            'slug' => 'bureaux-modulaires-prets-emploi',
            'title' => 'Bureaux Modulaires Prêts à l\'Emploi',
            'category' => 'Bureaux & Bases-vie',
            'dimensions' => '20 pieds (6,05 × 2,44 m) / 40 pieds',
            'short_desc' => 'Espaces de travail professionnels, confortables et insonorisés, déployables en quelques heures sur vos sites de production, zones logistiques ou plateformes portuaires.',
            'specs_json' => json_encode(['Précâblage réseau et prises 220V', 'Climatisation split tropicalisée', 'Éclairage LED basse consommation', 'Porte sécurisée 3 points avec serrure'], JSON_UNESCAPED_UNICODE),
            'image_path' => 'interieur-bureau-parquet-clim.jpg',
            'image_alt' => 'Bureau modulaire climatisé avec sol parquet de direction et éclairage LED',
            'sort_order' => 2
        ],
        [
            'slug' => 'conteneurs-maritimes-20-40-dry-hc',
            'title' => 'Conteneurs Maritimes 20\' & 40\' Dry / HC',
            'category' => 'Stockage & Technique',
            'dimensions' => '20\' Dry (33 m³) / 40\' HC (76 m³)',
            'short_desc' => 'Disponibles à l\'état neuf (premier voyage) ou reconditionnés étanches, nos conteneurs en acier Corten assurent une sécurité totale contre les effractions et infiltrations.',
            'specs_json' => json_encode(['20 pieds Dry : 33 m³ utile (6,05 m)', '40 pieds Dry : 67 m³ utile (12,19 m)', '40 pieds HC : 76 m³ (H 2,90 m)', 'Crémones acier galvanisé étanches'], JSON_UNESCAPED_UNICODE),
            'image_path' => 'parc-conteneurs-stock-iso.jpg',
            'image_alt' => 'Parc et stock de conteneurs maritimes 20 et 40 pieds ISO étanches',
            'sort_order' => 3
        ],
        [
            'slug' => 'locaux-techniques-ateliers-mobiles',
            'title' => 'Locaux Techniques & Ateliers Mobiles',
            'category' => 'Sur-mesure',
            'dimensions' => '20 pieds / 40 pieds / Sur-mesure',
            'short_desc' => 'Découpe spécifique, renforts d\'ossature, pose de planchers techniques marins et aménagements sur mesure pour locaux serveurs, groupes électrogènes ou laboratoires.',
            'specs_json' => json_encode(['Plancher lourd Marineplex 28 mm', 'Ouvertures persiennes aération forcée', 'Passages de câbles et gaines étanches', 'Isolation ignifuge et acoustique'], JSON_UNESCAPED_UNICODE),
            'image_path' => 'ossature-plancher-technique-soudure.jpg',
            'image_alt' => 'Ossature métallique solivage et soudures industrielles en atelier',
            'sort_order' => 4
        ]
    ];
    $stmtProd = $pdo->prepare("INSERT OR IGNORE INTO cms_products (slug, title, category, dimensions, short_desc, specs_json, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    foreach ($products as $p) {
        $stmtProd->execute([$p['slug'], $p['title'], $p['category'], $p['dimensions'], $p['short_desc'], $p['specs_json'], $p['image_path'], $p['image_alt'], $p['sort_order']]);
    }

    $projects = [
        [
            'slug' => 'complexe-modulaire-base-vie-pk26',
            'title' => 'Complexe Modulaire Base-Vie',
            'category' => 'bases-vie',
            'location' => 'Attinguié, PK 26',
            'year_completed' => '2026',
            'need_text' => 'Héberger et encadrer les équipes techniques BTP directement sur site avec confort thermique.',
            'solution_text' => 'Cantonnement complet regroupant dortoirs d\'encadrement, réfectoire et salles de réunion sur plateforme gravillonnée pour exploitation BTP.',
            'result_text' => 'Mise en service rapide et autonomie complète sur le chantier.',
            'image_path' => 'complexe-base-vie-plateforme.jpg',
            'image_alt' => 'Complexe modulaire base-vie de chantier sur plateforme stabilisée',
            'sort_order' => 1
        ],
        [
            'slug' => 'bureau-direction-sol-parquet-abidjan',
            'title' => 'Bureau de Direction & Sol Parquet',
            'category' => 'bureaux',
            'location' => 'Abidjan, Zone Industrielle',
            'year_completed' => '2026',
            'need_text' => 'Disposer d\'un bureau d\'exploitation haut standing immédiatement opérationnel en zone industrielle.',
            'solution_text' => 'Aménagement intérieur haut standing avec revêtement parquet flottant, faux-plafond acoustique, éclairage LED encastré et split tropicalisé.',
            'result_text' => 'Confort acoustique et thermique optimal dès le premier jour d\'exploitation.',
            'image_path' => 'interieur-bureau-parquet-clim.jpg',
            'image_alt' => 'Intérieur de bureau de direction conteneur aménagé avec sol parquet et climatisation',
            'sort_order' => 2
        ],
        [
            'slug' => 'bloc-sanitaire-faience-murale-san-pedro',
            'title' => 'Bloc Sanitaire & Faïence Murale',
            'category' => 'bases-vie',
            'location' => 'San Pedro',
            'year_completed' => '2025',
            'need_text' => 'Offrir des installations sanitaires robustes, hygiéniques et faciles à entretenir pour les équipes de terrain.',
            'solution_text' => 'Unité sanitaire tout confort avec carrelage intégral, rangée de vasques céramiques, miroirs, siphons inox et robinetterie temporisée.',
            'result_text' => 'Hygiène irréprochable et résistance à l\'usage intensif quotidien.',
            'image_path' => 'sanitaire-modulaire-carrelage.jpg',
            'image_alt' => 'Bloc sanitaire modulaire avec carrelage faïence, vasques et miroirs',
            'sort_order' => 3
        ],
        [
            'slug' => 'livraison-calage-camion-grue-ci',
            'title' => 'Livraison & Calage par Camion-Grue',
            'category' => 'technique',
            'location' => 'Chantier Autoroutier, CI',
            'year_completed' => '2026',
            'need_text' => 'Acheminer et poser avec précision des modules préfabriqués sur une zone de travaux difficile d\'accès.',
            'solution_text' => 'Acheminement direct et déchargement par grue télescopique sans intermédiaire, assurant une pose de niveau sur plots béton.',
            'result_text' => 'Déploiement sécurisé en quelques heures sans sous-traitance logistique.',
            'image_path' => 'livraison-camion-grue-chantier.jpg',
            'image_alt' => 'Camion-grue tout-terrain ETS AGBONOUGLA livrant un conteneur sur chantier',
            'sort_order' => 4
        ]
    ];
    $stmtProj = $pdo->prepare("INSERT OR IGNORE INTO cms_projects (slug, title, category, location, year_completed, need_text, solution_text, result_text, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    foreach ($projects as $pr) {
        $stmtProj->execute([$pr['slug'], $pr['title'], $pr['category'], $pr['location'], $pr['year_completed'], $pr['need_text'], $pr['solution_text'], $pr['result_text'], $pr['image_path'], $pr['image_alt'], $pr['sort_order']]);
    }

    $faqs = [
        ['Quels sont les délais moyens de fabrication et livraison ?', 'Pour un module bureau 20 pieds standard en stock sur notre parc d’Attinguié (PK 26), la préparation prend 3 à 5 jours ouvrés. Pour un aménagement sur-mesure complexe, comptez 10 à 21 jours selon le cahier des charges.', 'Délais & Livraison', 1],
        ['Assurez-vous le transport et le déchargement par grue sur chantier ?', 'Oui. Nous organisons l’acheminement par camion plateau et camion-grue (HIAB) sur Abidjan et l’ensemble du territoire ivoirien.', 'Logistique', 2],
        ['Comment vos conteneurs sont-ils isolés contre la chaleur ?', 'Nous utilisons des panneaux sandwich polyuréthane haute densité (60 à 80 mm) ou laine de roche avec parement PVC/mélaminé, complétés par une climatisation split dimensionnée.', 'Spécifications', 3]
    ];
    $stmtFaq = $pdo->prepare("INSERT OR IGNORE INTO cms_faq (question, answer, category, sort_order, published) VALUES (?, ?, ?, ?, 1)");
    foreach ($faqs as $f) {
        $stmtFaq->execute($f);
    }

    $jobs = [
        ['Chef de Chantier — Pose Modulaire', 'Chantier & BTP', 'Abidjan & Déplacements', 'Temps plein', 'Supervision de la dépose par camion-grue, contrôle du calage de niveau sur plots béton, gestion des raccords d\'étanchéité et respect des consignes de sécurité sur chantier.'],
        ['Soudeur-Chaudronnier Métallique', 'Métallurgie', 'Atelier Attinguié (PK 26)', 'Temps plein', 'Découpe au chalumeau / plasma de parois acier Corten, soudure à l\'arc / semi-automatique des précadres de renfort de baies, et réparations structurelles.'],
        ['Électricien Bâtiment & Climatisation', 'Électricité', 'Atelier & Chantier', 'Temps plein', 'Câblage des tableaux électriques différentiels, éclairage LED, prises de courant et pré-raccordement des climatiseurs split pour livraison prête à brancher.']
    ];
    $stmtJob = $pdo->prepare("INSERT OR IGNORE INTO cms_jobs (title, department, location, contract_type, description, published) VALUES (?, ?, ?, ?, ?, 1)");
    foreach ($jobs as $j) {
        $stmtJob->execute($j);
    }

    $seos = [
        ['index.html', 'ETS AGBONOUGLA — Conteneurs Modulaires & Bases-Vie de Chantier en Côte d’Ivoire', 'Fabrication et aménagement de conteneurs préfabriqués, bureaux de chantier, bases-vie et locaux techniques à Attinguié (PK 26, Abidjan). Devis sous 24h.', 'rendu-hero-souhaiter.jpg'],
        ['ets_solutions.html', 'Solutions Modulaires & Conteneurs Aménagés — ETS AGBONOUGLA', 'Découvrez nos gammes de conteneurs 20 et 40 pieds : bureaux de chantier, bases-vie, blocs sanitaires et stockage sécurisé.', 'complexe-base-vie-plateforme.jpg'],
        ['ets_expertise.html', 'Expertise Industrielle & Atelier PK 26 — ETS AGBONOUGLA', '2 500 m² d’atelier à Attinguié : chaudronnerie Corten, isolation thermique, électricité aux normes et logistique grue.', 'ossature-plancher-technique-soudure.jpg'],
        ['ets_references.html', 'Réalisations & Projets Livrés — ETS AGBONOUGLA', 'Galerie de nos conteneurs aménagés et bases-vie déployés sur les chantiers et sites industriels en Côte d’Ivoire.', 'interieur-bureau-parquet-clim.jpg'],
        ['ets_contact.html', 'Demander un Devis Conteneur sous 24h — ETS AGBONOUGLA', 'Contactez notre bureau d’études à Attinguié (PK 26 Autoroute du Nord) pour chiffrer votre projet modulaire.', 'contact-hero-banner.jpg'],
        ['ets_carriere.html', 'Carrières & Métiers d’Atelier — ETS AGBONOUGLA', 'Rejoignez nos équipes de soudeurs, électriciens, menuisiers aluminium et techniciens à Attinguié.', 'equipe-technique-atelier.jpg']
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

function list_available_images(): array {
    $imgDir = dirname(__DIR__) . '/assets/images';
    if (!is_dir($imgDir)) return [];
    $files = scandir($imgDir) ?: [];
    $result = [];
    foreach ($files as $f) {
        if ($f === '.' || $f === '..') continue;
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'], true) && is_file($imgDir . '/' . $f)) {
            $result[] = $f;
        }
    }
    sort($result);
    return $result;
}

function require_auth(PDO $pdo, string $method = 'GET'): array {
    // Purge périodique des sessions expirées
    $pdo->exec("DELETE FROM sessions_admin WHERE expires_at <= CURRENT_TIMESTAMP");

    if (!empty($_SESSION['admin_user'])) {
        $sessId = session_id();
        // Vérifie que la session n'a pas été révoquée en base
        $stmt = $pdo->prepare("SELECT revoked, csrf_token FROM sessions_admin WHERE id = ?");
        $stmt->execute([$sessId]);
        $sessRow = $stmt->fetch();
        if ($sessRow && (int)$sessRow['revoked'] === 1) {
            session_destroy();
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Cette session a été révoquée. Veuillez vous reconnecter.']);
            exit;
        }

        // Vérification stricte du jeton CSRF sur toutes les opérations de modification
        if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            $sentCsrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
            $expectedCsrf = $_SESSION['csrf_token'] ?? '';
            if ($expectedCsrf === '' || $sentCsrf === '' || !hash_equals($expectedCsrf, (string)$sentCsrf)) {
                http_response_code(403);
                echo json_encode(['ok' => false, 'error' => 'Jeton de sécurité CSRF manquant ou invalide. Veuillez actualiser la page.']);
                exit;
            }
        }

        if ($sessRow) {
            $pdo->prepare("UPDATE sessions_admin SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$sessId]);
        }

        return $_SESSION['admin_user'];
    }

    $headerToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    if ($headerToken !== '') {
        $stmt = $pdo->prepare("SELECT u.id, u.email, u.display_name, u.role, s.id AS sess_id FROM sessions_admin s JOIN users_admin u ON u.id = s.user_id WHERE s.csrf_token = ? AND s.revoked = 0 AND s.expires_at > CURRENT_TIMESTAMP");
        $stmt->execute([$headerToken]);
        $u = $stmt->fetch();
        if ($u) {
            $pdo->prepare("UPDATE sessions_admin SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$u['sess_id']]);
            return $u;
        }
    }

    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Authentification requise. Session expirée ou non autorisée.']);
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
        $isAuth = !empty($_SESSION['admin_user']);
        $totpEnabled = strtolower(env_val('ADMIN_TOTP_ENABLED', 'true')) !== 'false';
        $showQrOnce = strtolower(env_val('ADMIN_SHOW_2FA_QR_ONCE', 'false')) === 'true';
        $adminEmail = env_val('ADMIN_INITIAL_EMAIL', 'direction@etsagbonougla.net');
        $totpSecret = env_val('ADMIN_TOTP_SECRET', 'JBSWY3DPEHPK3PXP');

        if (!$isAuth) {
            $resp = [
                'ok' => true,
                'status' => 'operational',
                'authenticated' => false,
                'csrf_token' => $_SESSION['csrf_token'],
                'totp_enabled' => $totpEnabled,
                'show_2fa_qr' => $showQrOnce
            ];
            if ($showQrOnce && $totpEnabled) {
                $issuer = rawurlencode('ETS AGBONOUGLA');
                $label = rawurlencode('ETS AGBONOUGLA:' . $adminEmail);
                $resp['totp_qr_uri'] = "otpauth://totp/{$label}?secret={$totpSecret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
                $resp['totp_secret_formatted'] = trim(chunk_split($totpSecret, 4, ' '));
            }
            echo json_encode($resp);
            exit;
        }

        $leadCount = (int)$pdo->query("SELECT COUNT(*) FROM leads_crm")->fetchColumn();
        $prodCount = (int)$pdo->query("SELECT COUNT(*) FROM cms_products")->fetchColumn();
        $projCount = (int)$pdo->query("SELECT COUNT(*) FROM cms_projects")->fetchColumn();
        echo json_encode([
            'ok' => true,
            'status' => 'operational',
            'authenticated' => true,
            'user' => $_SESSION['admin_user'],
            'csrf_token' => $_SESSION['csrf_token'],
            'totp_enabled' => $totpEnabled,
            'show_2fa_qr' => $showQrOnce,
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
        $totpCode = trim((string)($in['totp_code'] ?? ''));

        // Source de vérité unique : le fichier .env
        $envEmail = strtolower(trim(env_val('ADMIN_INITIAL_EMAIL', 'direction@etsagbonougla.net')));
        $envPassPlain = env_val('ADMIN_PASSWORD', 'EtsAgbonougla2026!');
        $envPassHash = env_val('ADMIN_INITIAL_PASSWORD_HASH', '');
        $totpEnabled = strtolower(env_val('ADMIN_TOTP_ENABLED', 'true')) !== 'false';
        $totpSecret = env_val('ADMIN_TOTP_SECRET', 'JBSWY3DPEHPK3PXP');

        $stmt = $pdo->prepare("SELECT * FROM users_admin WHERE LOWER(email) = ?");
        $stmt->execute([$envEmail]);
        $user = $stmt->fetch();
        if (!$user) {
            $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
            $h = $envPassHash !== '' ? $envPassHash : password_hash($envPassPlain, $algo);
            $pdo->prepare("INSERT INTO users_admin (email, display_name, role, password_hash, totp_secret, totp_enabled) VALUES (?, 'Direction ETS AGBONOUGLA', 'OWNER', ?, ?, 1)")
                ->execute([$envEmail, $h, $totpSecret]);
            $stmt->execute([$envEmail]);
            $user = $stmt->fetch();
        }

        if ($user && !empty($user['locked_until']) && strtotime($user['locked_until']) > time()) {
            log_audit($pdo, $email, 'LOGIN_BLOQUÉ', 'users_admin', 'Tentative pendant verrouillage anti-bruteforce.');
            http_response_code(429);
            echo json_encode(['ok' => false, 'error' => 'Compte verrouillé temporairement (15 min) suite à plusieurs échecs.']);
            exit;
        }

        // Vérification de l'email et du mot de passe directement contre la configuration .env
        $emailOk = ($email !== '' && hash_equals($envEmail, $email));
        $passOk = false;
        if ($envPassHash !== '') {
            $passOk = password_verify($password, $envPassHash);
        } else {
            $passOk = ($password !== '' && hash_equals($envPassPlain, $password));
        }

        if (!$emailOk || !$passOk) {
            if ($user) {
                $fails = (int)$user['failed_attempts'] + 1;
                $lock = $fails >= 5 ? date('Y-m-d H:i:s', time() + 900) : null;
                $pdo->prepare("UPDATE users_admin SET failed_attempts = ?, locked_until = ? WHERE id = ?")
                    ->execute([$fails, $lock, $user['id']]);
            }
            log_audit($pdo, $email ?: 'inconnu', 'LOGIN_ÉCHEC', '.env', 'Identifiant ou mot de passe invalide.');
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Identifiant ou mot de passe incorrect.']);
            exit;
        }

        // Vérification obligatoire du code Google Authenticator (TOTP 6 chiffres)
        if ($totpEnabled) {
            if ($totpCode === '' || !verify_totp_code($totpSecret, $totpCode)) {
                $fails = (int)$user['failed_attempts'] + 1;
                $lock = $fails >= 5 ? date('Y-m-d H:i:s', time() + 900) : null;
                $pdo->prepare("UPDATE users_admin SET failed_attempts = ?, locked_until = ? WHERE id = ?")
                    ->execute([$fails, $lock, $user['id']]);
                log_audit($pdo, $email, '2FA_ÉCHEC', 'Google Authenticator', 'Code TOTP à 6 chiffres invalide ou expiré.');
                http_response_code(401);
                echo json_encode(['ok' => false, 'error' => 'Code Google Authenticator (6 chiffres) invalide ou expiré.']);
                exit;
            }
        }

        // Si le QR Code à usage unique était affiché, on le verrouille définitivement dans .env
        if (strtolower(env_val('ADMIN_SHOW_2FA_QR_ONCE', 'false')) === 'true') {
            consume_2fa_qr_in_env();
            log_audit($pdo, $user['email'], '2FA_QR_VERROUILLÉ', '.env', 'QR Code Google Authenticator scanné et verrouillé automatiquement (ADMIN_SHOW_2FA_QR_ONCE=false).');
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
        $pdo->prepare("INSERT OR REPLACE INTO sessions_admin (id, user_id, csrf_token, ip_hash, user_agent, expires_at, revoked) VALUES (?, ?, ?, ?, ?, ?, 0)")
            ->execute([$sessId, $user['id'], $_SESSION['csrf_token'], visitor_daily_hash(), substr($_SERVER['HTTP_USER_AGENT'] ?? 'Browser', 0, 240), date('Y-m-d H:i:s', time() + 3600 * 8)]);

        log_audit($pdo, $user['email'], 'LOGIN_SUCCÈS', 'sessions_admin', 'Connexion administrateur + 2FA Google Authenticator validée.');

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
        $_SESSION = [];
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
        $jobs = $pdo->query("SELECT * FROM cms_jobs WHERE published = 1 ORDER BY id ASC")->fetchAll();
        $seo = $pdo->query("SELECT * FROM cms_seo")->fetchAll();

        $resp = [
            'ok' => true,
            'settings' => $settings,
            'products' => $products,
            'projects' => $projects,
            'faq' => $faq,
            'jobs' => $jobs,
            'seo' => $seo
        ];
        if (!empty($_SESSION['admin_user'])) {
            $resp['available_images'] = list_available_images();
        }
        echo json_encode($resp);
        exit;
    }

    if ($route === 'leads' && $method === 'POST') {
        $in = json_body();
        if (!empty($in['website_url_hp'])) {
            echo json_encode(['ok' => true, 'reference' => 'ETS-FILTERED']);
            exit;
        }

        // Rate-limiting anti-spam pour les visiteurs non authentifiés (max 8 soumissions / 30 min par IP)
        if (empty($_SESSION['admin_user'])) {
            $ipHash = visitor_daily_hash();
            $since30m = gmdate('Y-m-d H:i:s', time() - 1800);
            $stmtRate = $pdo->prepare("SELECT COUNT(*) FROM audit_logs WHERE ip_hash = ? AND action_type = 'NOUVEAU_DEVIS' AND created_at >= ?");
            $stmtRate->execute([$ipHash, $since30m]);
            if ((int)$stmtRate->fetchColumn() >= 8) {
                http_response_code(429);
                echo json_encode(['ok' => false, 'error' => 'Trop de demandes envoyées récemment. Veuillez patienter ou nous contacter par téléphone au +225 07 07 83 17 91.']);
                exit;
            }
        } else {
            // Si créé depuis le back-office, vérifier le jeton CSRF
            require_auth($pdo, 'POST');
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
        $status = !empty($_SESSION['admin_user']) ? trim(strip_tags((string)($in['status'] ?? 'Nouveau'))) : 'Nouveau';

        if (mb_strlen($name) < 2 || mb_strlen($phone) < 6) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'Veuillez renseigner votre nom complet et un numéro de téléphone valide.']);
            exit;
        }

        $ref = 'ETS-' . date('Y') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        $stmt = $pdo->prepare("INSERT INTO leads_crm (reference, full_name, company, phone, email, location, product_type, dimensions, quantity, timeline, message, source_page, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$ref, $name, $company, $phone, $email, $location, $productType, $dimensions, $quantity, $timeline, $message ?: 'Demande de chiffrage standard', $source, $status]);
        $leadId = (int)$pdo->lastInsertId();

        $actor = !empty($_SESSION['admin_user']) ? $_SESSION['admin_user']['email'] : 'SITE_PUBLIC';
        log_audit($pdo, $actor, 'NOUVEAU_DEVIS', $ref, "Demande enregistrée ({$productType} - {$name})");

        echo json_encode([
            'ok' => true,
            'id' => $leadId,
            'reference' => $ref,
            'message' => "Votre demande de devis ({$ref}) a bien été enregistrée par notre bureau d'études."
        ]);
        exit;
    }

    if ($route === 'analytics-beacon' && $method === 'POST') {
        $vHash = visitor_daily_hash();
        // Rate-limiting sur le beacon analytics (max 60 / minute par visiteur)
        $since1m = gmdate('Y-m-d H:i:s', time() - 60);
        $stmtRate = $pdo->prepare("SELECT COUNT(*) FROM analytics_events WHERE visitor_hash = ? AND created_at >= ?");
        $stmtRate->execute([$vHash, $since1m]);
        if ((int)$stmtRate->fetchColumn() >= 60) {
            echo json_encode(['ok' => true, 'throttled' => true]);
            exit;
        }

        $in = json_body();
        $type = in_array($in['type'] ?? '', ['pageview', 'click', 'scroll_depth', 'session_end'], true) ? $in['type'] : 'pageview';
        $path = substr(trim(strip_tags((string)($in['path'] ?? 'index.html'))), 0, 140);
        $target = substr(trim(strip_tags((string)($in['target'] ?? '')), " \t\n\r"), 0, 110);
        $val = substr(trim(strip_tags((string)($in['value'] ?? ''))), 0, 60);
        $sessId = substr(preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($in['sessionId'] ?? 's0')), 0, 48);

        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $device = preg_match('/Mobile|Android|iPhone/i', $ua) ? 'Mobile' : (preg_match('/iPad|Tablet/i', $ua) ? 'Tablette' : 'Desktop');
        $browser = str_contains($ua, 'Edg') ? 'Edge' : (str_contains($ua, 'Chrome') ? 'Chrome' : (str_contains($ua, 'Firefox') ? 'Firefox' : (str_contains($ua, 'Safari') ? 'Safari' : 'Autre')));
        $ref = substr(trim(strip_tags((string)($in['referrer'] ?? 'Direct'))), 0, 180) ?: 'Direct';

        $stmt = $pdo->prepare("INSERT INTO analytics_events (visitor_hash, session_id, event_type, page_path, target_key, event_value, device_type, browser, referrer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$vHash, $sessId, $type, $path, $target, $val, $device, $browser, $ref]);
        echo json_encode(['ok' => true]);
        exit;
    }

    // =========================================================================
    // ROUTES ADMINISTRATEUR PROTÉGÉES (AUTH + CSRF OBLIGATOIRES)
    // =========================================================================
    $admin = require_auth($pdo, $method);

    if ($route === 'upload-image' && $method === 'POST') {
        if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Aucun fichier image valide reçu.']);
            exit;
        }

        $file = $_FILES['image'];
        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'L\'image dépasse la taille maximale autorisée (5 Mo).']);
            exit;
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp'
        ];
        if (!isset($allowedMimes[$mime]) || @getimagesize($file['tmp_name']) === false) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'Format non autorisé. Utilisez uniquement JPG, PNG ou WEBP.']);
            exit;
        }

        $ext = $allowedMimes[$mime];
        $origBase = pathinfo($file['name'], PATHINFO_FILENAME);
        $safeBase = strtolower(trim(preg_replace('/[^a-zA-Z0-9_-]+/', '-', $origBase), '-')) ?: 'visuel-atelier';
        $safeBase = substr($safeBase, 0, 60);
        $targetDir = dirname(__DIR__) . '/assets/images';
        $filename = $safeBase . '.' . $ext;
        if (file_exists($targetDir . '/' . $filename)) {
            $filename = $safeBase . '-' . date('His') . '.' . $ext;
        }

        if (!move_uploaded_file($file['tmp_name'], $targetDir . '/' . $filename)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Impossible d\'enregistrer l\'image sur le disque.']);
            exit;
        }

        log_audit($pdo, $admin['email'], 'IMAGE_UPLOADÉE', $filename, "Nouveau visuel téléversé dans assets/images/{$filename}");
        echo json_encode([
            'ok' => true,
            'filename' => $filename,
            'available_images' => list_available_images()
        ]);
        exit;
    }

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
            if ($id <= 0) {
                http_response_code(422);
                echo json_encode(['ok' => false, 'error' => 'Identifiant de dossier invalide.']);
                exit;
            }
            if (!empty($in['status'])) {
                $status = trim(strip_tags((string)$in['status']));
                $assigned = trim(strip_tags((string)($in['assigned_to'] ?? 'Direction Commerciale')));
                $est = trim(strip_tags((string)($in['estimated_value'] ?? 'Sur étude')));
                $pdo->prepare("UPDATE leads_crm SET status = ?, assigned_to = ?, estimated_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    ->execute([$status, $assigned, $est, $id]);
                log_audit($pdo, $admin['email'], 'STATUT_CRM_MODIFIÉ', "Lead #{$id}", "Statut : {$status} | Estimatif : {$est}");
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
                $cleanKey = preg_replace('/[^a-zA-Z0-9_]/', '', (string)$k);
                if ($cleanKey !== '') {
                    $stmt->execute([$cleanKey, trim(strip_tags((string)$v))]);
                }
            }
            log_audit($pdo, $admin['email'], 'PARAMÈTRES_CMS', 'cms_settings', 'Mise à jour des coordonnées et paramètres généraux du site.');
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'product') {
            $id = (int)($in['id'] ?? 0);
            $title = trim(strip_tags((string)($in['title'] ?? '')));
            $cat = trim(strip_tags((string)($in['category'] ?? 'Bureaux & Bases-vie')));
            $dim = trim(strip_tags((string)($in['dimensions'] ?? '20 pieds')));
            $desc = trim(strip_tags((string)($in['short_desc'] ?? '')));
            $img = basename(trim(strip_tags((string)($in['image_path'] ?? 'complexe-base-vie-plateforme.jpg'))));
            $alt = trim(strip_tags((string)($in['image_alt'] ?? $title)));
            $specsRaw = $in['specs'] ?? '';
            if (is_array($specsRaw)) {
                $specsArr = array_values(array_filter(array_map('trim', $specsRaw)));
            } else {
                $specsArr = array_values(array_filter(array_map('trim', explode("\n", (string)$specsRaw))));
            }
            $specsJson = json_encode($specsArr, JSON_UNESCAPED_UNICODE);
            $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-')) ?: 'module-' . time();

            if ($id > 0) {
                $pdo->prepare("UPDATE cms_products SET title=?, category=?, dimensions=?, short_desc=?, specs_json=?, image_path=?, image_alt=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
                    ->execute([$title, $cat, $dim, $desc, $specsJson, $img, $alt, $id]);
                log_audit($pdo, $admin['email'], 'PRODUIT_MODIFIÉ', $title, "Modification de la solution modulaire #{$id}");
            } else {
                $pdo->prepare("INSERT INTO cms_products (slug, title, category, dimensions, short_desc, specs_json, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)")
                    ->execute([$slug . '-' . random_int(10, 99), $title, $cat, $dim, $desc, $specsJson, $img, $alt]);
                $id = (int)$pdo->lastInsertId();
                log_audit($pdo, $admin['email'], 'PRODUIT_CRÉÉ', $title, "Nouvelle solution modulaire ajoutée au catalogue (#{$id}).");
            }
            echo json_encode(['ok' => true, 'id' => $id]);
            exit;
        }

        if ($method === 'DELETE' && $entity === 'product') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM cms_products WHERE id = ?")->execute([$id]);
            log_audit($pdo, $admin['email'], 'PRODUIT_SUPPRIMÉ', "Produit #{$id}", "Suppression d'une solution du catalogue.");
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'project') {
            $id = (int)($in['id'] ?? 0);
            $title = trim(strip_tags((string)($in['title'] ?? '')));
            $cat = trim(strip_tags((string)($in['category'] ?? 'bases-vie')));
            $loc = trim(strip_tags((string)($in['location'] ?? 'Abidjan')));
            $year = trim(strip_tags((string)($in['year_completed'] ?? '2026')));
            $need = trim(strip_tags((string)($in['need_text'] ?? '')));
            $sol = trim(strip_tags((string)($in['solution_text'] ?? '')));
            $res = trim(strip_tags((string)($in['result_text'] ?? '')));
            $img = basename(trim(strip_tags((string)($in['image_path'] ?? 'complexe-base-vie-plateforme.jpg'))));
            $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-')) ?: 'projet-' . time();

            if ($id > 0) {
                $pdo->prepare("UPDATE cms_projects SET title=?, category=?, location=?, year_completed=?, need_text=?, solution_text=?, result_text=?, image_path=?, image_alt=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
                    ->execute([$title, $cat, $loc, $year, $need, $sol, $res, $img, $title, $id]);
                log_audit($pdo, $admin['email'], 'PROJET_MODIFIÉ', $title, "Modification de la réalisation #{$id}");
            } else {
                $pdo->prepare("INSERT INTO cms_projects (slug, title, category, location, year_completed, need_text, solution_text, result_text, image_path, image_alt, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)")
                    ->execute([$slug . '-' . random_int(10, 99), $title, $cat, $loc, $year, $need, $sol, $res, $img, $title]);
                $id = (int)$pdo->lastInsertId();
                log_audit($pdo, $admin['email'], 'PROJET_CRÉÉ', $title, "Nouvelle réalisation ajoutée (#{$id}).");
            }
            echo json_encode(['ok' => true, 'id' => $id]);
            exit;
        }

        if ($method === 'DELETE' && $entity === 'project') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM cms_projects WHERE id = ?")->execute([$id]);
            log_audit($pdo, $admin['email'], 'PROJET_SUPPRIMÉ', "Projet #{$id}", "Suppression d'une réalisation.");
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'faq') {
            $id = (int)($in['id'] ?? 0);
            $q = trim(strip_tags((string)($in['question'] ?? '')));
            $a = trim(strip_tags((string)($in['answer'] ?? '')));
            $cat = trim(strip_tags((string)($in['category'] ?? 'Général')));
            if ($id > 0) {
                $pdo->prepare("UPDATE cms_faq SET question=?, answer=?, category=? WHERE id=?")->execute([$q, $a, $cat, $id]);
                log_audit($pdo, $admin['email'], 'FAQ_MODIFIÉE', "FAQ #{$id}", $q);
            } else {
                $pdo->prepare("INSERT INTO cms_faq (question, answer, category, sort_order, published) VALUES (?, ?, ?, 1, 1)")
                    ->execute([$q, $a, $cat]);
                $id = (int)$pdo->lastInsertId();
                log_audit($pdo, $admin['email'], 'FAQ_AJOUTÉE', "FAQ #{$id}", $q);
            }
            echo json_encode(['ok' => true, 'id' => $id]);
            exit;
        }

        if ($method === 'DELETE' && $entity === 'faq') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM cms_faq WHERE id = ?")->execute([$id]);
            log_audit($pdo, $admin['email'], 'FAQ_SUPPRIMÉE', "FAQ #{$id}", "Suppression d'une question FAQ.");
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'job') {
            $id = (int)($in['id'] ?? 0);
            $title = trim(strip_tags((string)($in['title'] ?? '')));
            $dept = trim(strip_tags((string)($in['department'] ?? 'Atelier & Chantier')));
            $loc = trim(strip_tags((string)($in['location'] ?? 'Attinguié (PK 26)')));
            $contract = trim(strip_tags((string)($in['contract_type'] ?? 'Temps plein')));
            $desc = trim(strip_tags((string)($in['description'] ?? '')));
            if ($id > 0) {
                $pdo->prepare("UPDATE cms_jobs SET title=?, department=?, location=?, contract_type=?, description=? WHERE id=?")
                    ->execute([$title, $dept, $loc, $contract, $desc, $id]);
                log_audit($pdo, $admin['email'], 'POSTE_MODIFIÉ', $title, "Offre d'emploi #{$id} mise à jour.");
            } else {
                $pdo->prepare("INSERT INTO cms_jobs (title, department, location, contract_type, description, published) VALUES (?, ?, ?, ?, ?, 1)")
                    ->execute([$title, $dept, $loc, $contract, $desc]);
                $id = (int)$pdo->lastInsertId();
                log_audit($pdo, $admin['email'], 'POSTE_CRÉÉ', $title, "Nouvelle offre d'emploi publiée (#{$id}).");
            }
            echo json_encode(['ok' => true, 'id' => $id]);
            exit;
        }

        if ($method === 'DELETE' && $entity === 'job') {
            $id = (int)($_GET['id'] ?? 0);
            $pdo->prepare("DELETE FROM cms_jobs WHERE id = ?")->execute([$id]);
            log_audit($pdo, $admin['email'], 'POSTE_SUPPRIMÉ', "Poste #{$id}", "Suppression d'une offre d'emploi.");
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'POST' && $entity === 'seo') {
            $page = basename(trim((string)($in['page_path'] ?? 'index.html')));
            $title = trim(strip_tags((string)($in['page_title'] ?? '')));
            $desc = trim(strip_tags((string)($in['meta_description'] ?? '')));
            $og = basename(trim(strip_tags((string)($in['og_image'] ?? 'rendu-hero-souhaiter.jpg'))));
            $pdo->prepare("INSERT OR REPLACE INTO cms_seo (page_path, page_title, meta_description, og_image, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)")
                ->execute([$page, $title, $desc, $og]);
            log_audit($pdo, $admin['email'], 'SEO_MODIFIÉ', $page, "Métadonnées SEO mises à jour pour {$page}");
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // Aucune route de modification de mot de passe ou de 2FA n'est exposée via l'API :
    // Les identifiants et le secret TOTP sont gérés exclusivement dans le fichier .env serveur.

    if ($route === 'analytics') {
        if ($method === 'DELETE') {
            $pdo->exec("DELETE FROM analytics_events");
            log_audit($pdo, $admin['email'], 'ANALYTICS_PURGÉ', 'analytics_events', 'Réinitialisation des statistiques de visite.');
            echo json_encode(['ok' => true]);
            exit;
        }
        $events = $pdo->query("SELECT id, event_type AS type, page_path, target_key AS target, device_type, browser, created_at FROM analytics_events ORDER BY id DESC LIMIT 200")->fetchAll();
        echo json_encode(['ok' => true, 'events' => $events]);
        exit;
    }

    if ($route === 'security') {
        if ($method === 'DELETE') {
            $targetSess = trim((string)($_GET['session_id'] ?? ''));
            if ($targetSess !== '') {
                $pdo->prepare("UPDATE sessions_admin SET revoked = 1 WHERE id = ?")->execute([$targetSess]);
                log_audit($pdo, $admin['email'], 'SESSION_RÉVOQUÉE', 'sessions_admin', 'Révocation manuelle d\'une session distante.');
            }
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($method === 'GET') {
            $currId = session_id();
            $sessions = $pdo->query("SELECT id, ip_hash, user_agent, created_at, last_active_at, expires_at, revoked FROM sessions_admin ORDER BY last_active_at DESC LIMIT 25")->fetchAll();
            foreach ($sessions as &$s) {
                $s['is_current'] = ($s['id'] === $currId);
                // Masque l'identifiant brut de session pour les autres sessions (ne garde qu'un identifiant de révocation ou hash)
            }
            $audits = $pdo->query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")->fetchAll();
            $totalViews = (int)$pdo->query("SELECT COUNT(*) FROM analytics_events WHERE event_type = 'pageview'")->fetchColumn();
            $totalClicks = (int)$pdo->query("SELECT COUNT(*) FROM analytics_events WHERE event_type = 'click'")->fetchColumn();
            $uniqueVisitors = (int)$pdo->query("SELECT COUNT(DISTINCT visitor_hash) FROM analytics_events")->fetchColumn();

            echo json_encode([
                'ok' => true,
                'sessions' => $sessions,
                'audits' => $audits,
                'analytics_summary' => [
                    'pageviews' => $totalViews,
                    'clicks' => $totalClicks,
                    'unique_visitors' => $uniqueVisitors
                ]
            ]);
            exit;
        }
    }

    echo json_encode(['ok' => false, 'error' => 'Route inconnue.']);
} catch (Throwable $e) {
    error_log('[ETS AGBONOUGLA API ERROR] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Une erreur interne est survenue. Veuillez contacter le support.']);
}
