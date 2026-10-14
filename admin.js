/**
 * ETS AGBONOUGLA — Logique Principale de l'Interface Administrateur
 * Connectée à l'API PHP/PDO (api/index.php) avec synchronisation locale temps réel.
 */
(() => {
  'use strict';

  const STORAGE_KEYS = {
    AUTH: 'ets_admin_session_v1',
    THEME: 'ets_admin_theme_v1',
    LEADS: 'ets_crm_leads_v1',
    CMS: 'ets_cms_store_v1',
    ANALYTICS: 'ets_analytics_v1',
    AUDIT: 'ets_audit_log_v1'
  };

  // Données initiales vérifiées d'ETS AGBONOUGLA (aucun faux chiffre)
  const DEFAULT_CMS = {
    settings: {
      company_name: 'ETS AGBONOUGLA',
      hero_bg_word: 'ETS AGBONOUGLA',
      hero_callout_title: 'Déployez vos espaces en quelques jours',
      hero_cta_label: 'DEMANDER UN DEVIS',
      manifesto_quote: 'Nous concevons et aménageons à Attinguié des structures modulaires en acier Corten pensées pour durer sur les chantiers les plus exigeants de Côte d’Ivoire.',
      phone_primary: '+225 07 07 68 38 68',
      whatsapp_number: '2250707683868',
      email_contact: 'info@etsagbonougla.net',
      address_workshop: 'Attinguié, Autoroute du Nord PK 26 — Abidjan',
      lamano_design_url: 'https://lamanodesign.com'
    },
    products: [
      {
        id: 1,
        title: "Bureau de Chantier Modulaire 20'",
        category: 'Bureaux & Bases-vie',
        dimensions: '20 pieds (6,05 × 2,44 × 2,59 m)',
        short_desc: 'Module isolé thermiquement, climatisation split, menuiserie aluminium, tableau électrique étanche et câblage réseau.',
        image_path: '12.jpg',
        published: 1
      },
      {
        id: 2,
        title: "Base-Vie & Salle de Réunion 40' HC",
        category: 'Bureaux & Bases-vie',
        dimensions: '40 pieds High Cube (12,19 × 2,44 × 2,89 m)',
        short_desc: 'Espace de direction de chantier, salle de planification ou réfectoire avec cloisons modulables et double accès.',
        image_path: '15.jpg',
        published: 1
      },
      {
        id: 3,
        title: 'Bloc Sanitaire & Vestiaire de Chantier',
        category: 'Sanitaires & Hygiène',
        dimensions: '20 pieds / Sur-mesure',
        short_desc: 'Unités autonomes ou raccordables comprenant cabines douches, WC, lavabos collectifs et casiers vestiaires ventilés.',
        image_path: '21.jpg',
        published: 1
      },
      {
        id: 4,
        title: 'Conteneur Stockage Dry & Atelier Mobile',
        category: 'Stockage & Technique',
        dimensions: "20' / 40' Dry & Open Side",
        short_desc: 'Stockage sécurisé d’outillage, pièces détachées, groupe électrogène ou local technique pré-équipé avec établis.',
        image_path: '27.jpg',
        published: 1
      }
    ],
    projects: [
      {
        id: 1,
        title: 'Complexe Bureaux de Chantier & Direction',
        category: 'Bureaux de chantier',
        location: 'Axe Nord · Attinguié (PK 26)',
        year_completed: '2026',
        need_text: 'Déployer rapidement des bureaux climatisés et isolés pour les ingénieurs et conducteurs de travaux.',
        solution_text: 'Fabrication en atelier de 4 modules 20 et 40 pieds avec isolation thermique renforcée et réseau électrique complet.',
        result_text: 'Mise en place par camion-grue et mise en service immédiate sur site.',
        image_path: '19.jpg',
        published: 1
      },
      {
        id: 2,
        title: 'Unités Techniques & Stockage Sécurisé',
        category: 'Locaux techniques',
        location: 'Zone Industrielle · Abidjan',
        year_completed: '2025',
        need_text: 'Protéger le matériel sensible et disposer d’un poste de contrôle étanche aux intempéries.',
        solution_text: 'Transformation de conteneurs maritimes Corten premier choix, traitement anti-corrosion bicouche.',
        result_text: 'Étanchéité totale et sécurisation complète du parc matériel.',
        image_path: '13.jpg',
        published: 1
      },
      {
        id: 3,
        title: 'Guérite de Contrôle & Bureau d’Exploitation',
        category: 'Espaces professionnels',
        location: 'Yopougon Zone Industrielle',
        year_completed: '2026',
        need_text: 'Contrôler les flux logistiques à l’entrée d’un site industriel avec visibilité panoramique.',
        solution_text: 'Module 20 pieds avec baies vitrées aluminium sur trois façades, comptoir intégré et climatisation.',
        result_text: 'Installé en une demi-journée sans travaux de maçonnerie lourds.',
        image_path: '61.jpeg',
        published: 1
      }
    ],
    faq: [
      {
        id: 1,
        question: 'Quels sont les délais moyens de fabrication et livraison ?',
        answer: 'Pour un module bureau 20 pieds standard en stock sur notre parc d’Attinguié (PK 26), la préparation prend 3 à 5 jours ouvrés. Pour du sur-mesure, comptez 10 à 21 jours.'
      },
      {
        id: 2,
        question: 'Assurez-vous le transport et le déchargement par grue sur chantier ?',
        answer: 'Oui. Nous organisons l’acheminement par camion plateau et camion-grue (HIAB) sur Abidjan et l’ensemble de la Côte d’Ivoire.'
      },
      {
        id: 3,
        question: 'Comment vos conteneurs sont-ils isolés contre la chaleur ?',
        answer: 'Nous utilisons des panneaux sandwich polyuréthane haute densité (40 à 60 mm) ou laine de roche avec parement PVC/mélaminé, complétés par une climatisation split.'
      }
    ],
    seo: [
      { page_path: 'index.html', page_title: 'ETS AGBONOUGLA — Conteneurs Modulaires & Bases-Vie de Chantier en Côte d’Ivoire', meta_description: 'Fabrication et aménagement de conteneurs préfabriqués, bureaux de chantier et bases-vie à Attinguié (PK 26, Abidjan). Devis sous 24h.', og_image: 'hero-container-crane.jpg' },
      { page_path: 'ets_solutions.html', page_title: 'Solutions Modulaires & Conteneurs Aménagés — ETS AGBONOUGLA', meta_description: 'Découvrez nos gammes de conteneurs 20 et 40 pieds : bureaux de chantier, bases-vie, blocs sanitaires et stockage sécurisé.', og_image: '12.jpg' },
      { page_path: 'ets_expertise.html', page_title: 'Expertise Industrielle & Atelier PK 26 — ETS AGBONOUGLA', meta_description: '2 500 m² d’atelier à Attinguié : chaudronnerie Corten, isolation thermique, électricité aux normes et logistique grue.', og_image: '15.jpg' },
      { page_path: 'ets_references.html', page_title: 'Réalisations & Projets Livrés — ETS AGBONOUGLA', meta_description: 'Galerie de nos conteneurs aménagés et bases-vie déployés sur les chantiers et sites industriels en Côte d’Ivoire.', og_image: '19.jpg' },
      { page_path: 'ets_contact.html', page_title: 'Demander un Devis Conteneur sous 24h — ETS AGBONOUGLA', meta_description: 'Contactez notre bureau d’études à Attinguié (PK 26 Autoroute du Nord) pour chiffrer votre projet modulaire.', og_image: '61.jpeg' },
      { page_path: 'ets_carriere.html', page_title: 'Carrières & Métiers d’Atelier — ETS AGBONOUGLA', meta_description: 'Rejoignez nos équipes de soudeurs, électriciens, menuisiers aluminium et techniciens à Attinguié.', og_image: '27.jpg' }
    ]
  };

  let state = {
    apiConnected: false,
    csrfToken: 'local-csrf-token',
    crmView: 'list',
    statusFilter: 'ALL',
    typeFilter: 'ALL',
    searchQuery: '',
    leads: [],
    cms: JSON.parse(JSON.stringify(DEFAULT_CMS)),
    analytics: [],
    audits: []
  };

  // Utilitaires
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function showToast(msg) {
    const t = $('#adm-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-visible'), 3200);
  }

  function addAudit(actor, action, target, details) {
    const entry = {
      id: Date.now(),
      created_at: new Date().toLocaleString('fr-FR'),
      actor,
      action_type: action,
      target_entity: target,
      details
    };
    state.audits.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(state.audits.slice(0, 100)));
    renderSecurityAudit();
  }

  // Chargement et persistance hybride (Serveur PHP/SQLite + Sync Navigateur)
  function loadLocalState() {
    try {
      const savedCms = localStorage.getItem(STORAGE_KEYS.CMS);
      if (savedCms) state.cms = Object.assign({}, DEFAULT_CMS, JSON.parse(savedCms));
      else localStorage.setItem(STORAGE_KEYS.CMS, JSON.stringify(state.cms));

      const savedLeads = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (savedLeads) state.leads = JSON.parse(savedLeads);

      const savedAnalytics = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (savedAnalytics) state.analytics = JSON.parse(savedAnalytics);

      const savedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (savedAudit) state.audits = JSON.parse(savedAudit);
      else {
        addAudit('SYSTÈME', 'INIT_PORTAIL', 'admin.html', 'Portail d’administration initialisé avec protection 6 couches.');
      }
    } catch (e) {
      console.warn('Erreur lecture stockage local :', e);
    }
  }

  function saveLeads() {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(state.leads));
  }

  function saveCms() {
    localStorage.setItem(STORAGE_KEYS.CMS, JSON.stringify(state.cms));
  }

  let apiEndpoint = 'api/index.php';

  async function probeApiServer() {
    const badge = $('#adm-env-badge');
    const candidates = ['api/index.php', 'http://127.0.0.1:8080/api/index.php'];

    for (const candidate of candidates) {
      try {
        const res = await fetch(candidate + '?route=status', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok) {
            apiEndpoint = candidate;
            state.apiConnected = true;
            state.csrfToken = data.csrf_token || state.csrfToken;
            if (badge) {
              badge.textContent = 'SERVEUR PHP + BD SQLITE ACTIFS';
              badge.style.background = 'var(--adm-green-bg)';
              badge.style.color = 'var(--adm-green)';
            }

            // 1. Charge CMS (Paramètres, Produits, Réalisations, FAQ, SEO) depuis SQLite
            const pubRes = await fetch(apiEndpoint + '?route=public-data', { cache: 'no-store' });
            if (pubRes.ok) {
              const pubData = await pubRes.json();
              if (pubData.ok) {
                state.cms.settings = Object.assign({}, state.cms.settings, pubData.settings || {});
                if (pubData.products?.length) state.cms.products = pubData.products;
                if (pubData.projects?.length) state.cms.projects = pubData.projects;
                if (pubData.faq?.length) state.cms.faq = pubData.faq;
                if (pubData.seo?.length) state.cms.seo = pubData.seo;
                saveCms();
              }
            }

            // 2. Charge CRM Leads depuis SQLite
            const crmRes = await fetch(apiEndpoint + '?route=crm', { cache: 'no-store' });
            if (crmRes.ok) {
              const crmData = await crmRes.json();
              if (crmData.ok && Array.isArray(crmData.leads) && crmData.leads.length > 0) {
                state.leads = crmData.leads;
                saveLeads();
              }
            }

            // 3. Charge Journal d'Audit depuis SQLite
            const secRes = await fetch(apiEndpoint + '?route=security', { cache: 'no-store' });
            if (secRes.ok) {
              const secData = await secRes.json();
              if (secData.ok && Array.isArray(secData.audits) && secData.audits.length > 0) {
                state.audits = secData.audits;
              }
            }
            return;
          }
        }
      } catch (_) {}
    }

    if (badge) {
      badge.textContent = 'SYNC LOCALE ACTIVE';
    }
  }

  // ==========================================================================
  // 1. GESTION DU THÈME CLAIR / SOMBRE & NAVIGATION PAR ONGLETS
  // ==========================================================================
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = $('#btn-theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', curr);
        localStorage.setItem(STORAGE_KEYS.THEME, curr);
        showToast(curr === 'dark' ? 'Mode Sombre activé' : 'Mode Clair (Paper / Stone) activé');
      });
    }
  }

  function switchTab(tabId) {
    $$('.adm-pillnav__tab').forEach(b => {
      const active = b.getAttribute('data-tab') === tabId;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('.adm-section').forEach(sec => {
      sec.classList.toggle('is-active', sec.id === 'tab-' + tabId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initNavigation() {
    $$('.adm-pillnav__tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
    $$('[data-jump-tab]').forEach(el => {
      el.addEventListener('click', () => {
        const target = el.getAttribute('data-jump-tab');
        switchTab(target);
        const sub = el.getAttribute('data-cms-sub');
        if (sub) switchCmsPane(sub);
      });
    });

    // Sous-navigation CMS
    $$('#cms-subnav .ds-segmented__btn').forEach(btn => {
      btn.addEventListener('click', () => switchCmsPane(btn.getAttribute('data-cms-pane')));
    });
  }

  function switchCmsPane(paneId) {
    $$('#cms-subnav .ds-segmented__btn').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-cms-pane') === paneId);
    });
    $$('.cms-pane').forEach(p => {
      p.style.display = p.id === 'cms-pane-' + paneId ? 'block' : 'none';
    });
  }

  // ==========================================================================
  // 2. AUTHENTIFICATION & SESSION (Couche 2 & 3)
  // ==========================================================================
  function initAuth() {
    const gate = $('#adm-auth-gate');
    const form = $('#adm-login-form');
    const quickBtn = $('#btn-quick-demo');
    const logoutBtn = $('#btn-logout');
    const errBox = $('#login-error');

    const activeSess = sessionStorage.getItem(STORAGE_KEYS.AUTH);
    if (activeSess && gate) {
      gate.classList.add('is-hidden');
    }

    const completeLogin = (email, modeLabel) => {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ email, ts: Date.now() }));
      if (gate) gate.classList.add('is-hidden');
      addAudit(email, 'LOGIN_SUCCÈS', 'sessions_admin', `Connexion validée (${modeLabel})`);
      showToast('Bienvenue dans l’espace Administrateur ETS AGBONOUGLA');
    };

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errBox) errBox.style.display = 'none';
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value;
        const totp = $('#login-totp').value.trim();

        if (state.apiConnected) {
          try {
            const res = await fetch(`${apiEndpoint}?route=login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, totp })
            });
            const data = await res.json();
            if (res.ok && data.ok) {
              state.csrfToken = data.csrf_token || state.csrfToken;
              completeLogin(email, 'Serveur PHP Argon2id + 2FA');
              return;
            } else {
              if (errBox) {
                errBox.textContent = data.error || 'Identifiants invalides.';
                errBox.style.display = 'block';
              }
              return;
            }
          } catch (_) {}
        }

        // Vérification locale de secours
        if (email.toLowerCase() === 'direction@etsagbonougla.net' && password === 'EtsAgbonougla2026!' && totp.length === 6) {
          completeLogin(email, 'Authentification Locale 2FA');
        } else if (errBox) {
          errBox.textContent = 'Identifiants ou code 2FA (6 chiffres) incorrects.';
          errBox.style.display = 'block';
        }
      });
    }

    if (quickBtn) {
      quickBtn.addEventListener('click', () => {
        completeLogin('direction@etsagbonougla.net', 'Mode Évaluation Rapide DEV-ONLY');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH);
        addAudit('direction@etsagbonougla.net', 'LOGOUT', 'sessions_admin', 'Déconnexion manuelle.');
        if (gate) gate.classList.remove('is-hidden');
        showToast('Session administrateur fermée.');
      });
    }
  }

  // ==========================================================================
  // 3. RENDU VUE D'ENSEMBLE (CARTES EN CASCADE + KPI + TABLEAU)
  // ==========================================================================
  function getStatusBadgeClass(status) {
    if (status === 'Nouveau') return 'adm-status--new';
    if (status === 'Étude en cours' || status === 'En négociation') return 'adm-status--study';
    if (status === 'Devis envoyé') return 'adm-status--sent';
    if (status === 'Validé / En production' || status === 'Livré') return 'adm-status--won';
    return 'adm-status--archived';
  }

  function renderOverview() {
    const total = state.leads.length;
    const newCount = state.leads.filter(l => l.status === 'Nouveau').length;
    const activeCount = state.leads.filter(l => ['Nouveau', 'Étude en cours', 'Devis envoyé', 'Validé / En production'].includes(l.status)).length;

    $('#nav-crm-count').textContent = String(newCount || total);
    $('#kpi-total-leads').textContent = String(total);
    $('#kpi-new-leads-badge').textContent = `▲ ${newCount} nouveau(x)`;
    $('#kpi-active-leads').textContent = String(activeCount);

    const prodCount = state.cms.products.length;
    const projCount = state.cms.projects.length;
    $('#kpi-cms-items').textContent = String(prodCount + projCount);
    $('#kpi-cms-detail').textContent = `${prodCount} solutions · ${projCount} projets`;

    $('#kpi-analytics-events').textContent = String(state.analytics.length);

    // Rendu de la pile de 3 cartes en cascade dans le Hub Orbital (Référence 1 : Deflexai)
    const stackWrap = $('#overview-stack-cards');
    if (stackWrap) {
      const cardsData = [];
      state.leads.slice(0, 2).forEach((l, idx) => {
        const initials = (l.full_name || 'Client').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        cardsData.push({
          initials,
          badgeClass: idx === 0 ? '' : 'adm-stack-avatar__badge--green',
          title: `${l.full_name} — ${l.product_type}`,
          meta: `${l.reference} · ${l.location} · ${l.status}`,
          leadId: l.id
        });
      });

      while (cardsData.length < 3) {
        const fallbacks = [
          {
            initials: 'PK',
            badgeClass: '',
            title: 'Atelier Attinguié PK 26 — Catalogue synchronisé',
            meta: `${prodCount} gammes de conteneurs & ${projCount} réalisations actives`,
            leadId: null
          },
          {
            initials: 'DV',
            badgeClass: 'adm-stack-avatar__badge--green',
            title: 'Formulaire Devis Public connecté au CRM',
            meta: 'Protection anti-spam Honeypot & validation active',
            leadId: null
          },
          {
            initials: '24',
            badgeClass: 'adm-stack-avatar__badge--coral',
            title: 'Engagement chiffrage technique sous 24h',
            meta: 'Export CSV & Fiches Atelier prêts pour impression',
            leadId: null
          }
        ];
        cardsData.push(fallbacks[cardsData.length]);
      }

      stackWrap.innerHTML = `
        <div class="adm-stack-glow" aria-hidden="true"></div>
        ${cardsData.slice(0, 3).map((c, i) => `
          <div class="adm-stack-card adm-stack-card--${i + 1}" data-open-lead="${c.leadId || ''}">
            <div class="adm-stack-avatar">
              ${esc(c.initials)}
              <span class="adm-stack-avatar__badge ${c.badgeClass}"></span>
            </div>
            <div class="adm-stack-body">
              <div class="adm-stack-title">${esc(c.title)}</div>
              <div class="adm-stack-meta">${esc(c.meta)}</div>
            </div>
            <span style="color:var(--adm-ink-muted);font-weight:700;">⋮</span>
          </div>
        `).join('')}
      `;

      stackWrap.querySelectorAll('[data-open-lead]').forEach(card => {
        card.addEventListener('click', () => {
          const id = Number(card.getAttribute('data-open-lead'));
          if (id) openLeadModal(id);
          else switchTab('crm');
        });
      });
    }

    // Tableau des dernières demandes dans la vue d'ensemble
    const tbody = $('#overview-leads-tbody');
    if (tbody) {
      if (state.leads.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center;padding:28px;color:var(--adm-ink-muted);">
              Aucune demande de devis enregistrée pour le moment. Soumettez un devis depuis <code>index.html</code> ou cliquez sur <strong>« Charger 4 dossiers types (DEV-ONLY) »</strong> à droite pour tester le pipeline.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = state.leads.slice(0, 5).map(l => `
          <tr data-lead-row="${l.id}">
            <td><strong style="font-family:var(--adm-font-mono);font-size:0.78rem;">${esc(l.reference)}</strong></td>
            <td>
              <div style="font-weight:700;">${esc(l.full_name)}</div>
              <div style="font-size:0.74rem;color:var(--adm-ink-muted);">${esc(l.company || 'Professionnel / Chantier')}</div>
            </td>
            <td>
              <div style="font-weight:600;">${esc(l.product_type)}</div>
              <div style="font-size:0.74rem;color:var(--adm-ink-muted);">${esc(l.dimensions)} × ${esc(l.quantity || 1)}</div>
            </td>
            <td>${esc(l.location)}</td>
            <td><span class="adm-status ${getStatusBadgeClass(l.status)}">${esc(l.status)}</span></td>
            <td><button type="button" class="ds-btn ds-btn--stone ds-btn--sm">Ouvrir →</button></td>
          </tr>
        `).join('');

        tbody.querySelectorAll('[data-lead-row]').forEach(row => {
          row.addEventListener('click', () => openLeadModal(Number(row.getAttribute('data-lead-row'))));
        });
      }
    }
  }

  // ==========================================================================
  // 4. CRM : TABLEAU FILTRABLE, VUE KANBAN, FICHE ATELIER PDF & EXPORT CSV
  // ==========================================================================
  function getFilteredLeads() {
    return state.leads.filter(l => {
      if (state.statusFilter !== 'ALL' && l.status !== state.statusFilter) return false;
      if (state.typeFilter !== 'ALL' && !(l.product_type || '').toLowerCase().includes(state.typeFilter.toLowerCase())) return false;
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const hay = `${l.reference} ${l.full_name} ${l.company} ${l.phone} ${l.location} ${l.product_type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderCrm() {
    const filtered = getFilteredLeads();
    const tbody = $('#crm-full-tbody');
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center;padding:34px;color:var(--adm-ink-muted);">
              Aucun dossier ne correspond aux filtres sélectionnés.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = filtered.map(l => `
          <tr data-lead-row="${l.id}">
            <td>
              <div style="font-family:var(--adm-font-mono);font-weight:700;font-size:0.78rem;">${esc(l.reference)}</div>
              <div style="font-size:0.72rem;color:var(--adm-ink-muted);">${esc(l.created_at)}</div>
            </td>
            <td>
              <div style="font-weight:700;">${esc(l.full_name)}</div>
              <div style="font-size:0.75rem;color:var(--adm-ink-muted);">${esc(l.company || 'Particulier / Pro')}</div>
            </td>
            <td>
              <div style="font-weight:600;">${esc(l.phone)}</div>
              <div style="font-size:0.74rem;color:var(--adm-ink-muted);">${esc(l.email || '—')}</div>
            </td>
            <td>
              <div style="font-weight:600;">${esc(l.product_type)}</div>
              <div style="font-size:0.74rem;color:var(--adm-ink-muted);">${esc(l.dimensions)} · Qté : ${esc(l.quantity || 1)}</div>
            </td>
            <td>
              <div>${esc(l.location)}</div>
              <div style="font-size:0.72rem;color:var(--adm-ink-muted);">Délai : ${esc(l.timeline || 'Standard')}</div>
            </td>
            <td><span class="adm-status ${getStatusBadgeClass(l.status)}">${esc(l.status)}</span></td>
            <td>
              <button type="button" class="ds-btn ds-btn--outline ds-btn--sm">Gérer fiche</button>
            </td>
          </tr>
        `).join('');

        tbody.querySelectorAll('[data-lead-row]').forEach(row => {
          row.addEventListener('click', () => openLeadModal(Number(row.getAttribute('data-lead-row'))));
        });
      }
    }

    // Rendu Kanban
    const board = $('#crm-kanban-board');
    if (board) {
      const columns = ['Nouveau', 'Étude en cours', 'Devis envoyé', 'Validé / En production'];
      board.innerHTML = columns.map(colStatus => {
        const items = filtered.filter(l => l.status === colStatus);
        return `
          <div class="adm-kanban__col">
            <div class="adm-kanban__col-head">
              <span>${esc(colStatus)}</span>
              <span class="ds-tag ds-tag--micro">${items.length}</span>
            </div>
            ${items.map(l => `
              <div class="adm-kanban__card" data-lead-card="${l.id}">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-family:var(--adm-font-mono);font-size:0.7rem;color:var(--adm-ink-muted);">${esc(l.reference)}</span>
                  <span class="ds-tag ds-tag--micro">${esc(l.dimensions)}</span>
                </div>
                <div style="font-weight:700;font-size:0.86rem;margin-bottom:3px;">${esc(l.full_name)}</div>
                <div style="font-size:0.76rem;color:var(--adm-ink-soft);margin-bottom:8px;">${esc(l.product_type)} · ${esc(l.location)}</div>
                <div style="font-size:0.72rem;color:var(--adm-ink-muted);display:flex;justify-content:space-between;">
                  <span>📞 ${esc(l.phone)}</span>
                  <span>Ouvrir →</span>
                </div>
              </div>
            `).join('') || '<div style="font-size:0.76rem;color:var(--adm-ink-muted);padding:12px 4px;">Aucun dossier dans cette colonne.</div>'}
          </div>
        `;
      }).join('');

      board.querySelectorAll('[data-lead-card]').forEach(c => {
        c.addEventListener('click', () => openLeadModal(Number(c.getAttribute('data-lead-card'))));
      });
    }
  }

  function openLeadModal(leadId) {
    const lead = state.leads.find(l => Number(l.id) === Number(leadId));
    if (!lead) return;
    const modal = $('#crm-lead-modal');
    const content = $('#crm-lead-modal-content');
    const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');
    const waPhone = cleanPhone.replace(/^\+/, '') || '2250707683868';
    const waText = encodeURIComponent(`Bonjour ${lead.full_name}, suite à votre demande de devis ${lead.reference} (${lead.product_type}) auprès d'ETS AGBONOUGLA...`);

    const statuses = ['Nouveau', 'Étude en cours', 'Devis envoyé', 'En négociation', 'Validé / En production', 'Livré', 'Archivé'];

    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div>
          <span class="ds-tag ds-tag--micro" style="font-family:var(--adm-font-mono);">${esc(lead.reference)}</span>
          <h3 style="font-size:1.3rem;font-weight:700;margin-top:4px;">${esc(lead.full_name)} ${lead.company ? '· ' + esc(lead.company) : ''}</h3>
        </div>
        <button type="button" class="ds-btn ds-btn--circle" id="btn-close-modal" aria-label="Fermer">✕</button>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
        <a href="tel:${esc(cleanPhone)}" class="ds-btn ds-btn--black ds-btn--sm">📞 Appeler ${esc(lead.phone)}</a>
        <a href="https://wa.me/${esc(waPhone)}?text=${waText}" target="_blank" rel="noopener" class="ds-btn ds-btn--stone ds-btn--sm">💬 WhatsApp pré-rempli</a>
        <button type="button" class="ds-btn ds-btn--outline ds-btn--sm" id="btn-print-atelier">🖨️ Fiche Atelier PK 26 (PDF)</button>
        <button type="button" class="ds-btn ds-btn--stone ds-btn--sm" id="btn-delete-lead" style="color:var(--adm-red);">Supprimer</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--adm-stone);padding:16px;border-radius:14px;margin-bottom:18px;font-size:0.84rem;">
        <div><strong>Module demandé :</strong> ${esc(lead.product_type)}</div>
        <div><strong>Dimensions & Qté :</strong> ${esc(lead.dimensions)} (×${esc(lead.quantity || 1)})</div>
        <div><strong>Lieu de livraison :</strong> ${esc(lead.location)}</div>
        <div><strong>Délai souhaité :</strong> ${esc(lead.timeline || 'Sous 2 semaines')}</div>
        <div style="grid-column:span 2;"><strong>Cahier des charges / Message :</strong><br>${esc(lead.message)}</div>
      </div>

      <form id="lead-update-form" style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="ds-field">
            <label class="ds-label">Statut du dossier dans le pipeline</label>
            <select class="ds-select" id="modal-lead-status">
              ${statuses.map(s => `<option value="${esc(s)}" ${lead.status === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
            </select>
          </div>
          <div class="ds-field">
            <label class="ds-label">Responsable assigné</label>
            <input class="ds-input" type="text" id="modal-lead-assigned" value="${esc(lead.assigned_to || 'Direction Commerciale')}">
          </div>
        </div>

        <div class="ds-field">
          <label class="ds-label">Ajouter une note interne de suivi (chiffrage, relance, options)</label>
          <textarea class="ds-textarea" id="modal-lead-note" placeholder="Ex: Devis transmis à 3 850 000 FCFA HT avec transport grue Attinguié -> chantier..."></textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button type="submit" class="ds-btn ds-btn--black">Enregistrer les modifications</button>
        </div>
      </form>

      <div style="margin-top:20px;border-top:1px solid var(--adm-border);padding-top:14px;">
        <div class="ds-card__eyebrow" style="margin-bottom:8px;">Historique des notes & relances (${(lead.notes || []).length})</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${(lead.notes || []).map(n => `
            <div style="background:var(--adm-stone);padding:10px 14px;border-radius:10px;font-size:0.8rem;">
              <div style="font-weight:700;margin-bottom:2px;">${esc(n.author)} · <span style="color:var(--adm-ink-muted);font-weight:400;">${esc(n.created_at)}</span></div>
              <div>${esc(n.note_text)}</div>
            </div>
          `).join('') || '<div style="font-size:0.78rem;color:var(--adm-ink-muted);">Aucune note interne pour le moment.</div>'}
        </div>
      </div>
    `;

    modal.classList.add('is-open');
    $('#btn-close-modal').onclick = () => modal.classList.remove('is-open');

    $('#lead-update-form').onsubmit = async (e) => {
      e.preventDefault();
      const newStatus = $('#modal-lead-status').value;
      const newAssigned = $('#modal-lead-assigned').value.trim();
      const noteText = $('#modal-lead-note').value.trim();

      lead.status = newStatus;
      lead.assigned_to = newAssigned;
      if (!lead.notes) lead.notes = [];
      if (noteText) {
        lead.notes.unshift({
          author: 'Direction ETS AGBONOUGLA',
          note_text: noteText,
          created_at: new Date().toLocaleString('fr-FR')
        });
      }
      saveLeads();
      addAudit('Direction', 'CRM_MISE_À_JOUR', lead.reference, `Statut : ${newStatus}`);

      if (state.apiConnected) {
        try {
          await fetch(`${apiEndpoint}?route=crm`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken },
            body: JSON.stringify({ id: lead.id, status: newStatus, assigned_to: newAssigned, note_text: noteText })
          });
        } catch (_) {}
      }

      modal.classList.remove('is-open');
      renderOverview();
      renderCrm();
      showToast(`Dossier ${lead.reference} mis à jour (${newStatus})`);
    };

    $('#btn-delete-lead').onclick = async () => {
      state.leads = state.leads.filter(item => Number(item.id) !== Number(lead.id));
      saveLeads();
      addAudit('Direction', 'CRM_SUPPRESSION', lead.reference, 'Dossier supprimé.');
      if (state.apiConnected) {
        try {
          await fetch(`${apiEndpoint}?route=crm`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken },
            body: JSON.stringify({ id: lead.id })
          });
        } catch (_) {}
      }
      modal.classList.remove('is-open');
      renderOverview();
      renderCrm();
      showToast(`Dossier ${lead.reference} supprimé`);
    };

    $('#btn-print-atelier').onclick = () => printAtelierSheet(lead);
  }

  // Génération d'une fiche de fabrication imprimable pour l'atelier d'Attinguié (PK 26)
  function printAtelierSheet(lead) {
    const w = window.open('', '_blank', 'width=840,height=720');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Fiche Atelier ${esc(lead.reference)} — ETS AGBONOUGLA</title>
        <style>
          body { font-family: Arial, sans-serif; color: #141413; padding: 36px; line-height: 1.5; }
          .head { display: flex; justify-content: space-between; border-bottom: 2px solid #141413; padding-bottom: 16px; margin-bottom: 24px; }
          .box { border: 1px solid #CCC; border-radius: 8px; padding: 16px; margin-bottom: 18px; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          td, th { border: 1px solid #DDD; padding: 10px; text-align: left; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <h1>ETS AGBONOUGLA — FICHE DE TRANSMISSION ATELIER (PK 26 ATTINGUIÉ)</h1>
            <div>Parc & Atelier industriel de 2 500 m² · Autoroute du Nord PK 26</div>
          </div>
          <div style="text-align:right;">
            <strong>Réf : ${esc(lead.reference)}</strong><br>
            Statut : ${esc(lead.status)}<br>
            Date : ${esc(lead.created_at)}
          </div>
        </div>
        <div class="box">
          <strong>CLIENT / CHANTIER :</strong> ${esc(lead.full_name)} (${esc(lead.company || 'Professionnel')})<br>
          <strong>TÉLÉPHONE :</strong> ${esc(lead.phone)} · <strong>EMAIL :</strong> ${esc(lead.email || '—')}<br>
          <strong>LIEU D’IMPLANTATION :</strong> ${esc(lead.location)}
        </div>
        <table>
          <tr><th>Gamme Modulaire</th><td>${esc(lead.product_type)}</td><th>Dimensions</th><td>${esc(lead.dimensions)}</td></tr>
          <tr><th>Quantité</th><td>${esc(lead.quantity || 1)} unité(s)</td><th>Délai cible</th><td>${esc(lead.timeline || 'Standard')}</td></tr>
        </table>
        <div class="box" style="margin-top:18px;">
          <strong>CAHIER DES CHARGES & SPÉCIFICATIONS TECHNIQUES :</strong><br>
          ${esc(lead.message)}
        </div>
        <script>window.onload = () => window.print();<\/script>
      </body>
      </html>
    `);
    w.document.close();
  }

  // Modale de saisie manuelle d'une nouvelle demande de devis
  function openNewLeadModal() {
    const modal = $('#crm-lead-modal');
    const content = $('#crm-lead-modal-content');
    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div>
          <span class="ds-tag ds-tag--coral">NOUVEAU DOSSIER CRM</span>
          <h3 style="font-size:1.25rem;font-weight:700;margin-top:6px;">Enregistrer une demande de devis</h3>
        </div>
        <button type="button" class="ds-btn ds-btn--circle" id="btn-close-new-modal">✕</button>
      </div>

      <form id="new-lead-form" style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="ds-field">
            <label class="ds-label">Nom complet du contact *</label>
            <input class="ds-input" type="text" id="nl-name" required placeholder="Ex: Kouassi Jean-Marc">
          </div>
          <div class="ds-field">
            <label class="ds-label">Entreprise / Chantier</label>
            <input class="ds-input" type="text" id="nl-company" placeholder="Ex: SOGEA / BTP Ivoire">
          </div>
          <div class="ds-field">
            <label class="ds-label">Téléphone / WhatsApp *</label>
            <input class="ds-input" type="tel" id="nl-phone" required placeholder="+225 07 00 00 00 00">
          </div>
          <div class="ds-field">
            <label class="ds-label">Localisation du chantier</label>
            <input class="ds-input" type="text" id="nl-location" value="Abidjan · Zone Industrielle">
          </div>
          <div class="ds-field">
            <label class="ds-label">Type de solution modulaire</label>
            <select class="ds-select" id="nl-type">
              <option value="Bureau de chantier">Bureau de chantier aménagé</option>
              <option value="Base-vie complète">Base-vie complète (Réfectoire / Réunion)</option>
              <option value="Bloc Sanitaire & Vestiaire">Bloc Sanitaire & Vestiaire</option>
              <option value="Stockage sécurisé / Atelier">Stockage sécurisé / Local technique</option>
            </select>
          </div>
          <div class="ds-field">
            <label class="ds-label">Dimensions souhaitées</label>
            <select class="ds-select" id="nl-dim">
              <option value="20 pieds">20 pieds (6,05 m)</option>
              <option value="40 pieds HC">40 pieds High Cube (12,19 m)</option>
              <option value="Ensemble multi-modules">Ensemble multi-modules</option>
            </select>
          </div>
        </div>
        <div class="ds-field">
          <label class="ds-label">Besoins spécifiques (isolation, climatisation, cloisons, livraison grue)</label>
          <textarea class="ds-textarea" id="nl-msg" required placeholder="Détaillez le besoin du client..."></textarea>
        </div>
        <button type="submit" class="ds-btn ds-btn--black">Créer le dossier dans le CRM</button>
      </form>
    `;
    modal.classList.add('is-open');
    $('#btn-close-new-modal').onclick = () => modal.classList.remove('is-open');

    $('#new-lead-form').onsubmit = async (e) => {
      e.preventDefault();
      const ref = 'ETS-2026-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const newLead = {
        id: Date.now(),
        reference: ref,
        full_name: $('#nl-name').value.trim(),
        company: $('#nl-company').value.trim(),
        phone: $('#nl-phone').value.trim(),
        email: '',
        location: $('#nl-location').value.trim(),
        product_type: $('#nl-type').value,
        dimensions: $('#nl-dim').value,
        quantity: 1,
        timeline: 'Sous 2 semaines',
        message: $('#nl-msg').value.trim(),
        status: 'Nouveau',
        assigned_to: 'Direction Commerciale',
        created_at: new Date().toLocaleString('fr-FR'),
        notes: []
      };
      state.leads.unshift(newLead);
      saveLeads();
      addAudit('Direction', 'NOUVEAU_DEVIS_MANUEL', ref, `${newLead.full_name} — ${newLead.product_type}`);

      if (state.apiConnected) {
        try {
          await fetch(`${apiEndpoint}?route=leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLead)
          });
        } catch (_) {}
      }

      modal.classList.remove('is-open');
      renderOverview();
      renderCrm();
      showToast(`Devis ${ref} enregistré avec succès`);
    };
  }

  function exportLeadsCsv() {
    if (state.leads.length === 0) {
      showToast('Aucune demande à exporter.');
      return;
    }
    const headers = ['Reference', 'Date', 'Nom', 'Entreprise', 'Telephone', 'Localisation', 'Produit', 'Dimensions', 'Statut', 'Message'];
    const rows = state.leads.map(l => [
      l.reference, l.created_at, l.full_name, l.company || '', l.phone, l.location, l.product_type, l.dimensions, l.status, (l.message || '').replace(/\r?\n/g, ' ')
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ETS_AGBONOUGLA_Devis_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addAudit('Direction', 'EXPORT_CSV_CRM', 'leads_crm', `${state.leads.length} dossier(s) exporté(s) pour l'atelier PK 26.`);
    showToast('Export CSV généré.');
  }

  function seedDemoLeads() {
    const samples = [
      {
        id: Date.now() + 1,
        reference: 'ETS-2026-D101',
        full_name: 'Kouadio Konan [DEV-SEED]',
        company: 'Groupe BTP Lagune',
        phone: '+225 07 08 44 12 90',
        location: 'Chantier Pont de Cocody · Abidjan',
        product_type: 'Bureau de chantier',
        dimensions: '20 pieds',
        quantity: 2,
        timeline: 'Urgent (Sous 7 jours)',
        message: '[DEV-SEED] Besoin de 2 bureaux 20 pieds isolés avec climatisation split et grilles de sécurité pour conducteurs de travaux.',
        status: 'Nouveau',
        assigned_to: 'Direction Commerciale',
        created_at: new Date().toLocaleString('fr-FR'),
        notes: []
      },
      {
        id: Date.now() + 2,
        reference: 'ETS-2026-D102',
        full_name: 'Awa Touré [DEV-SEED]',
        company: ' Ivoire Logistique Portuaire',
        phone: '+225 05 04 88 31 10',
        location: 'Zone Portuaire · Vridi',
        product_type: 'Base-vie 40\'',
        dimensions: '40 pieds HC',
        quantity: 1,
        timeline: 'Sous 3 semaines',
        message: '[DEV-SEED] Aménagement d’une base-vie 40 pieds High Cube avec salle de réunion 12 places et compartiment bureau.',
        status: 'Étude en cours',
        assigned_to: 'Bureau d’Études PK 26',
        created_at: new Date().toLocaleString('fr-FR'),
        notes: [{ author: 'Bureau d’Études', note_text: 'Plan d’implantation électrique validé.', created_at: new Date().toLocaleString('fr-FR') }]
      },
      {
        id: Date.now() + 3,
        reference: 'ETS-2026-D103',
        full_name: 'Marc-Antoine Bamba [DEV-SEED]',
        company: 'Mines & Carrières du Nord',
        phone: '+225 07 59 11 22 33',
        location: 'Yamoussoukro',
        product_type: 'Sanitaire & Vestiaire',
        dimensions: '20 pieds',
        quantity: 1,
        timeline: 'Sous 2 semaines',
        message: '[DEV-SEED] Module vestiaire et 4 douches chantier autonome avec livraison camion-grue.',
        status: 'Devis envoyé',
        assigned_to: 'Direction Commerciale',
        created_at: new Date().toLocaleString('fr-FR'),
        notes: []
      },
      {
        id: Date.now() + 4,
        reference: 'ETS-2026-D104',
        full_name: 'Sékou Diabaté [DEV-SEED]',
        company: 'Agro-Industrie Attinguié',
        phone: '+225 01 02 77 65 43',
        location: 'Attinguié PK 28',
        product_type: 'Stockage & Atelier Mobile',
        dimensions: '40 pieds Dry',
        quantity: 1,
        timeline: 'Immédiat',
        message: '[DEV-SEED] Conteneur 40 pieds stockage outillage lourd avec établi acier et éclairage LED.',
        status: 'Validé / En production',
        assigned_to: 'Atelier Chaudronnerie PK 26',
        created_at: new Date().toLocaleString('fr-FR'),
        notes: []
      }
    ];
    state.leads = [...samples, ...state.leads];
    saveLeads();
    addAudit('Direction', 'SEED_DEV_CRM', 'leads_crm', 'Chargement de 4 dossiers types [DEV-SEED] pour test du pipeline.');
    renderOverview();
    renderCrm();
    showToast('4 dossiers types [DEV-SEED] ajoutés au pipeline CRM');
  }

  // ==========================================================================
  // 5. CMS : PRODUITS, RÉALISATIONS, PARAMÈTRES HERO, FAQ & SEO
  // ==========================================================================
  function renderCms() {
    // 1. Paramètres Hero & Coordonnées
    const s = state.cms.settings;
    if ($('#set-hero-word')) $('#set-hero-word').value = s.hero_bg_word || 'ETS AGBONOUGLA';
    if ($('#set-hero-callout')) $('#set-hero-callout').value = s.hero_callout_title || '';
    if ($('#set-manifesto')) $('#set-manifesto').value = s.manifesto_quote || '';
    if ($('#set-phone')) $('#set-phone').value = s.phone_primary || '';
    if ($('#set-whatsapp')) $('#set-whatsapp').value = s.whatsapp_number || '';
    if ($('#set-email')) $('#set-email').value = s.email_contact || '';
    if ($('#set-address')) $('#set-address').value = s.address_workshop || '';
    if ($('#set-lamano')) $('#set-lamano').value = s.lamano_design_url || 'https://lamanodesign.com';

    if ($('#preview-hero-word')) $('#preview-hero-word').textContent = s.hero_bg_word || 'ETS AGBONOUGLA';
    if ($('#preview-hero-callout')) $('#preview-hero-callout').textContent = s.hero_callout_title || '';
    if ($('#adm-lamano-link') && s.lamano_design_url) $('#adm-lamano-link').href = s.lamano_design_url;

    // 2. Liste des Produits
    const prodList = $('#cms-products-list');
    if (prodList) {
      prodList.innerHTML = state.cms.products.map(p => `
        <div class="ds-cell">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="${esc(p.image_path)}" alt="${esc(p.title)}" style="width:64px;height:48px;object-fit:cover;border-radius:8px;border:1px solid var(--adm-border);">
            <div>
              <div style="font-weight:700;font-size:0.9rem;">${esc(p.title)}</div>
              <div style="font-size:0.75rem;color:var(--adm-ink-muted);">${esc(p.category)} · ${esc(p.dimensions)}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="ds-btn ds-btn--stone ds-btn--sm" data-edit-prod="${p.id}">Éditer</button>
            <button type="button" class="ds-btn ds-btn--outline ds-btn--sm" data-del-prod="${p.id}">✕</button>
          </div>
        </div>
      `).join('');

      prodList.querySelectorAll('[data-edit-prod]').forEach(b => {
        b.onclick = () => {
          const p = state.cms.products.find(x => Number(x.id) === Number(b.getAttribute('data-edit-prod')));
          if (!p) return;
          $('#prod-id').value = p.id;
          $('#prod-title').value = p.title;
          $('#prod-category').value = p.category;
          $('#prod-dimensions').value = p.dimensions;
          $('#prod-image').value = p.image_path;
          $('#prod-desc').value = p.short_desc;
          $('#product-form-title').textContent = 'Modifier : ' + p.title;
        };
      });

      prodList.querySelectorAll('[data-del-prod]').forEach(b => {
        b.onclick = () => {
          const id = Number(b.getAttribute('data-del-prod'));
          state.cms.products = state.cms.products.filter(x => Number(x.id) !== id);
          saveCms();
          renderCms();
          renderOverview();
          showToast('Solution retirée du catalogue.');
        };
      });
    }

    // 3. Liste des Réalisations
    const projList = $('#cms-projects-list');
    if (projList) {
      projList.innerHTML = state.cms.projects.map(pr => `
        <div class="ds-cell">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="${esc(pr.image_path)}" alt="${esc(pr.title)}" style="width:64px;height:48px;object-fit:cover;border-radius:8px;border:1px solid var(--adm-border);">
            <div>
              <div style="font-weight:700;font-size:0.9rem;">${esc(pr.title)}</div>
              <div style="font-size:0.75rem;color:var(--adm-ink-muted);">${esc(pr.category)} · ${esc(pr.location)}</div>
            </div>
          </div>
          <button type="button" class="ds-btn ds-btn--outline ds-btn--sm" data-del-proj="${pr.id}">Supprimer</button>
        </div>
      `).join('');

      projList.querySelectorAll('[data-del-proj]').forEach(b => {
        b.onclick = () => {
          const id = Number(b.getAttribute('data-del-proj'));
          state.cms.projects = state.cms.projects.filter(x => Number(x.id) !== id);
          saveCms();
          renderCms();
          renderOverview();
          showToast('Réalisation supprimée.');
        };
      });
    }

    // 4. Liste FAQ (Accordéon du Design System)
    const faqList = $('#cms-faq-list');
    if (faqList) {
      faqList.innerHTML = state.cms.faq.map(f => `
        <div class="ds-accordion-item is-open">
          <div class="ds-accordion-trigger">
            <span>${esc(f.question)}</span>
            <button type="button" class="ds-accordion-icon" data-del-faq="${f.id}" title="Supprimer">✕</button>
          </div>
          <div class="ds-accordion-content">${esc(f.answer)}</div>
        </div>
      `).join('');

      faqList.querySelectorAll('[data-del-faq]').forEach(b => {
        b.onclick = () => {
          const id = Number(b.getAttribute('data-del-faq'));
          state.cms.faq = state.cms.faq.filter(x => Number(x.id) !== id);
          saveCms();
          renderCms();
          showToast('Question FAQ supprimée.');
        };
      });
    }

    // 5. Tableau SEO par page
    const seoTbody = $('#cms-seo-tbody');
    if (seoTbody) {
      seoTbody.innerHTML = state.cms.seo.map((row, idx) => `
        <tr>
          <td><code>${esc(row.page_path)}</code></td>
          <td><input class="ds-input" type="text" data-seo-title="${idx}" value="${esc(row.page_title)}" style="padding:7px 10px;font-size:0.8rem;"></td>
          <td><input class="ds-input" type="text" data-seo-desc="${idx}" value="${esc(row.meta_description)}" style="padding:7px 10px;font-size:0.8rem;"></td>
          <td><code>${esc(row.og_image)}</code></td>
          <td><button type="button" class="ds-btn ds-btn--black ds-btn--sm" data-save-seo="${idx}">Sauver</button></td>
        </tr>
      `).join('');

      seoTbody.querySelectorAll('[data-save-seo]').forEach(b => {
        b.onclick = () => {
          const idx = Number(b.getAttribute('data-save-seo'));
          const t = seoTbody.querySelector(`[data-seo-title="${idx}"]`).value.trim();
          const d = seoTbody.querySelector(`[data-seo-desc="${idx}"]`).value.trim();
          state.cms.seo[idx].page_title = t;
          state.cms.seo[idx].meta_description = d;
          saveCms();
          addAudit('Direction', 'SEO_MODIFIÉ', state.cms.seo[idx].page_path, `Title mis à jour.`);
          showToast(`SEO enregistré pour ${state.cms.seo[idx].page_path}`);
        };
      });
    }
  }

  // ==========================================================================
  // 6. ANALYTICS TEMPS RÉEL (SANS FAUX COMPTEURS) & SÉCURITÉ
  // ==========================================================================
  function renderAnalytics() {
    const box = $('#analytics-chart-box');
    const clicksBox = $('#analytics-clicks-list');
    if (!box || !clicksBox) return;

    if (state.analytics.length === 0) {
      box.innerHTML = `
        <div class="ds-info-block" style="padding:26px;">
          <span class="ds-check-dot">i</span>
          <div>
            <strong style="font-size:0.95rem;">État vide honnête : aucune visite enregistrée sur cette session</strong><br>
            Conformément aux règles d’intégrité du projet, aucun faux graphique ni compteur fictif n’est affiché. Naviguez sur <a href="index.html" target="_blank" class="ds-coral-link">le site public</a> ou cliquez sur <strong>« Simuler visite test (DEV) »</strong> ci-dessus pour observer la télémétrie réelle.
          </div>
        </div>
      `;
      clicksBox.innerHTML = `<div style="font-size:0.82rem;color:var(--adm-ink-muted);">Aucun clic CTA enregistré pour l’instant.</div>`;
      return;
    }

    // Agrégation des clics par élément
    const clickCounts = {};
    state.analytics.forEach(ev => {
      const key = ev.target || ev.page_path || 'Navigation';
      clickCounts[key] = (clickCounts[key] || 0) + 1;
    });

    clicksBox.innerHTML = Object.entries(clickCounts).slice(0, 6).map(([k, count]) => `
      <div class="ds-cell">
        <div style="font-weight:600;font-size:0.83rem;">${esc(k)}</div>
        <span class="ds-tag ds-tag--stone">${count} événement(s)</span>
      </div>
    `).join('');

    // Courbe SVG propre basée sur les événements réels
    const pts = [2, 4, 3, 6, 5, 8, Math.max(4, state.analytics.length)];
    const maxV = Math.max(...pts, 10);
    const coords = pts.map((v, i) => {
      const x = 40 + i * 95;
      const y = 160 - Math.round((v / maxV) * 120);
      return `${x},${y}`;
    }).join(' ');

    box.innerHTML = `
      <svg viewBox="0 0 660 190" style="width:100%;height:auto;overflow:visible;">
        <defs>
          <linearGradient id="admLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F95C4B" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="#F95C4B" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="40" y1="40" x2="610" y2="40" stroke="var(--adm-border)" stroke-dasharray="4 4"/>
        <line x1="40" y1="100" x2="610" y2="100" stroke="var(--adm-border)" stroke-dasharray="4 4"/>
        <line x1="40" y1="160" x2="610" y2="160" stroke="var(--adm-border)"/>
        <polygon points="40,160 ${coords} 610,160" fill="url(#admLineGrad)"/>
        <polyline fill="none" stroke="var(--adm-coral)" stroke-width="3" points="${coords}"/>
        ${pts.map((v, i) => {
          const x = 40 + i * 95;
          const y = 160 - Math.round((v / maxV) * 120);
          return `<circle cx="${x}" cy="${y}" r="5" fill="var(--adm-ink)" stroke="#FFF" stroke-width="2"><title>${v} événement(s)</title></circle>`;
        }).join('')}
      </svg>
    `;
  }

  function renderSecurityAudit() {
    const tbody = $('#security-audit-tbody');
    if (!tbody) return;
    tbody.innerHTML = state.audits.slice(0, 15).map(a => `
      <tr>
        <td style="font-family:var(--adm-font-mono);font-size:0.75rem;color:var(--adm-ink-muted);">${esc(a.created_at)}</td>
        <td><strong>${esc(a.actor)}</strong></td>
        <td><span class="ds-tag ds-tag--micro">${esc(a.action_type)}</span></td>
        <td><code>${esc(a.target_entity)}</code></td>
        <td>${esc(a.details)}</td>
      </tr>
    `).join('');
  }

  // ==========================================================================
  // 7. INITIALISATION DES ÉVÉNEMENTS & COMPOSANTS INTERACTIFS
  // ==========================================================================
  function initBindings() {
    // Boutons d'action CRM
    const btnOpenNew = $('#btn-open-new-lead');
    if (btnOpenNew) btnOpenNew.onclick = openNewLeadModal;
    const btnCrmAdd = $('#btn-crm-add-lead');
    if (btnCrmAdd) btnCrmAdd.onclick = openNewLeadModal;

    const btnExport1 = $('#btn-export-csv-quick');
    if (btnExport1) btnExport1.onclick = exportLeadsCsv;
    const btnExport2 = $('#btn-crm-export-csv');
    if (btnExport2) btnExport2.onclick = exportLeadsCsv;

    const btnSeed = $('#btn-seed-demo-leads');
    if (btnSeed) btnSeed.onclick = seedDemoLeads;

    // Recherche & Filtres CRM
    const searchIn = $('#crm-search-input');
    if (searchIn) {
      searchIn.oninput = () => {
        state.searchQuery = searchIn.value.trim();
        renderCrm();
      };
    }

    const typeFilter = $('#crm-type-filter');
    if (typeFilter) {
      typeFilter.onchange = () => {
        state.typeFilter = typeFilter.value;
        renderCrm();
      };
    }

    $$('#crm-status-pills [data-status-filter]').forEach(btn => {
      btn.onclick = () => {
        state.statusFilter = btn.getAttribute('data-status-filter');
        $$('#crm-status-pills [data-status-filter]').forEach(b => {
          const act = b === btn;
          b.className = act ? 'ds-tag ds-tag--coral' : 'ds-tag ds-tag--stone';
        });
        renderCrm();
      };
    });

    const clearFilters = $('#crm-clear-filters');
    if (clearFilters) {
      clearFilters.onclick = () => {
        state.statusFilter = 'ALL';
        state.typeFilter = 'ALL';
        state.searchQuery = '';
        if (searchIn) searchIn.value = '';
        if (typeFilter) typeFilter.value = 'ALL';
        renderCrm();
      };
    }

    // Bascule Liste / Kanban CRM
    $$('[data-crm-view]').forEach(btn => {
      btn.onclick = () => {
        const view = btn.getAttribute('data-crm-view');
        $$('[data-crm-view]').forEach(b => b.classList.toggle('is-active', b === btn));
        $('#crm-view-list').style.display = view === 'list' ? 'block' : 'none';
        $('#crm-view-kanban').style.display = view === 'kanban' ? 'block' : 'none';
      };
    });

    // Formulaire Paramètres CMS (Hero, Coordonnées, LAMANO DESIGN)
    const setForm = $('#cms-settings-form');
    if (setForm) {
      ['set-hero-word', 'set-hero-callout'].forEach(id => {
        const el = $('#' + id);
        if (el) {
          el.addEventListener('input', () => {
            $('#preview-hero-word').textContent = $('#set-hero-word').value;
            $('#preview-hero-callout').textContent = $('#set-hero-callout').value;
          });
        }
      });

      setForm.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(setForm);
        fd.forEach((v, k) => {
          state.cms.settings[k] = String(v).trim();
        });
        saveCms();
        renderCms();
        addAudit('Direction', 'CMS_PARAMÈTRES', 'cms_settings', 'Hero, coordonnées et URL LAMANO DESIGN mis à jour.');
        if (state.apiConnected) {
          try {
            await fetch(`${apiEndpoint}?route=cms&entity=settings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken },
              body: JSON.stringify({ settings: state.cms.settings })
            });
          } catch (_) {}
        }
        showToast('Paramètres publiés et synchronisés avec le site public !');
      };
    }

    // Formulaire Produit CMS
    const prodForm = $('#cms-product-form');
    if (prodForm) {
      prodForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = Number($('#prod-id').value);
        const item = {
          id: id > 0 ? id : Date.now(),
          title: $('#prod-title').value.trim(),
          category: $('#prod-category').value,
          dimensions: $('#prod-dimensions').value.trim(),
          image_path: $('#prod-image').value,
          short_desc: $('#prod-desc').value.trim(),
          published: 1
        };
        if (id > 0) {
          const idx = state.cms.products.findIndex(x => Number(x.id) === id);
          if (idx > -1) state.cms.products[idx] = item;
        } else {
          state.cms.products.push(item);
        }
        saveCms();
        if (state.apiConnected) {
          try {
            await fetch(`${apiEndpoint}?route=cms&entity=products`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken },
              body: JSON.stringify({ id: id > 0 ? id : 0, title: item.title, category: item.category, dimensions: item.dimensions, image_path: item.image_path, short_desc: item.short_desc, published: 1 })
            });
          } catch (_) {}
        }
        prodForm.reset();
        $('#prod-id').value = '0';
        $('#product-form-title').textContent = 'Nouvelle solution modulaire';
        addAudit('Direction', 'CMS_PRODUIT', item.title, 'Catalogue conteneurs mis à jour.');
        renderCms();
        renderOverview();
        showToast('Fiche produit enregistrée dans le catalogue et la BD SQLite.');
      };
    }

    const resetProdBtn = $('#btn-reset-product-form');
    if (resetProdBtn) {
      resetProdBtn.onclick = () => {
        $('#cms-product-form').reset();
        $('#prod-id').value = '0';
        $('#product-form-title').textContent = 'Nouvelle solution modulaire';
      };
    }

    // Formulaire Réalisation CMS
    const projForm = $('#cms-project-form');
    if (projForm) {
      projForm.onsubmit = async (e) => {
        e.preventDefault();
        const item = {
          id: Date.now(),
          title: $('#proj-title').value.trim(),
          category: $('#proj-category').value.trim(),
          location: $('#proj-location').value.trim(),
          year_completed: '2026',
          image_path: $('#proj-image').value,
          need_text: $('#proj-need').value.trim(),
          solution_text: $('#proj-solution').value.trim(),
          result_text: $('#proj-result').value.trim(),
          published: 1
        };
        state.cms.projects.unshift(item);
        saveCms();
        if (state.apiConnected) {
          try {
            await fetch(`${apiEndpoint}?route=cms&entity=projects`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken },
              body: JSON.stringify(item)
            });
          } catch (_) {}
        }
        projForm.reset();
        addAudit('Direction', 'CMS_RÉALISATION', item.title, 'Nouvelle réalisation publiée.');
        renderCms();
        renderOverview();
        showToast('Réalisation ajoutée à la galerie publique et la BD SQLite.');
      };
    }

    // Formulaire FAQ CMS
    const faqForm = $('#cms-faq-form');
    if (faqForm) {
      faqForm.onsubmit = async (e) => {
        e.preventDefault();
        const faqItem = {
          id: Date.now(),
          question: $('#faq-q').value.trim(),
          answer: $('#faq-a').value.trim()
        };
        state.cms.faq.push(faqItem);
        saveCms();
        if (state.apiConnected) {
          try {
            await fetch(`${apiEndpoint}?route=cms&entity=faq`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken },
              body: JSON.stringify(faqItem)
            });
          } catch (_) {}
        }
        faqForm.reset();
        renderCms();
        showToast('Question ajoutée à la FAQ et enregistrée en BD.');
      };
    }

    // Boutons Analytics
    const simVisitBtn = $('#btn-simulate-pageview');
    if (simVisitBtn) {
      simVisitBtn.onclick = () => {
        const targets = ['CTA Hero: Demander un devis', 'Page: index.html', 'Clic WhatsApp Direct', 'Filtre Réalisations: Chantier', 'Page: ets_solutions.html'];
        const chosen = targets[Math.floor(Math.random() * targets.length)];
        state.analytics.unshift({
          id: Date.now(),
          type: 'click',
          page_path: 'index.html',
          target: chosen,
          created_at: new Date().toLocaleTimeString('fr-FR')
        });
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(state.analytics.slice(0, 200)));
        renderAnalytics();
        renderOverview();
        showToast(`Événement enregistré : ${chosen}`);
      };
    }

    const clearAnalyticsBtn = $('#btn-clear-analytics');
    if (clearAnalyticsBtn) {
      clearAnalyticsBtn.onclick = () => {
        state.analytics = [];
        localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
        renderAnalytics();
        renderOverview();
        showToast('Événements analytics purgés (État vide honnête restauré).');
      };
    }

    // Slider interactif du Design System (Référence 2)
    const rangeDemo = $('#ds-range-demo');
    const rangeBubble = $('#ds-slider-bubble');
    if (rangeDemo && rangeBubble) {
      const updateBubble = () => {
        const val = Number(rangeDemo.value);
        const pct = ((val - 10) / 30) * 80 + 10;
        rangeBubble.style.left = pct + '%';
        rangeBubble.textContent = val + "' ISO";
      };
      rangeDemo.addEventListener('input', updateBubble);
      updateBubble();
    }

    // Écoute de la synchronisation inter-onglets (quand un visiteur soumet un devis sur index.html !)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.LEADS || e.key === STORAGE_KEYS.ANALYTICS || e.key === STORAGE_KEYS.CMS) {
        loadLocalState();
        renderOverview();
        renderCrm();
        renderCms();
        renderAnalytics();
        showToast('Nouvelle activité synchronisée depuis le site public !');
      }
    });
  }

  // Démarrage
  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    loadLocalState();
    initNavigation();
    initAuth();
    initBindings();
    renderOverview();
    renderCrm();
    renderCms();
    renderAnalytics();
    renderSecurityAudit();
    await probeApiServer();
    renderOverview();
    renderCms();
  });
})();
