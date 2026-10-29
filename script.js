/**
 * ETS AGBONOUGLA — Scripts Publics Front-End (Production)
 * Architecture Modulaire & Conteneurs Industriels — Abidjan, Côte d'Ivoire
 * Design & développement par LAMANO DESIGN
 */

const LAMANO_DESIGN_URL = '';

// Signale au script inline du <head> que le moteur d'animation est chargé
window.__etsMotionReady = true;

document.addEventListener('DOMContentLoaded', () => {

  const root = document.documentElement;
  root.classList.add('motion');
  const motionOn = 'IntersectionObserver' in window;
  const reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // État dynamique synchronisé avec la base SQLite (api/index.php?route=public-data)
  let activeWaNumber = '2250707831791';
  let activePhoneDisplay = '+225 07 07 83 17 91';

  // 1. Signature LAMANO DESIGN
  function applyLamanoLink(url) {
    document.querySelectorAll('.lamano-credit, [data-lamano-link], .lamano-link').forEach(link => {
      if (url && url !== '#') {
        link.setAttribute('href', url);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      } else {
        link.removeAttribute('href');
        link.removeAttribute('target');
      }
    });
  }
  applyLamanoLink(LAMANO_DESIGN_URL);

  // 1b. Découpage en mots (conserve <em>, <strong>, <br>)
  const splitWords = (el, wrap) => {
    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = wrap(part, words.length);
            words.push(w);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    return words;
  };

  // 1c. Moteur de mouvement (CSS + IntersectionObserver, aucun scroll-jacking)
  if (motionOn) {
    document.querySelectorAll('[data-reveal="words"]').forEach(el => {
      splitWords(el, (txt, i) => {
        const w = document.createElement('span');
        w.className = 'w';
        const inner = document.createElement('span');
        inner.textContent = txt;
        inner.style.setProperty('--i', i);
        w.appendChild(inner);
        return w;
      });
    });

    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

    const checkReveals = () => {
      const vh = window.innerHeight;
      document.querySelectorAll('[data-reveal]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh - 20 && r.bottom > 0) {
          el.classList.add('is-in');
        } else if (!el.classList.contains('is-in')) {
          revealObs.observe(el);
        }
      });
    };
    checkReveals();
    window.addEventListener('load', () => { setTimeout(checkReveals, 100); });

    const manifestos = new Map();
    document.querySelectorAll('[data-words]').forEach(el => {
      const words = splitWords(el, (txt) => {
        const s = document.createElement('span');
        s.className = 'mw';
        s.textContent = txt;
        return s;
      });
      manifestos.set(el, words);

      el.addEventListener('pointermove', (e) => {
        const target = e.target.closest('.mw');
        if (!target) return;
        const idx = words.indexOf(target);
        if (idx === -1) return;
        words.forEach((w, i) => {
          if (i <= idx) {
            w.style.setProperty('--wp', '1');
            w.classList.add('on');
          }
        });
      }, { passive: true });
    });

    const scrollEls = Array.from(document.querySelectorAll('[data-scroll]'));
    const clamp = (v) => Math.min(1, Math.max(0, v));
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      scrollEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100) {
          el.style.setProperty('--p', '1.0000');
          return;
        }
        if (r.top > vh + 100) {
          el.style.setProperty('--p', '0.0000');
          return;
        }
        const mode = el.getAttribute('data-scroll');
        let p;
        if (mode === 'exit') p = -r.top / Math.max(r.height, 1);
        else if (mode === 'enter') p = (vh - r.top) / (vh * 0.75);
        else p = (vh - r.top) / (vh + r.height);
        p = clamp(p);
        el.style.setProperty('--p', p.toFixed(4));

        if (el.classList.contains('h-hero')) {
          const isMobile = window.innerWidth < 768;
          const maxDescent = isMobile ? 100 : 70;
          const ease = p * p * (3 - 2 * p);
          const craneY = ease * maxDescent;
          el.style.setProperty('--crane-y', craneY.toFixed(2) + 'px');

          const callout = el.querySelector('.h-hero__callout');
          if (callout) {
            callout.style.pointerEvents = p > 0.50 ? 'none' : 'auto';
          }
        }
      });

      document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(revEl => {
        const rect = revEl.getBoundingClientRect();
        if (rect.top < vh - 10 && rect.bottom > 0) {
          revEl.classList.add('is-in');
        }
      });

      manifestos.forEach((words, textEl) => {
        const r = textEl.getBoundingClientRect();
        const startY = vh * 0.86;
        const endY = vh * 0.26;
        const totalSpan = Math.max(startY - endY + r.height * 0.35, 1);
        const rawProgress = clamp((startY - r.top) / totalSpan);
        const total = words.length;
        const exactWord = rawProgress * (total + 2);

        for (let i = 0; i < total; i++) {
          const wProg = clamp(exactWord - i);
          const alpha = (0.20 + wProg * 0.80).toFixed(3);
          const w = words[i];
          w.style.setProperty('--wp', alpha);
          if (wProg >= 0.98) {
            w.classList.add('on');
          } else {
            w.classList.remove('on');
          }
        }
      });
    };
    const requestUpdate = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();

    // Interaction Pins du module <-> Spécifications
    const pins = document.querySelectorAll('.h-pin');
    const specItems = document.querySelectorAll('.h-specs li');
    if (pins.length > 0 && specItems.length > 0) {
      const activate = (num) => {
        pins.forEach(p => p.classList.toggle('act', p.getAttribute('data-pin') === String(num)));
        specItems.forEach(s => s.classList.toggle('act', s.getAttribute('data-spec') === String(num)));
      };
      const reset = () => {
        pins.forEach(p => p.classList.remove('act'));
        specItems.forEach(s => s.classList.remove('act'));
      };

      pins.forEach(p => {
        const num = p.getAttribute('data-pin');
        p.addEventListener('mouseenter', () => activate(num));
        p.addEventListener('focus', () => activate(num));
        p.addEventListener('click', (e) => { e.preventDefault(); activate(num); });
        p.addEventListener('mouseleave', reset);
        p.addEventListener('blur', reset);
      });

      specItems.forEach(s => {
        const num = s.getAttribute('data-spec');
        s.addEventListener('mouseenter', () => activate(num));
        s.addEventListener('mouseleave', reset);
      });
    }
  }

  // 2. Barre de navigation au scroll
  const navbar = document.getElementById('appNavbar');
  const heroPillNav = document.getElementById('heroPillNav');
  const heroSection = document.querySelector('.h-hero');

  if (heroPillNav && heroSection) {
    let ticking = false;
    const updateHeroNav = () => {
      const isPastHero = window.scrollY > 100;
      if (isPastHero) {
        if (!heroPillNav.classList.contains('is-hero-scrolled')) {
          heroPillNav.classList.add('is-hero-scrolled');
          heroPillNav.classList.remove('is-hero-transparent');
          if (navbar) navbar.classList.add('is-scrolled-wrapper');
        }
      } else {
        if (!heroPillNav.classList.contains('is-hero-transparent')) {
          heroPillNav.classList.remove('is-hero-scrolled');
          heroPillNav.classList.add('is-hero-transparent');
          if (navbar) navbar.classList.remove('is-scrolled-wrapper');
        }
      }
      document.body.classList.toggle('is-scrolled', window.scrollY > 420);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeroNav);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateHeroNav();
  } else if (navbar) {
    const handleScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
      document.body.classList.toggle('is-scrolled', window.scrollY > 420);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 3. Menu Mobile (drawer)
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');

  const setDrawerHidden = (hidden) => {
    if (!drawer) return;
    drawer.inert = hidden;
    drawer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  };
  setDrawerHidden(true);

  const openDrawer = () => {
    if (!drawer) return;
    setDrawerHidden(false);
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    if (hamburger) {
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
    const firstLink = drawer.querySelector('.drawer-lnk, button');
    if (firstLink) firstLink.focus();
  };

  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('open');
    setDrawerHidden(true);
    if (overlay) overlay.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  };

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      drawer && drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }

  if (overlay) overlay.addEventListener('click', closeDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeDrawer();
      if (hamburger) hamburger.focus();
    }
  });

  document.querySelectorAll('.drawer-lnk, .drawer-foot a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // 4. Défilement doux vers les ancres (instantané si mouvement réduit)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: targetPos, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }
    });
  });

  // 5. Apparition sobre au défilement (pages secondaires, .reveal-fade)
  const revealElements = document.querySelectorAll('.reveal-fade');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // 6. Onglets de spécifications techniques
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPanel = btn.getAttribute('data-tab');
      const container = btn.closest('.showcase-wrap') || document;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('act'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('act'));
      btn.classList.add('act');
      const panel = container.querySelector(`[data-panel="${targetPanel}"]`);
      if (panel) panel.classList.add('act');
    });
  });

  // 7. Filtre des projets (page Références)
  function bindProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-filter');
          filterButtons.forEach(b => b.classList.remove('act'));
          btn.classList.add('act');
          document.querySelectorAll('.real-card[data-cat]').forEach(card => {
            card.style.display = (filter === 'all' || card.getAttribute('data-cat') === filter) ? '' : 'none';
          });
        });
      });
    }
  }
  bindProjectFilters();

  // 8. Sélecteur rapide "Que cherchez-vous ?" (Home)
  const needChips = document.querySelectorAll('#qfNeedChips .qf-chip');
  const sectorChips = document.querySelectorAll('#qfSectorChips .qf-chip');
  const quoteModuleSelect = document.getElementById('quoteModule') || document.getElementById('moduleType');

  if (needChips.length > 0) {
    needChips.forEach(chip => {
      chip.addEventListener('click', () => {
        needChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');

        const val = chip.getAttribute('data-value');
        if (quoteModuleSelect && val) {
          Array.from(quoteModuleSelect.options).forEach(opt => {
            if (opt.value === val || opt.text.toLowerCase().includes(val.toLowerCase())) {
              quoteModuleSelect.value = opt.value;
            }
          });
        }
      });
    });
  }

  if (sectorChips.length > 0) {
    sectorChips.forEach(chip => {
      chip.addEventListener('click', () => {
        sectorChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
      });
    });
  }

  // 9. Synchronisation CMS temps réel avec api/index.php?route=public-data & Analytics
  function escHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  const currentPage = (window.location.pathname.split('/').pop() || 'index.html');

  function recordAnalyticsEvent(type, targetLabel) {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    fetch('api/index.php?route=analytics-beacon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, path: currentPage, target: targetLabel || '' })
    }).catch(() => {});
  }

  recordAnalyticsEvent('pageview', 'Visite : ' + currentPage);

  document.querySelectorAll('.h-hero__cta-btn, .btn-primary, .btn-green, .btn-coral, a[href*="wa.me"], a[href^="tel:"]').forEach(cta => {
    cta.addEventListener('click', () => {
      const label = (cta.textContent || cta.getAttribute('href') || 'CTA').trim().slice(0, 50);
      recordAnalyticsEvent('click', 'CTA : ' + label);
    }, { passive: true });
  });

  async function syncCmsFromServer() {
    try {
      const res = await fetch('api/index.php?route=public-data');
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.ok) return;

      const s = data.settings || {};

      // Coordonnées téléphoniques & WhatsApp
      if (s.whatsapp_number) {
        activeWaNumber = s.whatsapp_number.replace(/[^0-9]/g, '') || '2250707831791';
        document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
          const href = a.getAttribute('href') || '';
          const parts = href.split('?');
          a.setAttribute('href', `https://wa.me/${activeWaNumber}${parts[1] ? '?' + parts[1] : ''}`);
        });
      }
      if (s.phone_primary) {
        activePhoneDisplay = s.phone_primary;
        const cleanTel = '+' + s.phone_primary.replace(/[^0-9]/g, '');
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
          a.setAttribute('href', `tel:${cleanTel}`);
          if (a.textContent && /\+?\d{2,3}/.test(a.textContent)) {
            const icon = a.querySelector('i');
            if (icon) {
              a.innerHTML = '';
              a.appendChild(icon);
              a.appendChild(document.createTextNode(' ' + s.phone_primary));
            } else {
              a.textContent = s.phone_primary;
            }
          }
        });
        document.querySelectorAll('.c-phone-pill-box input[type="text"]').forEach(inp => {
          inp.value = s.phone_primary;
        });
      }
      if (s.email_contact) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          a.setAttribute('href', `mailto:${s.email_contact}`);
          if (a.textContent && a.textContent.includes('@')) {
            const icon = a.querySelector('i');
            if (icon) {
              a.innerHTML = '';
              a.appendChild(icon);
              a.appendChild(document.createTextNode(' ' + s.email_contact));
            } else {
              a.textContent = s.email_contact;
            }
          }
        });
      }
      if (s.lamano_design_url) {
        applyLamanoLink(s.lamano_design_url);
      }
      if (s.hero_cta_label) {
        const heroCtaSpan = document.querySelector('.h-hero__cta-btn span');
        if (heroCtaSpan) heroCtaSpan.textContent = s.hero_cta_label;
      }
      if (s.workshop_surface) {
        const trustNum = document.querySelector('.h-hero__trust-num');
        if (trustNum) trustNum.textContent = s.workshop_surface;
      }

      // Métadonnées SEO de la page active
      if (Array.isArray(data.seo)) {
        const pageSeo = data.seo.find(item => item.page_path === currentPage);
        if (pageSeo) {
          if (pageSeo.page_title) document.title = pageSeo.page_title;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && pageSeo.meta_description) {
            metaDesc.setAttribute('content', pageSeo.meta_description);
          }
        }
      }

      // Synchronisation des nouvelles réalisations ajoutées dans le CMS sur ets_references.html
      const realGrid = document.querySelector('.realisations-grid');
      if (realGrid && Array.isArray(data.projects) && data.projects.length > 0) {
        const existingTitles = Array.from(realGrid.querySelectorAll('.real-title')).map(el => el.textContent.trim().toLowerCase());
        data.projects.forEach(pr => {
          if (!existingTitles.includes((pr.title || '').trim().toLowerCase())) {
            const art = document.createElement('article');
            art.className = 'real-card is-in';
            art.setAttribute('data-cat', pr.category || 'bases-vie');
            art.innerHTML = `
              <div class="real-media">
                <img src="assets/images/${escHtml(pr.image_path)}" alt="${escHtml(pr.title)}" width="800" height="600" loading="lazy" onerror="this.src='assets/images/complexe-base-vie-plateforme.jpg'">
                <span class="real-loc"><i class="fa-solid fa-location-dot"></i> ${escHtml(pr.location || 'Côte d’Ivoire')}</span>
              </div>
              <div class="real-body">
                <span class="real-cat">${escHtml(pr.category || 'Réalisation')}</span>
                <h3 class="real-title">${escHtml(pr.title)}</h3>
                <p class="real-desc">${escHtml(pr.solution_text || pr.need_text || '')}</p>
              </div>
            `;
            realGrid.insertBefore(art, realGrid.firstChild);
          }
        });
      }
    } catch (_) {}
  }

  syncCmsFromServer();

  // 10. Enregistrement serveur d'une demande de devis (POST api/index.php?route=leads)
  async function submitLeadToCrm(payload) {
    let ref = 'ETS-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const record = Object.assign({
      reference: ref,
      status: 'Nouveau',
      website_url_hp: payload.website_url_hp || ''
    }, payload);

    try {
      const res = await fetch('api/index.php?route=leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        record.reference = data.reference || ref;
        record.serverSaved = true;
      } else {
        record.error = data?.error || null;
      }
    } catch (_) {}

    recordAnalyticsEvent('click', 'Soumission Devis CRM (' + record.reference + ')');
    return record;
  }

  // Injecte un champ honeypot anti-spam et une boîte de confirmation dans un formulaire s'ils n'y sont pas
  function ensureFormEnhancements(form, noticeId) {
    if (!form) return null;
    if (!form.querySelector('[name="website_url_hp"]')) {
      const hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'website_url_hp';
      hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.setAttribute('aria-hidden', 'true');
      hp.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;height:0;width:0;';
      form.appendChild(hp);
    }

    let notice = document.getElementById(noticeId);
    if (!notice) {
      notice = document.createElement('div');
      notice.id = noticeId;
      notice.className = 'form-phase-notice';
      notice.style.marginTop = '1.25rem';
      notice.innerHTML = `
        <h4><i class="fa-solid fa-circle-check" style="color: #25D366;"></i> <span class="notice-ref-title">Demande de devis enregistrée</span></h4>
        <p class="notice-ref-desc">
          Votre demande a bien été enregistrée par notre bureau d'études à Attinguié (PK 26). Un conseiller technique vous recontacte sous 24h. Pour accélérer l'étude, vous pouvez aussi transmettre ce dossier directement sur WhatsApp :
        </p>
        <a href="https://wa.me/${activeWaNumber}" class="btn btn-wa btn-direct-wa notice-wa-btn" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-whatsapp"></i>
          <span>Ouvrir et envoyer sur WhatsApp</span>
        </a>
      `;
      form.appendChild(notice);
    }
    return notice;
  }

  // 11. Formulaire de devis Accueil (#homeQuoteForm / #expressQuoteForm)
  const expressForm = document.getElementById('expressQuoteForm') || document.getElementById('homeQuoteForm');
  if (expressForm) {
    const homeNotice = ensureFormEnhancements(expressForm, 'homeFormNoticeBox');

    expressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!expressForm.checkValidity()) {
        expressForm.reportValidity();
        return;
      }

      const submitBtn = expressForm.querySelector('button[type="submit"]');
      const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enregistrement en cours...</span>';
      }

      const nom = expressForm.querySelector('#fullName')?.value || expressForm.querySelector('#quoteName')?.value || 'Client';
      const telephone = expressForm.querySelector('#phone')?.value || expressForm.querySelector('#quotePhone')?.value || '';
      const lieu = expressForm.querySelector('#location')?.value || expressForm.querySelector('#quoteLocation')?.value || 'Abidjan';
      const modSel = expressForm.querySelector('#moduleType') || expressForm.querySelector('#quoteModule');
      const moduleType = modSel ? (modSel.options[modSel.selectedIndex]?.text || modSel.value) : 'Bureau de chantier';
      const secSel = expressForm.querySelector('#sector');
      const sector = secSel ? (secSel.options[secSel.selectedIndex]?.text || secSel.value) : 'BTP / Entreprise';
      const message = expressForm.querySelector('#notes')?.value || expressForm.querySelector('#quoteMessage')?.value || 'Demande depuis la page d’accueil';
      const hpVal = expressForm.querySelector('[name="website_url_hp"]')?.value || '';

      const saved = await submitLeadToCrm({
        full_name: nom,
        company: sector,
        phone: telephone,
        location: lieu,
        product_type: moduleType,
        dimensions: '20 / 40 pieds',
        quantity: 1,
        timeline: 'Sous 2 semaines',
        message,
        source_page: 'index.html',
        website_url_hp: hpVal
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }

      const waText = encodeURIComponent(
        `Bonjour ETS AGBONOUGLA, je souhaite un devis (Réf ${saved.reference}) :\n` +
        `• Nom / Entreprise : ${nom}\n` +
        `• Téléphone : ${telephone}\n` +
        `• Secteur : ${sector}\n` +
        `• Type de module : ${moduleType}\n` +
        `• Lieu de livraison : ${lieu}\n` +
        (message ? `• Précisions : ${message}` : '')
      );
      const waUrl = `https://wa.me/${activeWaNumber}?text=${waText}`;

      if (homeNotice) {
        const titleEl = homeNotice.querySelector('.notice-ref-title') || homeNotice.querySelector('h4');
        if (titleEl) {
          titleEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #25D366;"></i> Demande enregistrée — Réf. ${escHtml(saved.reference)}`;
        }
        const waBtn = homeNotice.querySelector('.notice-wa-btn') || homeNotice.querySelector('a');
        if (waBtn) waBtn.href = waUrl;
        homeNotice.classList.add('show');
        homeNotice.style.display = 'block';
        homeNotice.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
    });
  }

  // 12. Formulaire de devis Page Contact (#projectForm / #devisForm)
  const quoteForm = document.getElementById('projectForm') || document.getElementById('devisForm');
  if (quoteForm) {
    ensureFormEnhancements(quoteForm, 'formNoticeBox');

    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enregistrement en cours...</span>';
      }

      const nom = quoteForm.querySelector('[name="nom"]')?.value || 'Client';
      const entreprise = quoteForm.querySelector('[name="entreprise"]')?.value || 'Professionnel';
      const telephone = quoteForm.querySelector('[name="telephone"]')?.value || '';
      const localisation = quoteForm.querySelector('[name="localisation"]')?.value || 'Abidjan';
      const typeSolution = quoteForm.querySelector('[name="type"]:checked')?.value || 'Bureau de chantier';
      const dimensions = quoteForm.querySelector('[name="dimensions"]')?.value || '20 pieds';
      const description = quoteForm.querySelector('[name="description"]')?.value || '';
      const hpVal = quoteForm.querySelector('[name="website_url_hp"]')?.value || '';

      const saved = await submitLeadToCrm({
        full_name: nom,
        company: entreprise,
        phone: telephone,
        location: localisation,
        product_type: typeSolution,
        dimensions,
        quantity: 1,
        timeline: 'Sous 2 semaines',
        message: description,
        source_page: 'ets_contact.html',
        website_url_hp: hpVal
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }

      const noticeBox = document.getElementById('formNoticeBox');
      const waButton = document.getElementById('waDirectSubmit');

      const waText = encodeURIComponent(
        `Bonjour ETS AGBONOUGLA, je souhaite un devis (Réf ${saved.reference}) :\n` +
        `• Nom : ${nom} (${entreprise})\n` +
        `• Téléphone : ${telephone}\n` +
        `• Localisation : ${localisation}\n` +
        `• Solution : ${typeSolution}\n` +
        `• Dimensions souhaitées : ${dimensions}\n` +
        `• Détails : ${description}`
      );

      if (noticeBox) {
        const h4 = noticeBox.querySelector('h4');
        if (h4) {
          h4.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #25D366;"></i> Demande enregistrée — Réf. ${escHtml(saved.reference)}`;
        }
        noticeBox.classList.add('show');
        noticeBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
      if (waButton) {
        waButton.href = `https://wa.me/${activeWaNumber}?text=${waText}`;
      }
    });
  }

});
