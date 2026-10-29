/**
 * ETS AGBONOUGLA — Administration & Pilotage Opérationnel de Production
 * Connecté à l'API PHP sécurisée (api/index.php) et à la base relationnelle SQLite.
 */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Échappement HTML sécurisé contre XSS
  function esc(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  // Protection contre l'injection de formules CSV (Excel / LibreOffice)
  function sanitizeCsvCell(val) {
    let s = String(val == null ? '' : val).replace(/"/g, '""').replace(/\r?\n/g, ' ').trim();
    if (/^[=+\-@\t\r]/.test(s)) {
      s = "'" + s;
    }
    return s;
  }

  function showToast(msg) {
    const t = $('#adm-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-visible'), 3400);
  }

  function formatDate(dStr) {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dStr;
    }
  }

  function cleanPhoneForWa(phone) {
    const defaultWa = state.settings?.whatsapp_number || '2250707831791';
    if (!phone) return defaultWa;
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.length === 10 && !clean.startsWith('225')) {
      clean = '225' + clean;
    }
    return clean || defaultWa;
  }

  // État applicatif centralisé
  const state = {
    csrfToken: '',
    authenticatedUser: null,
    leads: [],
    products: [],
    projects: [],
    faq: [],
    jobs: [],
    seo: [],
    settings: {},
    availableImages: [
      'complexe-base-vie-plateforme.jpg',
      'interieur-bureau-parquet-clim.jpg',
      'parc-conteneurs-stock-iso.jpg',
      'ossature-plancher-technique-soudure.jpg',
      'sanitaire-modulaire-carrelage.jpg',
      'livraison-camion-grue-chantier.jpg',
      'equipe-terrain-epi-chantier.jpg',
      'parc-stockage-corten-ciel.jpg',
      'bureau-modulaire-fenetres-terrasse.jpg',
      'sanitaire-wc-modulaire-chantier.jpg',
      'camion-grue-manutention-parc.jpg',
      'bureau-interieur-lumineux-sol.jpg',
      'alignement-modules-base-vie-ciel.jpg',
      'pose-grue-ajustement-module.jpg',
      'sanitaire-vasque-fauteuil-chantier.jpg',
      'equipe-technique-atelier.jpg',
      'module-ossature-isolation.jpg',
      'container-3d-blue.jpg'
    ],
    sessions: [],
    audits: [],
    analyticsSummary: { pageviews: 0, clicks: 0, unique_visitors: 0 },
    activeLeadId: null,
    crmViewMode: 'table', // 'table' | 'kanban'
    filterStatus: 'ALL',
    filterType: 'ALL',
    searchQuery: '',
    auditSearchQuery: ''
  };

  // Helper requêtes JSON vers api/index.php
  async function apiFetch(route, options = {}) {
    const opts = Object.assign({ headers: {} }, options);
    if (!(opts.body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
    }
    if (state.csrfToken) {
      opts.headers['X-CSRF-Token'] = state.csrfToken;
    }

    const res = await fetch(`api/index.php?route=${route}`, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = { ok: false, error: 'Réponse serveur non valide.' };
    }
    return { status: res.status, ok: res.ok && data?.ok, data };
  }

  // ══════════════════════════════════════════════════════════════
  // INITIALISATION & AUTHENTIFICATION
  // ══════════════════════════════════════════════════════════════

  async function checkSession() {
    try {
      const { ok, data } = await apiFetch('status');
      if (ok && data) {
        state.csrfToken = data.csrf_token || '';
        updateEnvBadges(data);

        if (data.authenticated && data.user) {
          setAuthenticated(data.user);
        } else {
          showAuthGate(true);
        }
      } else {
        showAuthGate(true);
      }
    } catch (e) {
      console.warn('Erreur vérification statut :', e);
      showAuthGate(true);
    }
  }

  function updateEnvBadges(data) {
    if (data.db_file) {
      const badge = $('#adm-env-badge');
      if (badge) badge.textContent = 'PRODUCTION · SQLITE';
      const dbInfo = $('#sec-db-info');
      if (dbInfo) dbInfo.textContent = `SQLite (${data.db_file})`;
    }
    if (data.php_version) {
      const phpInfo = $('#sec-php-info');
      if (phpInfo) phpInfo.textContent = `PHP ${data.php_version}`;
    }

    // Statut Google Authenticator (TOTP) & QR Code Unique (.env)
    const totpEnabled = data.totp_enabled !== false;
    const totpField = $('#login-totp-field');
    const totpInput = $('#login-totp');
    if (totpField) {
      totpField.style.display = totpEnabled ? '' : 'none';
    }
    if (totpInput) {
      totpInput.required = totpEnabled;
    }

    const qrBox = $('#login-qr-once-box');
    const qrImg = $('#login-qr-img');
    const qrSecret = $('#login-qr-secret');
    if (qrBox) {
      if (totpEnabled && data.show_2fa_qr && data.totp_qr_uri) {
        qrBox.style.display = 'block';
        if (qrImg) {
          qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(data.totp_qr_uri)}`;
        }
        if (qrSecret) {
          qrSecret.textContent = data.totp_secret_formatted || '';
        }
      } else {
        qrBox.style.display = 'none';
        if (qrImg) qrImg.removeAttribute('src');
        if (qrSecret) qrSecret.textContent = '';
      }
    }

    const secTotp = $('#sec-totp-status');
    if (secTotp) {
      secTotp.textContent = totpEnabled ? 'Actif (RFC 6238)' : 'Désactivé (.env)';
      secTotp.style.color = totpEnabled ? 'var(--adm-green)' : 'var(--adm-ink-muted)';
    }
    const secQrOnce = $('#sec-qr-once-status');
    if (secQrOnce) {
      secQrOnce.textContent = data.show_2fa_qr ? 'En attente du 1er scan (.env)' : 'Consommé & Verrouillé (false)';
      secQrOnce.style.color = data.show_2fa_qr ? 'var(--adm-amber, #D97706)' : 'var(--adm-green)';
    }
  }

  function showAuthGate(show) {
    const gate = $('#adm-auth-gate');
    if (!gate) return;
    if (show) {
      gate.classList.remove('is-hidden');
      const pwd = $('#login-password');
      if (pwd) pwd.value = '';
      const totp = $('#login-totp');
      if (totp) totp.value = '';
    } else {
      gate.classList.add('is-hidden');
    }
  }

  async function setAuthenticated(user) {
    state.authenticatedUser = user;
    // Masque immédiatement et définitivement le bloc QR Code unique côté DOM
    const qrBox = $('#login-qr-once-box');
    if (qrBox) qrBox.style.display = 'none';
    showAuthGate(false);
    // Rafraîchit status en mode authentifié pour récupérer les infos techniques
    const st = await apiFetch('status');
    if (st.ok && st.data) {
      state.csrfToken = st.data.csrf_token || state.csrfToken;
      updateEnvBadges(st.data);
    }
    loadAllData();
  }

  // Formulaire de connexion (Email + Mot de passe .env + Code 2FA Google Authenticator)
  const loginForm = $('#adm-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = $('#login-error');
      const submitBtn = $('#btn-login-submit');
      if (errBox) errBox.style.display = 'none';

      const email = $('#login-email').value.trim();
      const password = $('#login-password').value;
      const totpInput = $('#login-totp');
      const totp_code = totpInput ? totpInput.value.replace(/\s+/g, '').trim() : '';
      const totpRequired = totpInput && totpInput.required;

      if (!email || !password || (totpRequired && !/^\d{6}$/.test(totp_code))) {
        if (errBox) {
          errBox.textContent = totpRequired
            ? 'Veuillez saisir votre email, votre mot de passe et le code à 6 chiffres Google Authenticator.'
            : 'Veuillez saisir votre email et votre mot de passe.';
          errBox.style.display = 'block';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Vérification...';
      }

      try {
        const { ok, data } = await apiFetch('login', {
          method: 'POST',
          body: JSON.stringify({ email, password, totp_code })
        });

        if (ok && data?.user) {
          state.csrfToken = data.csrf_token || state.csrfToken;
          await setAuthenticated(data.user);
          showToast(`Bienvenue, ${data.user.display_name || data.user.email}`);
        } else {
          if (errBox) {
            errBox.textContent = data?.error || 'Identifiants ou code 2FA incorrects.';
            errBox.style.display = 'block';
          }
        }
      } catch {
        if (errBox) {
          errBox.textContent = 'Erreur de communication avec le serveur PHP.';
          errBox.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Se connecter au tableau de bord';
        }
      }
    });
  }

  // Déconnexion
  $('#btn-logout')?.addEventListener('click', async () => {
    try {
      await apiFetch('logout', { method: 'POST' });
    } catch {}
    state.authenticatedUser = null;
    showAuthGate(true);
    showToast('Déconnexion effectuée.');
  });

  // ══════════════════════════════════════════════════════════════
  // NAVIGATION & ONGLETS
  // ══════════════════════════════════════════════════════════════

  function switchTab(tabId) {
    $$('.adm-pillnav__tab').forEach((b) => {
      const active = b.dataset.tab === tabId;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    $$('.adm-section').forEach((sec) => {
      sec.classList.toggle('is-active', sec.id === `tab-${tabId}`);
    });

    if (tabId === 'crm') {
      renderCrmView();
    } else if (tabId === 'security') {
      loadSecurityLogs();
    }
  }

  $$('.adm-pillnav__tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-jump-tab]');
    if (jump) {
      e.preventDefault();
      switchTab(jump.dataset.jumpTab);
    }
  });

  // Sous-onglets CMS
  $$('.adm-subnav__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.adm-subnav__btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const target = btn.dataset.cmsTab;
      $$('.adm-cms-panel').forEach((p) => {
        p.style.display = p.id === `cms-panel-${target}` ? 'block' : 'none';
      });
    });
  });

  // Bascule Thème Clair / Sombre
  const themeBtn = $('#btn-theme-toggle');
  if (themeBtn) {
    const savedTheme = localStorage.getItem('ets_admin_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ets_admin_theme', next);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // CHARGEMENT GLOBAL DES DONNÉES
  // ══════════════════════════════════════════════════════════════

  async function loadAllData() {
    await Promise.all([
      loadCrmLeads(),
      loadCmsData(),
      loadSecurityLogs()
    ]);
  }

  // ══════════════════════════════════════════════════════════════
  // CRM DEVIS (LEADS, TABLEAU, KANBAN & IMPRESSION)
  // ══════════════════════════════════════════════════════════════

  async function loadCrmLeads() {
    try {
      const { ok, data } = await apiFetch('crm');
      if (ok && Array.isArray(data.leads)) {
        state.leads = data.leads;
      }
    } catch (e) {
      console.warn('Erreur chargement leads :', e);
    }
    updateKpis();
    renderOverviewTable();
    renderCrmView();
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Nouveau': return 'adm-status--new';
      case 'Étude en cours': return 'adm-status--study';
      case 'Devis envoyé': return 'adm-status--sent';
      case 'Validé / En production': return 'adm-status--won';
      case 'Livré': return 'adm-status--won';
      case 'Archivé': return 'adm-status--archived';
      default: return 'adm-status--new';
    }
  }

  function updateKpis() {
    const total = state.leads.length;
    const newCount = state.leads.filter((l) => l.status === 'Nouveau').length;
    const activeCount = state.leads.filter((l) =>
      l.status === 'Étude en cours' || l.status === 'Validé / En production' || l.status === 'Devis envoyé'
    ).length;

    if ($('#kpi-total-leads')) $('#kpi-total-leads').textContent = total;
    if ($('#kpi-new-leads')) $('#kpi-new-leads').textContent = newCount;
    if ($('#kpi-new-leads-trend')) $('#kpi-new-leads-trend').textContent = `${newCount} nouveau(x)`;
    if ($('#kpi-active-leads')) $('#kpi-active-leads').textContent = activeCount;
    if ($('#nav-crm-count')) $('#nav-crm-count').textContent = newCount;
  }

  function renderOverviewTable() {
    const tbody = $('#overview-leads-tbody');
    if (!tbody) return;

    const recent = state.leads.slice(0, 6);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--adm-ink-muted);">Aucune demande de devis en attente. Utilisez « + Saisir un devis » ou soumettez un formulaire sur le site.</td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map((lead) => `
      <tr data-lead-id="${esc(lead.id)}">
        <td style="font-size:0.78rem;color:var(--adm-ink-muted);white-space:nowrap;">${esc(formatDate(lead.created_at))}</td>
        <td><strong style="font-family:var(--adm-font-mono);font-size:0.82rem;">${esc(lead.reference)}</strong></td>
        <td>
          <div style="font-weight:700;">${esc(lead.full_name)}</div>
          <div style="font-size:0.75rem;color:var(--adm-ink-muted);">${esc(lead.company || 'Particulier / Indépendant')}</div>
        </td>
        <td>
          <div style="font-weight:600;">${esc(lead.product_type)}</div>
          <div style="font-size:0.75rem;color:var(--adm-ink-muted);">${esc(lead.dimensions || '')} · Qté: ${esc(lead.quantity || 1)}</div>
        </td>
        <td>
          <span class="adm-status ${getStatusBadgeClass(lead.status)}">${esc(lead.status)}</span>
        </td>
        <td style="text-align:right;">
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-open-lead-view" data-id="${esc(lead.id)}">
            Ouvrir
          </button>
        </td>
      </tr>
    `).join('');
  }

  function getFilteredLeads() {
    return state.leads.filter((lead) => {
      if (state.filterStatus !== 'ALL' && lead.status !== state.filterStatus) {
        return false;
      }
      if (state.filterType !== 'ALL') {
        const prod = (lead.product_type || '').toLowerCase();
        if (!prod.includes(state.filterType.toLowerCase())) return false;
      }
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const hay = [
          lead.reference,
          lead.full_name,
          lead.company,
          lead.phone,
          lead.email,
          lead.location,
          lead.product_type,
          lead.dimensions,
          lead.message
        ].filter(Boolean).join(' ').toLowerCase();

        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderCrmView() {
    const list = getFilteredLeads();
    const countBox = $('#crm-results-count');
    if (countBox) {
      countBox.textContent = `${list.length} demande(s) affichée(s) sur ${state.leads.length} au total`;
    }

    const tableWrap = $('#crm-table-container');
    const kanbanWrap = $('#crm-kanban-container');
    if (state.crmViewMode === 'kanban') {
      if (tableWrap) tableWrap.style.display = 'none';
      if (kanbanWrap) {
        kanbanWrap.style.display = 'grid';
        renderCrmKanban(list);
      }
    } else {
      if (tableWrap) tableWrap.style.display = 'block';
      if (kanbanWrap) kanbanWrap.style.display = 'none';
      renderCrmTable(list);
    }
  }

  function renderCrmTable(list) {
    const tbody = $('#crm-leads-tbody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--adm-ink-muted);">Aucune demande ne correspond aux critères actuels.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((lead) => {
      const waNumber = cleanPhoneForWa(lead.phone);
      const waMsg = encodeURIComponent(`Bonjour ${lead.full_name}, ETS AGBONOUGLA fait suite à votre demande de devis (${lead.reference}) pour : ${lead.product_type}. Comment pouvons-nous affiner votre besoin ?`);
      const waUrl = `https://wa.me/${waNumber}?text=${waMsg}`;

      return `
        <tr data-lead-id="${esc(lead.id)}">
          <td style="font-size:0.78rem;color:var(--adm-ink-muted);white-space:nowrap;">${esc(formatDate(lead.created_at))}</td>
          <td>
            <span style="font-family:var(--adm-font-mono);font-size:0.84rem;font-weight:700;color:var(--adm-ink);">${esc(lead.reference)}</span>
          </td>
          <td>
            <div style="font-weight:700;">${esc(lead.full_name)}</div>
            <div style="font-size:0.75rem;color:var(--adm-ink-muted);">${esc(lead.company || '—')} · ${esc(lead.location || 'CI')}</div>
          </td>
          <td style="white-space:nowrap;">
            <a href="tel:${esc(lead.phone)}" style="color:inherit;text-decoration:none;font-weight:600;">${esc(lead.phone)}</a>
          </td>
          <td>
            <div style="font-weight:600;">${esc(lead.product_type)}</div>
            <div style="font-size:0.74rem;color:var(--adm-ink-muted);">${esc(lead.dimensions || '')}</div>
          </td>
          <td style="font-weight:700;text-align:center;">${esc(lead.quantity || 1)}</td>
          <td style="font-size:0.78rem;color:var(--adm-ink-soft);">
            <div>${esc(lead.timeline || 'Sous 2 sem.')}</div>
            ${lead.estimated_value && lead.estimated_value !== 'Sur étude' ? `<div style="font-weight:700;color:var(--adm-green);font-size:0.73rem;">${esc(lead.estimated_value)}</div>` : ''}
          </td>
          <td>
            <span class="adm-status ${getStatusBadgeClass(lead.status)}">${esc(lead.status)}</span>
          </td>
          <td style="text-align:right;white-space:nowrap;">
            <button type="button" class="ds-btn ds-btn--black ds-btn--sm btn-open-lead-view" data-id="${esc(lead.id)}">
              Détails &amp; Suivi
            </button>
            <a href="${waUrl}" target="_blank" rel="noopener" class="ds-btn ds-btn--stone ds-btn--sm" title="Contacter sur WhatsApp" style="padding:7px 10px;">
              WA
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderCrmKanban(list) {
    const container = $('#crm-kanban-container');
    if (!container) return;

    const cols = [
      { title: 'Nouveaux Devis', statuses: ['Nouveau'] },
      { title: 'Étude & Devis Envoyé', statuses: ['Étude en cours', 'Devis envoyé'] },
      { title: 'En Production (PK 26)', statuses: ['Validé / En production'] },
      { title: 'Livrés & Archivés', statuses: ['Livré', 'Archivé'] }
    ];

    container.innerHTML = cols.map((col) => {
      const items = list.filter((l) => col.statuses.includes(l.status));
      return `
        <div class="adm-kanban__col">
          <div class="adm-kanban__col-head">
            <span>${esc(col.title)}</span>
            <span class="ds-tag ds-tag--micro">${items.length}</span>
          </div>
          <div>
            ${items.length === 0 ? `<div style="font-size:0.76rem;color:var(--adm-ink-muted);text-align:center;padding:24px 8px;">Aucun dossier</div>` : items.map((l) => `
              <div class="adm-kanban__card btn-open-lead-view" data-id="${esc(l.id)}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="font-family:var(--adm-font-mono);font-size:0.74rem;font-weight:700;color:var(--adm-coral);">${esc(l.reference)}</span>
                  <span style="font-size:0.7rem;color:var(--adm-ink-muted);">${esc(formatDate(l.created_at).split(' ')[0])}</span>
                </div>
                <div style="font-weight:700;font-size:0.88rem;margin-bottom:2px;">${esc(l.full_name)}</div>
                <div style="font-size:0.75rem;color:var(--adm-ink-muted);margin-bottom:8px;">${esc(l.company || l.location || 'Côte d’Ivoire')}</div>
                <div style="font-size:0.78rem;font-weight:600;background:var(--adm-stone);padding:6px 8px;border-radius:6px;">
                  ${esc(l.product_type)} · Qté ${esc(l.quantity || 1)}
                </div>
                ${l.estimated_value && l.estimated_value !== 'Sur étude' ? `<div style="margin-top:6px;font-size:0.75rem;font-weight:700;color:var(--adm-green);">${esc(l.estimated_value)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // Bascule Liste / Kanban
  $('#btn-crm-view-table')?.addEventListener('click', () => {
    state.crmViewMode = 'table';
    $('#btn-crm-view-table').classList.add('ds-btn--black');
    $('#btn-crm-view-table').style.background = '';
    $('#btn-crm-view-table').style.color = '';
    $('#btn-crm-view-kanban').classList.remove('ds-btn--black');
    $('#btn-crm-view-kanban').style.background = 'transparent';
    $('#btn-crm-view-kanban').style.color = 'var(--adm-ink-soft)';
    renderCrmView();
  });

  $('#btn-crm-view-kanban')?.addEventListener('click', () => {
    state.crmViewMode = 'kanban';
    $('#btn-crm-view-kanban').classList.add('ds-btn--black');
    $('#btn-crm-view-kanban').style.background = '';
    $('#btn-crm-view-kanban').style.color = '';
    $('#btn-crm-view-table').classList.remove('ds-btn--black');
    $('#btn-crm-view-table').style.background = 'transparent';
    $('#btn-crm-view-table').style.color = 'var(--adm-ink-soft)';
    renderCrmView();
  });

  // Filtres CRM
  $('#crm-search')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    renderCrmView();
  });
  $('#crm-filter-status')?.addEventListener('change', (e) => {
    state.filterStatus = e.target.value;
    renderCrmView();
  });
  $('#crm-filter-type')?.addEventListener('change', (e) => {
    state.filterType = e.target.value;
    renderCrmView();
  });

  // Ouverture modale détail d'un lead
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-open-lead-view');
    if (btn) {
      const id = parseInt(btn.dataset.id, 10);
      openLeadModal(id);
    }
  });

  function openLeadModal(leadId) {
    const lead = state.leads.find((l) => parseInt(l.id, 10) === leadId);
    if (!lead) return;

    state.activeLeadId = leadId;

    $('#modal-lead-title').textContent = `Dossier Devis · ${lead.reference}`;
    $('#modal-lead-date').textContent = `Reçu le ${formatDate(lead.created_at)} · Source: ${lead.source_page || 'Site Web'}`;

    const badgeContainer = $('#modal-lead-status-badge');
    if (badgeContainer) {
      badgeContainer.innerHTML = `<span class="adm-status ${getStatusBadgeClass(lead.status)}">${esc(lead.status)}</span>`;
    }

    $('#lead-view-name').textContent = lead.full_name || '-';
    $('#lead-view-company').textContent = lead.company || 'Particulier / Non spécifié';
    $('#lead-view-phone').innerHTML = lead.phone ? `<a href="tel:${esc(lead.phone)}" style="color:var(--adm-ink);">${esc(lead.phone)}</a>` : '-';
    $('#lead-view-email').innerHTML = lead.email ? `<a href="mailto:${esc(lead.email)}" style="color:var(--adm-ink);">${esc(lead.email)}</a>` : 'Non renseigné';
    $('#lead-view-location').textContent = lead.location || 'Abidjan / Côte d’Ivoire';

    $('#lead-view-product').textContent = lead.product_type || '-';
    $('#lead-view-dims').textContent = lead.dimensions || 'Standard';
    $('#lead-view-qty').textContent = `${lead.quantity || 1} unité(s)`;
    $('#lead-view-timeline').textContent = lead.timeline || 'Non précisé';
    $('#lead-view-message').textContent = lead.message || 'Aucune remarque additionnelle spécifiée.';

    const waNumber = cleanPhoneForWa(lead.phone);
    const waMsg = encodeURIComponent(`Bonjour ${lead.full_name}, ETS AGBONOUGLA fait suite à votre demande de devis (${lead.reference}) concernant votre projet : ${lead.product_type} (${lead.dimensions || ''}). Avez-vous un moment pour échanger sur vos impératifs de livraison ?`);
    const btnWa = $('#lead-btn-whatsapp');
    if (btnWa) btnWa.href = `https://wa.me/${waNumber}?text=${waMsg}`;

    const btnCall = $('#lead-btn-call');
    if (btnCall) btnCall.href = `tel:${lead.phone || ''}`;

    $('#lead-edit-id').value = lead.id;
    $('#lead-edit-status').value = lead.status || 'Nouveau';
    $('#lead-edit-assigned').value = lead.assigned_to || 'Direction Commerciale';
    $('#lead-edit-estimate').value = lead.estimated_value || '';

    renderLeadNotes(lead.notes || []);

    $('#modal-lead-detail')?.classList.add('is-open');
  }

  function renderLeadNotes(notes) {
    const container = $('#lead-notes-container');
    if (!container) return;

    if (!notes || notes.length === 0) {
      container.innerHTML = `<div style="font-size:0.78rem;color:var(--adm-ink-muted);font-style:italic;padding:8px 0;">Aucune note commerciale pour ce dossier.</div>`;
      return;
    }

    container.innerHTML = notes.map((n) => `
      <div class="adm-note-item">
        <div class="adm-note-meta">
          <span>${esc(n.author || 'Direction')}</span>
          <span>${esc(formatDate(n.created_at))}</span>
        </div>
        <div>${esc(n.note_text)}</div>
      </div>
    `).join('');
  }

  // Impression Fiche Atelier PDF
  $('#lead-btn-print')?.addEventListener('click', () => {
    const lead = state.leads.find((l) => parseInt(l.id, 10) === state.activeLeadId);
    if (!lead) return;
    const win = window.open('', '_blank', 'width=840,height=900');
    if (!win) {
      alert('Veuillez autoriser l’ouverture de la fenêtre d’impression.');
      return;
    }
    const companyPhone = state.settings.phone_primary || '+225 07 07 83 17 91';
    const companyEmail = state.settings.email_contact || 'contact@ets-agbonougla.ci';
    const companyAddr = state.settings.address_workshop || 'Attinguié, Autoroute du Nord PK 26 — Abidjan';

    win.document.write(`<!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Fiche Devis ${esc(lead.reference)} — ETS AGBONOUGLA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; padding: 36px; line-height: 1.5; }
          .head { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 18px; margin-bottom: 24px; }
          .brand { font-size: 20px; font-weight: 800; }
          .sub { font-size: 12px; color: #555; }
          .ref-box { text-align: right; }
          .ref { font-size: 18px; font-weight: 800; color: #1D68BD; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .box { border: 1px solid #ccc; border-radius: 8px; padding: 16px; }
          .box h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #555; border-bottom: 1px solid #eee; padding-bottom: 6px; }
          .row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
          .msg { background: #f8f9fa; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; margin-top: 8px; }
          .foot { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 14px; font-size: 11px; color: #666; display: flex; justify-content: space-between; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:20px;text-align:right;">
          <button onclick="window.print()" style="padding:8px 16px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;">Imprimer / Enregistrer en PDF</button>
        </div>
        <div class="head">
          <div>
            <div class="brand">ETS AGBONOUGLA</div>
            <div class="sub">${esc(companyAddr)}</div>
            <div class="sub">Tél : ${esc(companyPhone)} · Email : ${esc(companyEmail)}</div>
          </div>
          <div class="ref-box">
            <div class="ref">${esc(lead.reference)}</div>
            <div class="sub">Date : ${esc(formatDate(lead.created_at))}</div>
            <div class="sub">Statut : <strong>${esc(lead.status)}</strong></div>
          </div>
        </div>
        <div class="grid">
          <div class="box">
            <h3>Coordonnées du Client</h3>
            <div class="row"><span>Nom complet :</span><strong>${esc(lead.full_name)}</strong></div>
            <div class="row"><span>Entreprise :</span><strong>${esc(lead.company || '-')}</strong></div>
            <div class="row"><span>Téléphone :</span><strong>${esc(lead.phone)}</strong></div>
            <div class="row"><span>Email :</span><strong>${esc(lead.email || '-')}</strong></div>
            <div class="row"><span>Localisation site :</span><strong>${esc(lead.location || '-')}</strong></div>
          </div>
          <div class="box">
            <h3>Spécifications Techniques</h3>
            <div class="row"><span>Solution :</span><strong>${esc(lead.product_type)}</strong></div>
            <div class="row"><span>Dimensions :</span><strong>${esc(lead.dimensions || 'Standard')}</strong></div>
            <div class="row"><span>Quantité :</span><strong>${esc(lead.quantity || 1)} module(s)</strong></div>
            <div class="row"><span>Délai souhaité :</span><strong>${esc(lead.timeline || '-')}</strong></div>
            <div class="row"><span>Chiffrage estimatif :</span><strong>${esc(lead.estimated_value || 'Sur étude')}</strong></div>
          </div>
        </div>
        <div class="box">
          <h3>Cahier des charges / Précisions du client</h3>
          <div class="msg">${esc(lead.message || 'Aucune précision complémentaire.')}</div>
        </div>
        <div class="box" style="margin-top:20px;">
          <h3>Visa Atelier Attinguié PK 26 &amp; Observations</h3>
          <div style="height:90px;"></div>
        </div>
        <div class="foot">
          <span>Document généré depuis le Back-Office ETS AGBONOUGLA</span>
          <span>Responsable dossier : ${esc(lead.assigned_to || 'Direction Commerciale')}</span>
        </div>
      </body>
      </html>`);
    win.document.close();
  });

  $('#btn-close-lead-modal')?.addEventListener('click', () => {
    $('#modal-lead-detail').classList.remove('is-open');
    state.activeLeadId = null;
  });

  // Mise à jour du statut du devis
  $('#form-update-lead-status')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt($('#lead-edit-id').value, 10);
    const status = $('#lead-edit-status').value;
    const assigned_to = $('#lead-edit-assigned').value.trim();
    const estimated_value = $('#lead-edit-estimate').value.trim();

    const { ok, data } = await apiFetch('crm', {
      method: 'PUT',
      body: JSON.stringify({ id, status, assigned_to, estimated_value })
    });

    if (ok) {
      showToast(`Dossier #${id} mis à jour : ${status}`);
      const lead = state.leads.find((l) => parseInt(l.id, 10) === id);
      if (lead) {
        lead.status = status;
        lead.assigned_to = assigned_to;
        lead.estimated_value = estimated_value;
        const badgeContainer = $('#modal-lead-status-badge');
        if (badgeContainer) {
          badgeContainer.innerHTML = `<span class="adm-status ${getStatusBadgeClass(status)}">${esc(status)}</span>`;
        }
      }
      updateKpis();
      renderOverviewTable();
      renderCrmView();
    } else {
      alert(data?.error || 'Erreur lors de la mise à jour.');
    }
  });

  // Ajout d'une note commerciale
  $('#form-add-lead-note')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = state.activeLeadId;
    const input = $('#lead-new-note-text');
    const note_text = input.value.trim();
    if (!id || !note_text) return;

    const { ok, data } = await apiFetch('crm', {
      method: 'PUT',
      body: JSON.stringify({ id, note_text })
    });

    if (ok) {
      input.value = '';
      showToast('Note commerciale enregistrée.');
      await loadCrmLeads();
      const updated = state.leads.find((l) => parseInt(l.id, 10) === id);
      if (updated) renderLeadNotes(updated.notes || []);
    } else {
      alert(data?.error || 'Erreur enregistrement note.');
    }
  });

  // Suppression d'un devis
  $('#btn-delete-lead')?.addEventListener('click', async () => {
    const id = state.activeLeadId;
    if (!id) return;
    if (!confirm('Supprimer définitivement cette demande de devis ?')) return;

    const { ok, data } = await apiFetch(`crm&id=${id}`, { method: 'DELETE' });
    if (ok) {
      showToast('Devis supprimé.');
      $('#modal-lead-detail').classList.remove('is-open');
      state.activeLeadId = null;
      await loadCrmLeads();
    } else {
      alert(data?.error || 'Erreur lors de la suppression.');
    }
  });

  // Saisie manuelle d'un devis
  function openNewLeadModal() {
    $('#form-create-lead')?.reset();
    $('#modal-new-lead')?.classList.add('is-open');
  }
  function closeNewLeadModal() {
    $('#modal-new-lead')?.classList.remove('is-open');
  }

  $('#btn-crm-add')?.addEventListener('click', openNewLeadModal);
  $('#btn-quick-new-lead')?.addEventListener('click', openNewLeadModal);
  $('#btn-close-new-lead-modal')?.addEventListener('click', closeNewLeadModal);
  $('#btn-cancel-new-lead')?.addEventListener('click', closeNewLeadModal);

  $('#form-create-lead')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.source_page = 'Atelier PK 26 (Saisie directe)';

    const { ok, data } = await apiFetch('leads', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (ok) {
      showToast(`Devis ${data.reference || ''} enregistré avec succès !`);
      closeNewLeadModal();
      await loadCrmLeads();
      switchTab('crm');
    } else {
      alert(data?.error || 'Erreur lors de l’enregistrement du devis.');
    }
  });

  // Export CSV sécurisé contre CSV Injection
  function exportLeadsCsv() {
    const list = getFilteredLeads();
    if (list.length === 0) {
      alert('Aucun devis à exporter selon les filtres actuels.');
      return;
    }

    const headers = [
      'Référence',
      'Date Enregistrement',
      'Nom Prospect',
      'Entreprise',
      'Téléphone',
      'Email',
      'Localisation',
      'Type Module',
      'Dimensions',
      'Quantité',
      'Délai Souhaité',
      'Statut',
      'Assigné À',
      'Montant Estimé',
      'Message Prospect'
    ];

    const rows = list.map((l) => [
      sanitizeCsvCell(l.reference),
      sanitizeCsvCell(l.created_at),
      sanitizeCsvCell(l.full_name),
      sanitizeCsvCell(l.company),
      sanitizeCsvCell(l.phone),
      sanitizeCsvCell(l.email),
      sanitizeCsvCell(l.location),
      sanitizeCsvCell(l.product_type),
      sanitizeCsvCell(l.dimensions),
      sanitizeCsvCell(l.quantity || 1),
      sanitizeCsvCell(l.timeline),
      sanitizeCsvCell(l.status),
      sanitizeCsvCell(l.assigned_to),
      sanitizeCsvCell(l.estimated_value),
      sanitizeCsvCell(l.message)
    ]);

    let csvContent = '\uFEFF';
    csvContent += headers.map((h) => `"${h}"`).join(';') + '\r\n';
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(';') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `devis-ets-agbonougla-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${list.length} devis exportés au format CSV.`);
  }

  $('#btn-crm-export')?.addEventListener('click', exportLeadsCsv);
  $('#btn-quick-export-csv')?.addEventListener('click', exportLeadsCsv);

  // ══════════════════════════════════════════════════════════════
  // GESTION DU CMS COMPLET (5 SOUS-ONGLETS + UPLOAD D'IMAGES)
  // ══════════════════════════════════════════════════════════════

  function populateImageSelectors() {
    const imgs = state.availableImages;
    ['#prod-image-select', '#proj-image-select'].forEach((selId) => {
      const sel = $(selId);
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = imgs.map((f) => `<option value="${esc(f)}">${esc(f)}</option>`).join('');
      if (currentVal && imgs.includes(currentVal)) {
        sel.value = currentVal;
      }
    });
  }

  async function uploadImageFile(file, onSuccess) {
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    showToast('Téléversement de l’image en cours...');
    const { ok, data } = await apiFetch('upload-image', {
      method: 'POST',
      body: fd
    });
    if (ok && data.filename) {
      if (Array.isArray(data.available_images)) {
        state.availableImages = data.available_images;
      } else if (!state.availableImages.includes(data.filename)) {
        state.availableImages.push(data.filename);
      }
      populateImageSelectors();
      onSuccess(data.filename);
      showToast(`Image « ${data.filename} » téléversée avec succès.`);
    } else {
      alert(data?.error || 'Erreur lors du téléversement de l’image.');
    }
  }

  // Synchronisation sélecteurs d'image Produit & Projet
  $('#prod-image-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    $('#prod-image').value = val;
    $('#prod-image-preview').src = `assets/images/${val}`;
  });
  $('#prod-image-upload')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file, (filename) => {
        $('#prod-image').value = filename;
        $('#prod-image-select').value = filename;
        $('#prod-image-preview').src = `assets/images/${filename}`;
      });
    }
  });

  $('#proj-image-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    $('#proj-image').value = val;
    $('#proj-image-preview').src = `assets/images/${val}`;
  });
  $('#proj-image-upload')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file, (filename) => {
        $('#proj-image').value = filename;
        $('#proj-image-select').value = filename;
        $('#proj-image-preview').src = `assets/images/${filename}`;
      });
    }
  });

  async function loadCmsData() {
    try {
      const { ok, data } = await apiFetch('public-data');
      if (ok && data) {
        state.settings = data.settings || {};
        state.products = data.products || [];
        state.projects = data.projects || [];
        state.faq = data.faq || [];
        state.jobs = data.jobs || [];
        state.seo = data.seo || [];
        if (Array.isArray(data.available_images) && data.available_images.length > 0) {
          state.availableImages = data.available_images;
        }

        populateImageSelectors();
        fillSettingsForm();
        renderProductsTable();
        renderProjectsTable();
        renderFaqTable();
        renderJobsTable();
        renderSeoTable();

        const kpiCms = $('#kpi-cms-items');
        const kpiCmsSub = $('#kpi-cms-sub');
        if (kpiCms) kpiCms.textContent = state.products.length + state.projects.length;
        if (kpiCmsSub) kpiCmsSub.textContent = `${state.products.length} modèle(s) · ${state.projects.length} chantier(s)`;

        // Raccourcis Vue d'ensemble
        const s = state.settings;
        if ($('#quick-phone-val') && s.phone_primary) $('#quick-phone-val').textContent = s.phone_primary;
        if ($('#quick-wa-val') && s.whatsapp_number) $('#quick-wa-val').textContent = `+${s.whatsapp_number}`;
        if ($('#quick-email-val') && s.email_contact) $('#quick-email-val').textContent = s.email_contact;
        if ($('#quick-address-val') && s.address_workshop) $('#quick-address-val').textContent = s.address_workshop;
        if ($('#quick-phone-btn') && s.phone_primary) $('#quick-phone-btn').href = `tel:${s.phone_primary.replace(/\s+/g, '')}`;
        if ($('#quick-wa-btn') && s.whatsapp_number) $('#quick-wa-btn').href = `https://wa.me/${s.whatsapp_number}`;
      }
    } catch (e) {
      console.warn('Erreur chargement CMS :', e);
    }
  }

  function fillSettingsForm() {
    const s = state.settings;
    if ($('#cfg-company-name')) $('#cfg-company-name').value = s.company_name || 'ETS AGBONOUGLA';
    if ($('#cfg-quote-sla')) $('#cfg-quote-sla').value = s.quote_sla || '24 h';
    if ($('#cfg-phone-primary')) $('#cfg-phone-primary').value = s.phone_primary || '+225 07 07 83 17 91';
    if ($('#cfg-phone-secondary')) $('#cfg-phone-secondary').value = s.phone_secondary || '+225 07 07 83 17 91';
    if ($('#cfg-whatsapp')) $('#cfg-whatsapp').value = s.whatsapp_number || '2250707831791';
    if ($('#cfg-email')) $('#cfg-email').value = s.email_contact || 'contact@ets-agbonougla.ci';
    if ($('#cfg-address')) $('#cfg-address').value = s.address_workshop || 'Attinguié, Autoroute du Nord PK 26 — Abidjan';
    if ($('#cfg-surface')) $('#cfg-surface').value = s.workshop_surface || '2 500 m²';
    if ($('#cfg-lamano')) $('#cfg-lamano').value = s.lamano_design_url || 'https://lamanodesign.com';
    if ($('#cfg-hero-title')) $('#cfg-hero-title').value = s.hero_callout_title || 'Déployez vos espaces en quelques jours';
    if ($('#cfg-hero-cta')) $('#cfg-hero-cta').value = s.hero_cta_label || 'DEMANDER UN DEVIS';
    if ($('#cfg-manifesto')) $('#cfg-manifesto').value = s.manifesto_quote || '';
  }

  $('#btn-save-settings')?.addEventListener('click', async () => {
    const form = $('#form-cms-settings');
    if (!form) return;
    const settings = Object.fromEntries(new FormData(form).entries());
    const btn = $('#btn-save-settings');
    btn.disabled = true;
    btn.textContent = 'Enregistrement...';

    const { ok, data } = await apiFetch('cms&entity=settings', {
      method: 'POST',
      body: JSON.stringify({ settings })
    });

    btn.disabled = false;
    btn.textContent = 'Enregistrer et publier';

    if (ok) {
      showToast('Coordonnées et textes publiés sur le site avec succès.');
      await loadCmsData();
    } else {
      alert(data?.error || 'Erreur lors de la sauvegarde.');
    }
  });

  // 2. Solutions Modulaires (Ajout + Modification + Suppression)
  function renderProductsTable() {
    const tbody = $('#cms-products-tbody');
    if (!tbody) return;

    if (state.products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--adm-ink-muted);">Aucune solution au catalogue.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.products.map((p) => {
      let specs = [];
      try { specs = JSON.parse(p.specs_json || '[]'); } catch {}
      return `
        <tr>
          <td style="width:76px;">
            <img src="assets/images/${esc(p.image_path)}" alt="${esc(p.title)}" style="width:64px;height:46px;object-fit:cover;border-radius:6px;border:1px solid var(--adm-border);" onerror="this.src='assets/images/complexe-base-vie-plateforme.jpg'">
          </td>
          <td><strong style="color:var(--adm-ink);">${esc(p.title)}</strong></td>
          <td><span class="ds-tag ds-tag--micro">${esc(p.category || 'Standard')}</span></td>
          <td style="font-size:0.82rem;font-weight:600;">${esc(p.dimensions || '20 pieds')}</td>
          <td style="font-size:0.78rem;color:var(--adm-ink-soft);max-width:340px;line-height:1.4;">
            <div>${esc(p.short_desc || '—')}</div>
            ${specs.length ? `<div style="margin-top:4px;font-size:0.72rem;color:var(--adm-ink-muted);">✓ ${specs.map(esc).join(' · ')}</div>` : ''}
          </td>
          <td style="text-align:right;white-space:nowrap;">
            <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-edit-product" data-id="${esc(p.id)}">
              Modifier
            </button>
            <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-delete-product" data-id="${esc(p.id)}" style="color:var(--adm-red);">
              Supprimer
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  $('#btn-open-add-product')?.addEventListener('click', () => {
    $('#form-product').reset();
    $('#prod-id').value = '';
    $('#modal-product-heading').textContent = 'Ajouter une Solution Modulaire';
    const defImg = state.availableImages[0] || 'complexe-base-vie-plateforme.jpg';
    $('#prod-image').value = defImg;
    $('#prod-image-select').value = defImg;
    $('#prod-image-preview').src = `assets/images/${defImg}`;
    $('#modal-product').classList.add('is-open');
  });

  document.addEventListener('click', (e) => {
    const editProdBtn = e.target.closest('.btn-edit-product');
    if (editProdBtn) {
      const id = parseInt(editProdBtn.dataset.id, 10);
      const p = state.products.find((item) => parseInt(item.id, 10) === id);
      if (!p) return;
      $('#prod-id').value = p.id;
      $('#prod-title').value = p.title || '';
      $('#prod-cat').value = p.category || 'Bureaux & Bases-vie';
      $('#prod-dims').value = p.dimensions || '';
      $('#prod-desc').value = p.short_desc || '';
      let specs = [];
      try { specs = JSON.parse(p.specs_json || '[]'); } catch {}
      $('#prod-specs').value = Array.isArray(specs) ? specs.join('\n') : '';
      const img = p.image_path || 'complexe-base-vie-plateforme.jpg';
      if (!state.availableImages.includes(img)) {
        state.availableImages.push(img);
        populateImageSelectors();
      }
      $('#prod-image').value = img;
      $('#prod-image-select').value = img;
      $('#prod-image-preview').src = `assets/images/${img}`;
      $('#modal-product-heading').textContent = `Modifier : ${p.title}`;
      $('#modal-product').classList.add('is-open');
    }
  });

  $('#btn-close-product-modal')?.addEventListener('click', () => $('#modal-product').classList.remove('is-open'));
  $('#btn-cancel-product')?.addEventListener('click', () => $('#modal-product').classList.remove('is-open'));

  $('#form-product')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    const { ok, data } = await apiFetch('cms&entity=product', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (ok) {
      showToast(payload.id ? 'Solution mise à jour.' : 'Nouvelle solution ajoutée au catalogue.');
      $('#modal-product').classList.remove('is-open');
      await loadCmsData();
    } else {
      alert(data?.error || 'Erreur enregistrement produit.');
    }
  });

  document.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.btn-delete-product');
    if (delBtn) {
      const id = delBtn.dataset.id;
      if (!confirm('Supprimer cette solution du catalogue ?')) return;
      const { ok } = await apiFetch(`cms&entity=product&id=${id}`, { method: 'DELETE' });
      if (ok) {
        showToast('Solution retirée du catalogue.');
        await loadCmsData();
      }
    }
  });

  // 3. Réalisations & Projets (Ajout + Modification + Suppression)
  function renderProjectsTable() {
    const tbody = $('#cms-projects-tbody');
    if (!tbody) return;

    if (state.projects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--adm-ink-muted);">Aucune réalisation enregistrée.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.projects.map((pr) => `
      <tr>
        <td style="width:76px;">
          <img src="assets/images/${esc(pr.image_path)}" alt="${esc(pr.title)}" style="width:64px;height:46px;object-fit:cover;border-radius:6px;border:1px solid var(--adm-border);" onerror="this.src='assets/images/complexe-base-vie-plateforme.jpg'">
        </td>
        <td><strong style="color:var(--adm-ink);">${esc(pr.title)}</strong></td>
        <td><span class="ds-tag ds-tag--micro">${esc(pr.category || 'bases-vie')}</span></td>
        <td style="font-size:0.82rem;font-weight:600;">
          <div>${esc(pr.location || 'Côte d’Ivoire')}</div>
          <div style="font-size:0.72rem;color:var(--adm-ink-muted);">${esc(pr.year_completed || '2026')}</div>
        </td>
        <td style="font-size:0.78rem;color:var(--adm-ink-soft);max-width:340px;line-height:1.4;">
          ${esc(pr.solution_text || pr.need_text || '—')}
        </td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-edit-project" data-id="${esc(pr.id)}">
            Modifier
          </button>
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-delete-project" data-id="${esc(pr.id)}" style="color:var(--adm-red);">
            Supprimer
          </button>
        </td>
      </tr>
    `).join('');
  }

  $('#btn-open-add-project')?.addEventListener('click', () => {
    $('#form-project').reset();
    $('#proj-id').value = '';
    $('#modal-project-heading').textContent = 'Ajouter une Réalisation';
    const defImg = state.availableImages[0] || 'complexe-base-vie-plateforme.jpg';
    $('#proj-image').value = defImg;
    $('#proj-image-select').value = defImg;
    $('#proj-image-preview').src = `assets/images/${defImg}`;
    $('#modal-project').classList.add('is-open');
  });

  document.addEventListener('click', (e) => {
    const editProjBtn = e.target.closest('.btn-edit-project');
    if (editProjBtn) {
      const id = parseInt(editProjBtn.dataset.id, 10);
      const pr = state.projects.find((item) => parseInt(item.id, 10) === id);
      if (!pr) return;
      $('#proj-id').value = pr.id;
      $('#proj-title').value = pr.title || '';
      $('#proj-cat').value = pr.category || 'bases-vie';
      $('#proj-loc').value = pr.location || '';
      $('#proj-year').value = pr.year_completed || '2026';
      $('#proj-need').value = pr.need_text || '';
      $('#proj-sol').value = pr.solution_text || '';
      const img = pr.image_path || 'complexe-base-vie-plateforme.jpg';
      if (!state.availableImages.includes(img)) {
        state.availableImages.push(img);
        populateImageSelectors();
      }
      $('#proj-image').value = img;
      $('#proj-image-select').value = img;
      $('#proj-image-preview').src = `assets/images/${img}`;
      $('#modal-project-heading').textContent = `Modifier : ${pr.title}`;
      $('#modal-project').classList.add('is-open');
    }
  });

  $('#btn-close-project-modal')?.addEventListener('click', () => $('#modal-project').classList.remove('is-open'));
  $('#btn-cancel-project')?.addEventListener('click', () => $('#modal-project').classList.remove('is-open'));

  $('#form-project')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    const { ok, data } = await apiFetch('cms&entity=project', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (ok) {
      showToast(payload.id ? 'Réalisation mise à jour.' : 'Nouvelle réalisation publiée.');
      $('#modal-project').classList.remove('is-open');
      await loadCmsData();
    } else {
      alert(data?.error || 'Erreur enregistrement réalisation.');
    }
  });

  document.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.btn-delete-project');
    if (delBtn) {
      const id = delBtn.dataset.id;
      if (!confirm('Supprimer cette réalisation ?')) return;
      const { ok } = await apiFetch(`cms&entity=project&id=${id}`, { method: 'DELETE' });
      if (ok) {
        showToast('Réalisation supprimée.');
        await loadCmsData();
      }
    }
  });

  // 4. FAQ & Offres d'Emploi (Recrutement)
  function renderFaqTable() {
    const tbody = $('#cms-faq-tbody');
    if (!tbody) return;
    if (state.faq.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;padding:18px;color:var(--adm-ink-muted);">Aucune question FAQ.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.faq.map((f) => `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--adm-ink);margin-bottom:3px;">${esc(f.question)}</div>
          <div style="font-size:0.78rem;color:var(--adm-ink-soft);line-height:1.4;">${esc(f.answer)}</div>
        </td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-edit-faq" data-id="${esc(f.id)}">Modifier</button>
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-delete-faq" data-id="${esc(f.id)}" style="color:var(--adm-red);">✕</button>
        </td>
      </tr>
    `).join('');
  }

  $('#btn-open-add-faq')?.addEventListener('click', () => {
    $('#form-faq').reset();
    $('#faq-id').value = '';
    $('#modal-faq-heading').textContent = 'Ajouter une Question FAQ';
    $('#modal-faq').classList.add('is-open');
  });
  $('#btn-close-faq-modal')?.addEventListener('click', () => $('#modal-faq').classList.remove('is-open'));
  $('#btn-cancel-faq')?.addEventListener('click', () => $('#modal-faq').classList.remove('is-open'));

  document.addEventListener('click', async (e) => {
    const editFaq = e.target.closest('.btn-edit-faq');
    if (editFaq) {
      const f = state.faq.find((x) => parseInt(x.id, 10) === parseInt(editFaq.dataset.id, 10));
      if (!f) return;
      $('#faq-id').value = f.id;
      $('#faq-question').value = f.question || '';
      $('#faq-category').value = f.category || 'Général';
      $('#faq-answer').value = f.answer || '';
      $('#modal-faq-heading').textContent = 'Modifier la Question FAQ';
      $('#modal-faq').classList.add('is-open');
    }
    const delFaq = e.target.closest('.btn-delete-faq');
    if (delFaq) {
      if (!confirm('Supprimer cette question FAQ ?')) return;
      const { ok } = await apiFetch(`cms&entity=faq&id=${delFaq.dataset.id}`, { method: 'DELETE' });
      if (ok) {
        showToast('Question FAQ supprimée.');
        await loadCmsData();
      }
    }
  });

  $('#form-faq')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    const { ok } = await apiFetch('cms&entity=faq', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (ok) {
      showToast('FAQ enregistrée.');
      $('#modal-faq').classList.remove('is-open');
      await loadCmsData();
    }
  });

  function renderJobsTable() {
    const tbody = $('#cms-jobs-tbody');
    if (!tbody) return;
    if (state.jobs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;padding:18px;color:var(--adm-ink-muted);">Aucun poste ouvert.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.jobs.map((j) => `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--adm-ink);">${esc(j.title)}</div>
          <div style="font-size:0.72rem;color:var(--adm-coral);font-weight:700;margin:2px 0;">${esc(j.department)} · ${esc(j.location)}</div>
          <div style="font-size:0.78rem;color:var(--adm-ink-soft);line-height:1.4;">${esc(j.description)}</div>
        </td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-edit-job" data-id="${esc(j.id)}">Modifier</button>
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-delete-job" data-id="${esc(j.id)}" style="color:var(--adm-red);">✕</button>
        </td>
      </tr>
    `).join('');
  }

  $('#btn-open-add-job')?.addEventListener('click', () => {
    $('#form-job').reset();
    $('#job-id').value = '';
    $('#modal-job-heading').textContent = 'Publier un Poste (Atelier PK 26)';
    $('#modal-job').classList.add('is-open');
  });
  $('#btn-close-job-modal')?.addEventListener('click', () => $('#modal-job').classList.remove('is-open'));
  $('#btn-cancel-job')?.addEventListener('click', () => $('#modal-job').classList.remove('is-open'));

  document.addEventListener('click', async (e) => {
    const editJob = e.target.closest('.btn-edit-job');
    if (editJob) {
      const j = state.jobs.find((x) => parseInt(x.id, 10) === parseInt(editJob.dataset.id, 10));
      if (!j) return;
      $('#job-id').value = j.id;
      $('#job-title').value = j.title || '';
      $('#job-dept').value = j.department || '';
      $('#job-loc').value = j.location || '';
      $('#job-desc').value = j.description || '';
      $('#modal-job-heading').textContent = 'Modifier le Poste';
      $('#modal-job').classList.add('is-open');
    }
    const delJob = e.target.closest('.btn-delete-job');
    if (delJob) {
      if (!confirm('Supprimer cette offre d’emploi ?')) return;
      const { ok } = await apiFetch(`cms&entity=job&id=${delJob.dataset.id}`, { method: 'DELETE' });
      if (ok) {
        showToast('Offre d’emploi supprimée.');
        await loadCmsData();
      }
    }
  });

  $('#form-job')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    const { ok } = await apiFetch('cms&entity=job', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (ok) {
      showToast('Poste enregistré et publié sur la page Carrières.');
      $('#modal-job').classList.remove('is-open');
      await loadCmsData();
    }
  });

  // 5. SEO & Métadonnées
  function renderSeoTable() {
    const tbody = $('#cms-seo-tbody');
    if (!tbody) return;
    if (state.seo.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:var(--adm-ink-muted);">Aucune page SEO configurée.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.seo.map((s) => `
      <tr>
        <td><strong style="font-family:var(--adm-font-mono);font-size:0.82rem;">${esc(s.page_path)}</strong></td>
        <td style="font-weight:700;font-size:0.84rem;">${esc(s.page_title)}</td>
        <td style="font-size:0.78rem;color:var(--adm-ink-soft);max-width:380px;">${esc(s.meta_description)}</td>
        <td style="text-align:right;">
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-edit-seo" data-page="${esc(s.page_path)}">Modifier SEO</button>
        </td>
      </tr>
    `).join('');
  }

  document.addEventListener('click', (e) => {
    const btnSeo = e.target.closest('.btn-edit-seo');
    if (btnSeo) {
      const s = state.seo.find((x) => x.page_path === btnSeo.dataset.page);
      if (!s) return;
      $('#seo-page').value = s.page_path;
      $('#seo-title').value = s.page_title || '';
      $('#seo-desc').value = s.meta_description || '';
      $('#modal-seo').classList.add('is-open');
    }
  });
  $('#btn-close-seo-modal')?.addEventListener('click', () => $('#modal-seo').classList.remove('is-open'));
  $('#btn-cancel-seo')?.addEventListener('click', () => $('#modal-seo').classList.remove('is-open'));

  $('#form-seo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    const { ok } = await apiFetch('cms&entity=seo', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (ok) {
      showToast(`Métadonnées SEO mises à jour pour ${payload.page_path}.`);
      $('#modal-seo').classList.remove('is-open');
      await loadCmsData();
    }
  });

  // ══════════════════════════════════════════════════════════════
  // SÉCURITÉ, MOT DE PASSE, SESSIONS ACTIVES & AUDIT
  // ══════════════════════════════════════════════════════════════

  async function loadSecurityLogs() {
    try {
      const { ok, data } = await apiFetch('security');
      if (ok && data) {
        state.sessions = data.sessions || [];
        state.audits = data.audits || [];
        state.analyticsSummary = data.analytics_summary || { pageviews: 0, clicks: 0, unique_visitors: 0 };

        const a = state.analyticsSummary;
        if ($('#sec-analytics-info')) {
          $('#sec-analytics-info').textContent = `${a.pageviews} vues · ${a.clicks} clics (${a.unique_visitors} visiteurs)`;
        }
        if ($('#kpi-views-sub')) {
          $('#kpi-views-sub').textContent = `${a.pageviews} vues · ${a.clicks} clics CTA`;
        }

        renderSessionsList();
        renderAuditTable();
      }
    } catch (e) {
      console.warn('Erreur chargement sécurité :', e);
    }
  }

  function renderSessionsList() {
    const box = $('#sec-sessions-list');
    if (!box) return;
    if (state.sessions.length === 0) {
      box.innerHTML = `<div style="font-size:0.8rem;color:var(--adm-ink-muted);">Aucune session enregistrée.</div>`;
      return;
    }

    box.innerHTML = state.sessions.map((s) => {
      const isRevoked = parseInt(s.revoked, 10) === 1;
      const isCurrent = !!s.is_current;
      return `
        <div class="ds-cell ds-cell--stone" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <div style="font-size:0.76rem;line-height:1.35;">
            <div style="font-weight:700;color:var(--adm-ink);">
              ${isCurrent ? '🟢 Session actuelle' : (isRevoked ? '🔴 Session révoquée' : '🟡 Session ouverte')}
            </div>
            <div style="color:var(--adm-ink-muted);">${esc((s.user_agent || 'Navigateur').slice(0, 42))}</div>
            <div style="color:var(--adm-ink-muted);font-size:0.7rem;">Active : ${esc(formatDate(s.last_active_at))}</div>
          </div>
          ${(!isCurrent && !isRevoked) ? `
            <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-revoke-session" data-sid="${esc(s.id)}" style="color:var(--adm-red);font-size:0.72rem;padding:5px 10px;">
              Révoquer
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  document.addEventListener('click', async (e) => {
    const revBtn = e.target.closest('.btn-revoke-session');
    if (revBtn) {
      const sid = revBtn.dataset.sid;
      if (!confirm('Révoquer cette session administrateur distante ?')) return;
      const { ok } = await apiFetch(`security&session_id=${encodeURIComponent(sid)}`, { method: 'DELETE' });
      if (ok) {
        showToast('Session distante révoquée.');
        await loadSecurityLogs();
      }
    }
  });

  // Les identifiants et la clé 2FA sont strictement verrouillés dans .env (aucune modification via l'interface)

  // Purge analytics
  $('#btn-purge-analytics')?.addEventListener('click', async () => {
    if (!confirm('Réinitialiser le compteur de visites et d’événements Analytics ?')) return;
    const { ok } = await apiFetch('analytics', { method: 'DELETE' });
    if (ok) {
      showToast('Statistiques d’audience réinitialisées.');
      await loadSecurityLogs();
    }
  });

  function renderAuditTable() {
    const tbody = $('#sec-audit-tbody');
    if (!tbody) return;

    const q = state.auditSearchQuery.toLowerCase();
    const list = state.audits.filter((a) => {
      if (!q) return true;
      return [a.actor, a.action_type, a.target_entity, a.details].filter(Boolean).join(' ').toLowerCase().includes(q);
    });

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--adm-ink-muted);">Aucun événement d'audit correspondant.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.slice(0, 60).map((a) => `
      <tr>
        <td style="font-size:0.75rem;color:var(--adm-ink-muted);white-space:nowrap;">${esc(formatDate(a.created_at))}</td>
        <td style="font-weight:700;font-size:0.8rem;">${esc(a.actor)}</td>
        <td><span class="ds-tag ds-tag--micro">${esc(a.action_type)}</span></td>
        <td style="font-size:0.8rem;font-weight:600;">${esc(a.target_entity || '—')}</td>
        <td style="font-size:0.78rem;color:var(--adm-ink-soft);max-width:360px;">${esc(a.details || '')}</td>
      </tr>
    `).join('');
  }

  $('#audit-search')?.addEventListener('input', (e) => {
    state.auditSearchQuery = e.target.value.trim();
    renderAuditTable();
  });

  $('#btn-refresh-security')?.addEventListener('click', async () => {
    await loadSecurityLogs();
    showToast('Journaux de sécurité actualisés.');
  });

  // Démarrage
  checkSession();

})();
