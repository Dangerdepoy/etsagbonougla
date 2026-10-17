/**
 * ETS AGBONOUGLA — Administration & Pilotage Commercial (CRM · CMS · Sécurité)
 * Architecture claire, mature, 100% connectée à l'API PHP (api/index.php) et SQLite.
 */
(() => {
  'use strict';

  // Sélecteurs utilitaires
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Échappement HTML sécurisé
  function esc(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  // Toast notification
  function showToast(msg) {
    const t = $('#adm-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-visible'), 3200);
  }

  // Formatage de date lisible
  function formatDate(dStr) {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
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

  // Nettoyage de numéro de téléphone pour lien WhatsApp
  function cleanPhoneForWa(phone) {
    if (!phone) return '2250707683868';
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.length === 10 && !clean.startsWith('225')) {
      clean = '225' + clean;
    }
    return clean || '2250707683868';
  }

  // État applicatif
  const state = {
    csrfToken: '',
    authenticatedUser: null,
    leads: [],
    products: [],
    projects: [],
    settings: {},
    audits: [],
    activeLeadId: null,
    filterStatus: 'ALL',
    filterType: 'ALL',
    searchQuery: ''
  };

  // Helper requêtes API vers api/index.php
  async function apiFetch(route, options = {}) {
    const opts = Object.assign({
      headers: {}
    }, options);

    opts.headers['Content-Type'] = 'application/json';
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
        if (data.db_file) {
          const badge = $('#adm-env-badge');
          if (badge) badge.textContent = 'BD SQLITE CONNECTÉE';
          const dbInfo = $('#sec-db-info');
          if (dbInfo) dbInfo.textContent = `SQLite (${data.db_file})`;
        }
        if (data.php_version) {
          const phpInfo = $('#sec-php-info');
          if (phpInfo) phpInfo.textContent = `PHP ${data.php_version}`;
        }

        if (data.authenticated && data.user) {
          setAuthenticated(data.user);
        } else {
          // Si non connecté, affiche la porte d'authentification
          showAuthGate(true);
        }
      }
    } catch (e) {
      console.warn('Erreur vérification statut :', e);
      showAuthGate(true);
    }
  }

  function showAuthGate(show) {
    const gate = $('#adm-auth-gate');
    if (!gate) return;
    if (show) {
      gate.classList.remove('is-hidden');
      $('#login-password').value = '';
    } else {
      gate.classList.add('is-hidden');
    }
  }

  function setAuthenticated(user) {
    state.authenticatedUser = user;
    showAuthGate(false);
    loadAllData();
  }

  // Formulaire de connexion
  const loginForm = $('#adm-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = $('#login-error');
      const submitBtn = $('#btn-login-submit');
      if (errBox) errBox.style.display = 'none';

      const email = $('#login-email').value.trim();
      const password = $('#login-password').value;

      if (!email || !password) {
        if (errBox) {
          errBox.textContent = 'Veuillez saisir votre email et votre mot de passe.';
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
          body: JSON.stringify({ email, password })
        });

        if (ok && data?.user) {
          state.csrfToken = data.csrf_token || state.csrfToken;
          setAuthenticated(data.user);
          showToast(`Bienvenue, ${data.user.display_name || data.user.email}`);
        } else {
          if (errBox) {
            errBox.textContent = data?.error || 'Identifiant ou mot de passe incorrect.';
            errBox.style.display = 'block';
          }
        }
      } catch (err) {
        if (errBox) {
          errBox.textContent = 'Erreur de connexion au serveur PHP.';
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
  const logoutBtn = $('#btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiFetch('logout', { method: 'POST' });
      } catch {}
      state.authenticatedUser = null;
      showAuthGate(true);
      showToast('Déconnexion réussie.');
    });
  }

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
      renderCrmTable();
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

  // Sous-onglets CMS (Coordonnées, Solutions, Réalisations)
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
  // CRM DEVIS (LEADS & SUIVI COMMERCIAL)
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
    renderCrmTable();
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

    const kpiTotal = $('#kpi-total-leads');
    const kpiNew = $('#kpi-new-leads');
    const kpiNewTrend = $('#kpi-new-leads-trend');
    const kpiActive = $('#kpi-active-leads');
    const navCount = $('#nav-crm-count');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiNew) kpiNew.textContent = newCount;
    if (kpiNewTrend) kpiNewTrend.textContent = `${newCount} nouveau(x)`;
    if (kpiActive) kpiActive.textContent = activeCount;
    if (navCount) navCount.textContent = newCount;
  }

  // Tableau Vue d'ensemble (5 dernières demandes)
  function renderOverviewTable() {
    const tbody = $('#overview-leads-tbody');
    if (!tbody) return;

    const recent = state.leads.slice(0, 5);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--adm-ink-muted);">Aucune demande de devis enregistrée pour l'instant.</td></tr>`;
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
            Consulter
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Filtrage et tableau CRM principal
  function getFilteredLeads() {
    return state.leads.filter((lead) => {
      // Filtre Statut
      if (state.filterStatus !== 'ALL' && lead.status !== state.filterStatus) {
        return false;
      }
      // Filtre Type
      if (state.filterType !== 'ALL') {
        const prod = (lead.product_type || '').toLowerCase();
        if (!prod.includes(state.filterType.toLowerCase())) return false;
      }
      // Recherche textuelle
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
          lead.message
        ].filter(Boolean).join(' ').toLowerCase();

        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderCrmTable() {
    const tbody = $('#crm-leads-tbody');
    const countBox = $('#crm-results-count');
    if (!tbody) return;

    const list = getFilteredLeads();

    if (countBox) {
      countBox.textContent = `${list.length} demande(s) affichée(s) sur ${state.leads.length} au total`;
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--adm-ink-muted);">Aucune demande ne correspond aux critères de recherche.</td></tr>`;
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
            <div style="font-size:0.75rem;color:var(--adm-ink-muted);">${esc(lead.company || '—')}</div>
          </td>
          <td style="white-space:nowrap;">
            <a href="tel:${esc(lead.phone)}" style="color:inherit;text-decoration:none;font-weight:600;">${esc(lead.phone)}</a>
          </td>
          <td>
            <div style="font-weight:600;">${esc(lead.product_type)}</div>
            <div style="font-size:0.74rem;color:var(--adm-ink-muted);">${esc(lead.dimensions || '')}</div>
          </td>
          <td style="font-weight:700;text-align:center;">${esc(lead.quantity || 1)}</td>
          <td style="font-size:0.78rem;color:var(--adm-ink-soft);">${esc(lead.timeline || 'Sous 2 sem.')}</td>
          <td>
            <span class="adm-status ${getStatusBadgeClass(lead.status)}">${esc(lead.status)}</span>
          </td>
          <td style="text-align:right;white-space:nowrap;">
            <button type="button" class="ds-btn ds-btn--black ds-btn--sm btn-open-lead-view" data-id="${esc(lead.id)}">
              Détails & Suivi
            </button>
            <a href="${waUrl}" target="_blank" rel="noopener" class="ds-btn ds-btn--stone ds-btn--sm" title="WhatsApp direct" style="padding:7px 10px;">
              WA
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Écouteurs de filtres CRM
  const crmSearch = $('#crm-search');
  if (crmSearch) {
    crmSearch.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderCrmTable();
    });
  }

  const crmFilterStatus = $('#crm-filter-status');
  if (crmFilterStatus) {
    crmFilterStatus.addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      renderCrmTable();
    });
  }

  const crmFilterType = $('#crm-filter-type');
  if (crmFilterType) {
    crmFilterType.addEventListener('change', (e) => {
      state.filterType = e.target.value;
      renderCrmTable();
    });
  }

  // Clic pour ouvrir la modale détaillée d'un lead
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

    // Infos prospect
    $('#lead-view-name').textContent = lead.full_name || '-';
    $('#lead-view-company').textContent = lead.company || 'Particulier / Non spécifié';
    $('#lead-view-phone').innerHTML = lead.phone ? `<a href="tel:${esc(lead.phone)}" style="color:var(--adm-ink);">${esc(lead.phone)}</a>` : '-';
    $('#lead-view-email').innerHTML = lead.email ? `<a href="mailto:${esc(lead.email)}" style="color:var(--adm-ink);">${esc(lead.email)}</a>` : 'Non renseigné';
    $('#lead-view-location').textContent = lead.location || 'Abidjan / Côte d’Ivoire';

    // Spécifications
    $('#lead-view-product').textContent = lead.product_type || '-';
    $('#lead-view-dims').textContent = lead.dimensions || 'Standard';
    $('#lead-view-qty').textContent = `${lead.quantity || 1} unité(s)`;
    $('#lead-view-timeline').textContent = lead.timeline || 'Non précisé';
    $('#lead-view-message').textContent = lead.message || 'Aucune remarque additionnelle spécifiée.';

    // Liens 1-clic WhatsApp et appel
    const waNumber = cleanPhoneForWa(lead.phone);
    const waMsg = encodeURIComponent(`Bonjour ${lead.full_name}, ETS AGBONOUGLA fait suite à votre demande de devis (${lead.reference}) concernant votre projet : ${lead.product_type} (${lead.dimensions || ''}). Avez-vous un moment pour échanger sur vos impératifs de livraison ?`);
    const btnWa = $('#lead-btn-whatsapp');
    if (btnWa) {
      btnWa.href = `https://wa.me/${waNumber}?text=${waMsg}`;
    }

    const btnCall = $('#lead-btn-call');
    if (btnCall) {
      btnCall.href = `tel:${lead.phone || ''}`;
    }

    // Formulaire d'édition de statut
    $('#lead-edit-id').value = lead.id;
    $('#lead-edit-status').value = lead.status || 'Nouveau';
    $('#lead-edit-assigned').value = lead.assigned_to || 'Direction Commerciale';
    $('#lead-edit-estimate').value = lead.estimated_value || '';

    // Liste des notes
    renderLeadNotes(lead.notes || []);

    const modal = $('#modal-lead-detail');
    if (modal) modal.classList.add('is-open');
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

  // Fermeture modale lead
  const closeLeadModalBtn = $('#btn-close-lead-modal');
  if (closeLeadModalBtn) {
    closeLeadModalBtn.addEventListener('click', () => {
      $('#modal-lead-detail').classList.remove('is-open');
      state.activeLeadId = null;
    });
  }

  // Mise à jour du statut du devis
  const formUpdateLeadStatus = $('#form-update-lead-status');
  if (formUpdateLeadStatus) {
    formUpdateLeadStatus.addEventListener('submit', async (e) => {
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
        // Met à jour localement
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
        renderCrmTable();
      } else {
        alert(data?.error || 'Erreur lors de la mise à jour.');
      }
    });
  }

  // Ajout d'une note commerciale
  const formAddLeadNote = $('#form-add-lead-note');
  if (formAddLeadNote) {
    formAddLeadNote.addEventListener('submit', async (e) => {
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
        // Recharge les leads pour avoir la note persistée
        await loadCrmLeads();
        const updated = state.leads.find((l) => parseInt(l.id, 10) === id);
        if (updated) renderLeadNotes(updated.notes || []);
      } else {
        alert(data?.error || 'Erreur enregistrement note.');
      }
    });
  }

  // Suppression d'un devis
  const deleteLeadBtn = $('#btn-delete-lead');
  if (deleteLeadBtn) {
    deleteLeadBtn.addEventListener('click', async () => {
      const id = state.activeLeadId;
      if (!id) return;

      const conf = confirm('Êtes-vous sûr de vouloir supprimer définitivement cette demande de devis ?');
      if (!conf) return;

      const { ok, data } = await apiFetch(`crm&id=${id}`, { method: 'DELETE' });
      if (ok) {
        showToast('Devis supprimé de la base SQLite.');
        $('#modal-lead-detail').classList.remove('is-open');
        state.activeLeadId = null;
        await loadCrmLeads();
      } else {
        alert(data?.error || 'Erreur lors de la suppression.');
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  // SAISIE MANUELLE D'UN DEVIS (TÉLÉPHONE / ATELIER PK 26)
  // ══════════════════════════════════════════════════════════════

  function openNewLeadModal() {
    const modal = $('#modal-new-lead');
    if (modal) {
      $('#form-create-lead').reset();
      modal.classList.add('is-open');
    }
  }

  function closeNewLeadModal() {
    const modal = $('#modal-new-lead');
    if (modal) modal.classList.remove('is-open');
  }

  $('#btn-crm-add')?.addEventListener('click', openNewLeadModal);
  $('#btn-quick-new-lead')?.addEventListener('click', openNewLeadModal);
  $('#btn-close-new-lead-modal')?.addEventListener('click', closeNewLeadModal);
  $('#btn-cancel-new-lead')?.addEventListener('click', closeNewLeadModal);

  const formCreateLead = $('#form-create-lead');
  if (formCreateLead) {
    formCreateLead.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(formCreateLead);
      const payload = Object.fromEntries(formData.entries());
      payload.source_page = 'admin-saisie-directe';

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
  }

  // ══════════════════════════════════════════════════════════════
  // EXPORT CSV RÉEL DES DEVIS
  // ══════════════════════════════════════════════════════════════

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
      l.reference || '',
      l.created_at || '',
      (l.full_name || '').replace(/"/g, '""'),
      (l.company || '').replace(/"/g, '""'),
      l.phone || '',
      l.email || '',
      (l.location || '').replace(/"/g, '""'),
      (l.product_type || '').replace(/"/g, '""'),
      (l.dimensions || '').replace(/"/g, '""'),
      l.quantity || 1,
      (l.timeline || '').replace(/"/g, '""'),
      l.status || '',
      (l.assigned_to || '').replace(/"/g, '""'),
      (l.estimated_value || '').replace(/"/g, '""'),
      (l.message || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')
    ]);

    let csvContent = '\uFEFF'; // BOM UTF-8 pour Excel
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
  // GESTION DU CMS (COORDONNÉES, SOLUTIONS, RÉALISATIONS)
  // ══════════════════════════════════════════════════════════════

  async function loadCmsData() {
    try {
      const { ok, data } = await apiFetch('public-data');
      if (ok && data) {
        state.settings = data.settings || {};
        state.products = data.products || [];
        state.projects = data.projects || [];

        // Remplissage formulaire paramètres
        fillSettingsForm();
        renderProductsTable();
        renderProjectsTable();

        // Met à jour le compteur CMS
        const kpiCms = $('#kpi-cms-items');
        const kpiCmsSub = $('#kpi-cms-sub');
        if (kpiCms) kpiCms.textContent = state.products.length + state.projects.length;
        if (kpiCmsSub) kpiCmsSub.textContent = `${state.products.length} modèle(s) · ${state.projects.length} chantier(s)`;

        // Raccourcis Vue d'ensemble
        const qPhone = $('#quick-phone-val');
        const qWa = $('#quick-wa-val');
        const qAddr = $('#quick-address-val');
        if (qPhone && state.settings.phone_primary) qPhone.textContent = state.settings.phone_primary;
        if (qWa && state.settings.whatsapp_number) qWa.textContent = `+${state.settings.whatsapp_number}`;
        if (qAddr && state.settings.address_workshop) qAddr.textContent = state.settings.address_workshop;

        const qPhoneBtn = $('#quick-phone-btn');
        if (qPhoneBtn && state.settings.phone_primary) qPhoneBtn.href = `tel:${state.settings.phone_primary.replace(/\s+/g, '')}`;
        const qWaBtn = $('#quick-wa-btn');
        if (qWaBtn && state.settings.whatsapp_number) qWaBtn.href = `https://wa.me/${state.settings.whatsapp_number}`;
      }
    } catch (e) {
      console.warn('Erreur chargement CMS :', e);
    }
  }

  function fillSettingsForm() {
    const s = state.settings;
    if ($('#cfg-company-name')) $('#cfg-company-name').value = s.company_name || 'ETS AGBONOUGLA';
    if ($('#cfg-quote-sla')) $('#cfg-quote-sla').value = s.quote_sla || '24 h';
    if ($('#cfg-phone-primary')) $('#cfg-phone-primary').value = s.phone_primary || '+225 07 07 68 38 68';
    if ($('#cfg-phone-secondary')) $('#cfg-phone-secondary').value = s.phone_secondary || '+225 05 05 90 12 34';
    if ($('#cfg-whatsapp')) $('#cfg-whatsapp').value = s.whatsapp_number || '2250707683868';
    if ($('#cfg-email')) $('#cfg-email').value = s.email_contact || 'info@etsagbonougla.net';
    if ($('#cfg-address')) $('#cfg-address').value = s.address_workshop || 'Attinguié, Autoroute du Nord PK 26 — Abidjan';
    if ($('#cfg-surface')) $('#cfg-surface').value = s.workshop_surface || '2 500 m²';
    if ($('#cfg-lamano')) $('#cfg-lamano').value = s.lamano_design_url || 'https://lamanodesign.com';
    if ($('#cfg-manifesto')) $('#cfg-manifesto').value = s.manifesto_quote || '';
  }

  // Enregistrement des paramètres CMS
  const saveSettingsBtn = $('#btn-save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const form = $('#form-cms-settings');
      if (!form) return;
      const formData = new FormData(form);
      const settings = Object.fromEntries(formData.entries());

      saveSettingsBtn.disabled = true;
      saveSettingsBtn.textContent = 'Enregistrement...';

      const { ok, data } = await apiFetch('cms&entity=settings', {
        method: 'POST',
        body: JSON.stringify({ settings })
      });

      saveSettingsBtn.disabled = false;
      saveSettingsBtn.textContent = 'Enregistrer les modifications';

      if (ok) {
        showToast('Coordonnées enregistrées en base SQLite avec succès.');
        await loadCmsData();
      } else {
        alert(data?.error || 'Erreur lors de la sauvegarde.');
      }
    });
  }

  // Table des Solutions Modulaires
  function renderProductsTable() {
    const tbody = $('#cms-products-tbody');
    if (!tbody) return;

    if (state.products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--adm-ink-muted);">Aucun produit au catalogue.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.products.map((p) => `
      <tr>
        <td style="width:70px;">
          <img src="assets/images/${esc(p.image_path)}" alt="${esc(p.title)}" style="width:58px;height:42px;object-fit:cover;border-radius:6px;border:1px solid var(--adm-border);" onerror="this.src='assets/images/12.jpg'">
        </td>
        <td>
          <strong style="color:var(--adm-ink);">${esc(p.title)}</strong>
        </td>
        <td><span class="ds-tag ds-tag--micro">${esc(p.category || 'Standard')}</span></td>
        <td style="font-size:0.82rem;font-weight:600;">${esc(p.dimensions || '20 pieds')}</td>
        <td style="font-size:0.78rem;color:var(--adm-ink-soft);max-width:320px;line-height:1.4;">${esc(p.short_desc || '—')}</td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-delete-product" data-id="${esc(p.id)}" style="color:var(--adm-red);">
            Supprimer
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Table des Réalisations
  function renderProjectsTable() {
    const tbody = $('#cms-projects-tbody');
    if (!tbody) return;

    if (state.projects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--adm-ink-muted);">Aucune réalisation enregistrée.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.projects.map((pr) => `
      <tr>
        <td style="width:70px;">
          <img src="assets/images/${esc(pr.image_path)}" alt="${esc(pr.title)}" style="width:58px;height:42px;object-fit:cover;border-radius:6px;border:1px solid var(--adm-border);" onerror="this.src='assets/images/19.jpg'">
        </td>
        <td>
          <strong style="color:var(--adm-ink);">${esc(pr.title)}</strong>
        </td>
        <td style="font-size:0.82rem;font-weight:600;">${esc(pr.location || 'Côte d’Ivoire')}</td>
        <td><span class="ds-tag ds-tag--micro">${esc(pr.year_completed || '2026')}</span></td>
        <td style="font-size:0.78rem;color:var(--adm-ink-soft);max-width:340px;line-height:1.4;">
          <strong>Solution :</strong> ${esc(pr.solution_text || pr.need_text || '—')}
        </td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="ds-btn ds-btn--stone ds-btn--sm btn-delete-project" data-id="${esc(pr.id)}" style="color:var(--adm-red);">
            Supprimer
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Modal Ajout Produit
  $('#btn-open-add-product')?.addEventListener('click', () => {
    $('#form-product').reset();
    $('#modal-product').classList.add('is-open');
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
      showToast('Solution ajoutée au catalogue.');
      $('#modal-product').classList.remove('is-open');
      await loadCmsData();
    } else {
      alert(data?.error || 'Erreur enregistrement produit.');
    }
  });

  // Suppression produit
  document.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.btn-delete-product');
    if (delBtn) {
      const id = delBtn.dataset.id;
      if (!confirm('Supprimer cette solution du catalogue ?')) return;
      const { ok } = await apiFetch(`cms&entity=product&id=${id}`, { method: 'DELETE' });
      if (ok) {
        showToast('Solution retirée.');
        await loadCmsData();
      }
    }
  });

  // Modal Ajout Projet
  $('#btn-open-add-project')?.addEventListener('click', () => {
    $('#form-project').reset();
    $('#modal-project').classList.add('is-open');
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
      showToast('Réalisation ajoutée.');
      $('#modal-project').classList.remove('is-open');
      await loadCmsData();
    } else {
      alert(data?.error || 'Erreur enregistrement projet.');
    }
  });

  // Suppression projet
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

  // ══════════════════════════════════════════════════════════════
  // SÉCURITÉ & JOURNAL D'AUDIT
  // ══════════════════════════════════════════════════════════════

  async function loadSecurityLogs() {
    try {
      const { ok, data } = await apiFetch('security');
      if (ok && data) {
        state.audits = data.audits || [];
        renderAuditTable();
      }
    } catch (e) {
      console.warn('Erreur chargement sécurité :', e);
    }
  }

  function renderAuditTable() {
    const tbody = $('#sec-audit-tbody');
    if (!tbody) return;

    if (state.audits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--adm-ink-muted);">Aucun événement d'audit enregistré.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.audits.slice(0, 50).map((a) => `
      <tr>
        <td style="font-size:0.75rem;color:var(--adm-ink-muted);white-space:nowrap;">${esc(formatDate(a.created_at))}</td>
        <td style="font-weight:700;font-size:0.8rem;">${esc(a.actor)}</td>
        <td><span class="ds-tag ds-tag--micro">${esc(a.action_type)}</span></td>
        <td style="font-size:0.8rem;font-weight:600;">${esc(a.target_entity || '—')}</td>
        <td style="font-size:0.78rem;color:var(--adm-ink-soft);max-width:320px;">${esc(a.details || '')}</td>
      </tr>
    `).join('');
  }

  $('#btn-refresh-security')?.addEventListener('click', async () => {
    await loadSecurityLogs();
    showToast('Journaux d’audit actualisés.');
  });

  // Démarrage
  checkSession();

})();
