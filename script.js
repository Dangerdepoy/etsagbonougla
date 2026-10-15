/**
 * ETS AGBONOUGLA — Scripts Publics Front-End
 * Architecture Modulaire & Conteneurs Industriels — Abidjan, Côte d'Ivoire
 * Design & développement par LAMANO DESIGN
 */

// ── CONFIGURATION DU PROJET ─────────────────────────────────────
// URL du portfolio LAMANO DESIGN : À RENSEIGNER (adresse vérifiée uniquement).
// Tant qu'elle est vide, la signature s'affiche en texte simple, sans lien.
const LAMANO_DESIGN_URL = '';

// Signale au script inline du <head> que le moteur d'animation est chargé
// (sinon la classe .motion est retirée pour garantir un contenu visible).
window.__etsMotionReady = true;

document.addEventListener('DOMContentLoaded', () => {

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Active le mode motion sur toutes les pages automatiquement
  if (!reduceMotion && 'IntersectionObserver' in window) {
    root.classList.add('motion');
  } else {
    root.classList.remove('motion');
  }
  const motionOn = !reduceMotion && 'IntersectionObserver' in window;

  // 1. Signature LAMANO DESIGN (lien uniquement si une URL vérifiée est configurée)
  document.querySelectorAll('.lamano-credit').forEach(link => {
    if (LAMANO_DESIGN_URL) {
      link.setAttribute('href', LAMANO_DESIGN_URL);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    } else {
      link.removeAttribute('href');
      link.removeAttribute('target');
    }
  });

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
    // Titres : chaque mot monte depuis un masque
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

    // Révélations à l'entrée dans le viewport (une seule fois)
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));

    // Manifeste : les mots passent du gris au noir pur (#000000) mot par mot au scroll (effet de lecture au doigt)
    const manifestos = new Map();
    document.querySelectorAll('[data-words]').forEach(el => {
      const words = splitWords(el, (txt) => {
        const s = document.createElement('span');
        s.className = 'mw';
        s.textContent = txt;
        return s;
      });
      manifestos.set(el, words);

      // Interaction au passage du curseur / doigt sur la phrase
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

    // Progression au scroll : --p (0..1) sur [data-scroll] + lecture mot par mot sur [data-words]
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
      });

      // Lecture fluide mot par mot : dès que le texte entre dans la zone de lecture (85% -> 28% du viewport)
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

  // 2. Barre de navigation au scroll & transition dynamique Hero transparent -> Pill blanche
  const navbar = document.getElementById('appNavbar');
  const heroPillNav = document.getElementById('heroPillNav');
  const heroSection = document.querySelector('.h-hero');

  if (heroPillNav && heroSection) {
    const updateHeroNav = () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      // Dès que le bas du hero quitte le viewport (seuil 80px), on bascule vers la pilule blanche
      if (heroBottom <= 80) {
        if (!heroPillNav.classList.contains('is-hero-scrolled')) {
          heroPillNav.classList.add('is-hero-scrolled');
          heroPillNav.classList.remove('is-hero-transparent');
        }
      } else {
        if (!heroPillNav.classList.contains('is-hero-transparent')) {
          heroPillNav.classList.remove('is-hero-scrolled');
          heroPillNav.classList.add('is-hero-transparent');
        }
      }
      document.body.classList.toggle('is-scrolled', window.scrollY > 420);
    };
    window.addEventListener('scroll', updateHeroNav, { passive: true });
    updateHeroNav();
  } else if (navbar) {
    const handleScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
      document.body.classList.toggle('is-scrolled', window.scrollY > 420);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 3. Menu Mobile (drawer : inert quand fermé, focus, Escape)
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
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.real-card[data-cat]');
  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        filterButtons.forEach(b => b.classList.remove('act'));
        btn.classList.add('act');
        projectCards.forEach(card => {
          card.style.display = (filter === 'all' || card.getAttribute('data-cat') === filter) ? '' : 'none';
        });
      });
    });
  }

  // 8. Sélecteur rapide "Que cherchez-vous ?" (Home)
  const needChips = document.querySelectorAll('#qfNeedChips .qf-chip');
  const sectorChips = document.querySelectorAll('#qfSectorChips .qf-chip');
  const quoteModuleSelect = document.getElementById('quoteModule');

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
            if (opt.value === val || opt.text.includes(val)) {
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

  // 9. Synchronisation CMS & Analytics respectueux de la vie privée (DoNotTrack respecté)
  const CMS_KEY = 'ets_cms_store_v1';
  const LEADS_KEY = 'ets_crm_leads_v1';
  const ANALYTICS_KEY = 'ets_analytics_v1';

  function recordAnalyticsEvent(type, targetLabel) {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    const pagePath = (window.location.pathname.split('/').pop() || 'index.html');
    const ev = {
      id: Date.now(),
      type,
      page_path: pagePath,
      target: targetLabel || pagePath,
      created_at: new Date().toLocaleTimeString('fr-FR')
    };
    try {
      const list = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
      list.unshift(ev);
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(list.slice(0, 200)));
    } catch (_) {}

    const apiBase = window.location.protocol.startsWith('http') ? 'api/index.php' : 'http://127.0.0.1:8080/api/index.php';
    fetch(`${apiBase}?route=analytics-beacon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, path: pagePath, target: targetLabel || '' })
    }).catch(() => {});
  }

  recordAnalyticsEvent('pageview', 'Visite : ' + (window.location.pathname.split('/').pop() || 'index.html'));

  document.querySelectorAll('.h-hero__cta-btn, .btn-primary, a[href*="wa.me"], a[href^="tel:"]').forEach(cta => {
    cta.addEventListener('click', () => {
      const label = (cta.textContent || cta.getAttribute('href') || 'CTA').trim().slice(0, 50);
      recordAnalyticsEvent('click', 'CTA : ' + label);
    }, { passive: true });
  });

  // Application dynamique des réglages publiés depuis l'interface Admin CMS
  try {
    const rawCms = localStorage.getItem(CMS_KEY);
    if (rawCms) {
      const cmsData = JSON.parse(rawCms);
      const s = cmsData?.settings || {};
      if (s.hero_bg_word) {
        const megaWord = document.querySelector('.h-hero__mega-word');
        if (megaWord) megaWord.textContent = s.hero_bg_word;
      }
      if (s.hero_callout_title) {
        const calloutTitle = document.querySelector('.h-hero__callout-title');
        if (calloutTitle) calloutTitle.textContent = s.hero_callout_title;
      }
      if (s.lamano_design_url && s.lamano_design_url !== '#') {
        document.querySelectorAll('[data-lamano-link], .lamano-link').forEach(a => {
          a.href = s.lamano_design_url;
        });
      }
    }
  } catch (_) {}

  async function submitLeadToCrm(payload) {
    const ref = 'ETS-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const record = Object.assign({
      id: Date.now(),
      reference: ref,
      status: 'Nouveau',
      assigned_to: 'Direction Commerciale',
      created_at: new Date().toLocaleString('fr-FR'),
      notes: []
    }, payload);

    try {
      const existing = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
      existing.unshift(record);
      localStorage.setItem(LEADS_KEY, JSON.stringify(existing));
    } catch (_) {}

    const apiBase = window.location.protocol.startsWith('http') ? 'api/index.php' : 'http://127.0.0.1:8080/api/index.php';
    try {
      const res = await fetch(`${apiBase}?route=leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.reference) record.reference = data.reference;
      }
    } catch (_) {}

    recordAnalyticsEvent('click', 'Soumission Devis CRM (' + record.reference + ')');
    return record;
  }

  // 10. Formulaire de devis Express & Home (.h-final) connecté au CRM
  const expressForm = document.getElementById('expressQuoteForm') || document.getElementById('homeQuoteForm');
  if (expressForm) {
    expressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!expressForm.checkValidity()) {
        expressForm.reportValidity();
        return;
      }

      const nom = expressForm.querySelector('#fullName')?.value || expressForm.querySelector('#quoteName')?.value || 'Client';
      const telephone = expressForm.querySelector('#phone')?.value || expressForm.querySelector('#quotePhone')?.value || '';
      const lieu = expressForm.querySelector('#location')?.value || expressForm.querySelector('#quoteLocation')?.value || 'Abidjan';
      const moduleType = expressForm.querySelector('#moduleType')?.value || expressForm.querySelector('#quoteModule')?.value || 'Bureau de chantier';
      const sector = expressForm.querySelector('#sector')?.value || 'BTP / Entreprise';
      const message = expressForm.querySelector('#notes')?.value || expressForm.querySelector('#quoteMessage')?.value || 'Demande depuis la page d’accueil';

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
        source_page: 'index.html'
      });

      const waText = encodeURIComponent(
        `Bonjour ETS AGBONOUGLA, je souhaite un devis (Réf CRM ${saved.reference}) :\n` +
        `• Nom / Entreprise : ${nom}\n` +
        `• Téléphone : ${telephone}\n` +
        `• Secteur : ${sector}\n` +
        `• Type de module : ${moduleType}\n` +
        `• Lieu de livraison : ${lieu}\n` +
        (message ? `• Précisions : ${message}` : '')
      );

      window.open(`https://wa.me/2250707683868?text=${waText}`, '_blank', 'noopener,noreferrer');
    });
  }

  // 11. Formulaire de devis (Pages secondaires) connecté au CRM
  const quoteForm = document.getElementById('projectForm') || document.getElementById('devisForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      const nom = quoteForm.querySelector('[name="nom"]')?.value || 'Client';
      const telephone = quoteForm.querySelector('[name="telephone"]')?.value || '';
      const localisation = quoteForm.querySelector('[name="localisation"]')?.value || 'Abidjan';
      const typeSolution = quoteForm.querySelector('[name="type"]:checked')?.value || 'Bureau de chantier';
      const dimensions = quoteForm.querySelector('[name="dimensions"]')?.value || '20 pieds';
      const description = quoteForm.querySelector('[name="description"]')?.value || '';

      const saved = await submitLeadToCrm({
        full_name: nom,
        company: 'Professionnel',
        phone: telephone,
        location: localisation,
        product_type: typeSolution,
        dimensions,
        quantity: 1,
        timeline: 'Sous 2 semaines',
        message: description,
        source_page: 'ets_contact.html'
      });

      const noticeBox = document.getElementById('formNoticeBox');
      const waButton = document.getElementById('waDirectSubmit');

      const waText = encodeURIComponent(
        `Bonjour ETS AGBONOUGLA, je souhaite un devis (Réf CRM ${saved.reference}) :\n` +
        `- Nom : ${nom}\n` +
        `- Téléphone : ${telephone}\n` +
        `- Localisation : ${localisation}\n` +
        `- Solution : ${typeSolution}\n` +
        `- Dimensions souhaitées : ${dimensions}\n` +
        `- Détails : ${description}`
      );

      if (noticeBox) {
        noticeBox.classList.add('show');
        noticeBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
      if (waButton) {
        waButton.href = `https://wa.me/2250707683868?text=${waText}`;
      }
    });
  }

});
