/**
 * ETS AGBONOUGLA — Lanceur de développement local
 * Compatible Windows, macOS, Linux
 * 
 * Lance le serveur PHP 8.3 avec accès direct à la base SQLite database/ets_agbonougla.sqlite
 * et ouvre automatiquement le site dans votre navigateur par défaut.
 */

const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const HOST = '127.0.0.1';
const ROOT_DIR = __dirname;

console.log('\n================================================================');
console.log('  ETS AGBONOUGLA — Environnement de Développement Local');
console.log('  Design & Développement : LAMANO DESIGN');
console.log('================================================================\n');

// 1. Tente de lancer le serveur PHP intégré (supporte l\'API PHP + SQLite + Front-end)
const phpProc = spawn('php', ['-S', `${HOST}:${PORT}`, '-t', ROOT_DIR], {
  cwd: ROOT_DIR,
  stdio: ['inherit', 'pipe', 'pipe']
});

let phpRunning = false;

phpProc.stdout.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log(`[PHP] ${line}`);
});

phpProc.stderr.on('data', (data) => {
  const line = data.toString().trim();
  // PHP écrit les requêtes normales sur stderr
  if (line.includes('Development Server (http://') || line.includes('started')) {
    phpRunning = true;
  }
  console.log(`[PHP] ${line}`);
});

phpProc.on('error', (err) => {
  console.warn('\n[AVERTISSEMENT] PHP n\'a pas pu être démarré directement :', err.message);
  console.log('[RELAIS] Démarrage du serveur statique Node.js de secours sur le port ' + PORT + '...\n');
  startNodeFallback();
});

// Affiche le récapitulatif après 600ms et ouvre le navigateur
setTimeout(() => {
  console.log('\n================================================================');
  console.log(`  SERVEUR PRÊT : http://localhost:${PORT}`);
  console.log('----------------------------------------------------------------');
  console.log(`  Site Public :        http://localhost:${PORT}/index.html`);
  console.log(`  Interface Admin :    http://localhost:${PORT}/admin.html`);
  console.log(`  API Backend :        http://localhost:${PORT}/api/index.php?route=status`);
  console.log(`  Base de Données :    database/ets_agbonougla.sqlite`);
  console.log('================================================================');
  console.log('  Appuyez sur Ctrl+C pour arrêter le serveur à tout moment.\n');

  openBrowser(`http://localhost:${PORT}/index.html`);
}, 800);

// Fonction d'ouverture du navigateur selon l'OS
function openBrowser(url) {
  const plat = process.platform;
  const cmd = plat === 'win32' ? `start "" "${url}"` : plat === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

// Fallback serveur statique Node.js si PHP n'est pas dans le PATH
function startNodeFallback() {
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT_DIR, decodeURI(req.url.split('?')[0]));
    if (filePath === ROOT_DIR || filePath.endsWith(path.sep)) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Non trouvé');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`[NODE] Serveur statique de secours actif sur http://localhost:${PORT}`);
    openBrowser(`http://localhost:${PORT}/index.html`);
  });
}

// Gestion de la fermeture propre (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n[INFO] Arrêt du serveur ETS AGBONOUGLA...');
  if (phpProc && !phpProc.killed) {
    phpProc.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (phpProc && !phpProc.killed) {
    phpProc.kill('SIGTERM');
  }
  process.exit(0);
});
