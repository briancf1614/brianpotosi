/* ==========================================================================
   Brian Potosi — CV / Portfolio behaviour (vanilla JS, no dependencies)
   Modules:
     1. Shared helpers (reduced-motion, DOM)
     2. Hero canvas: subtle constellation particle field
     3. Typewriter role rotation
     4. Sticky header state + mobile navigation
     5. Active-section highlighting (IntersectionObserver)
     6. Scroll-reveal animations (IntersectionObserver)
     7. Footer year
   ========================================================================== */

(() => {
  "use strict";

  /* 1. Shared helpers
     ---------------------------------------------------------------------- */
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => motionQuery.matches;

  /* 2. Hero canvas: constellation particles
     ---------------------------------------------------------------------- */
  const initHeroCanvas = () => {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    const MAX_PARTICLES = 90;
    const LINK_DISTANCE = 130;

    let particles = [];
    let rafId = null;
    let heroVisible = true;
    let running = false;
    let lastTime = 0;

    const rand = (min, max) => Math.random() * (max - min) + min;

    // Violet <-> cyan blend for a given t in [0, 1]
    const particleColor = (t, alpha) => {
      const r = Math.round(139 + (34 - 139) * t);
      const g = Math.round(92 + (211 - 92) * t);
      const b = Math.round(246 + (238 - 246) * t);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const createParticles = (width, height) => {
      const count = Math.min(MAX_PARTICLES, Math.floor((width * height) / 16000));
      particles = Array.from({ length: count }, () => {
        const t = Math.random();
        const speed = rand(0.02, 0.07);
        const angle = rand(0, Math.PI * 2);
        return {
          x: rand(0, width),
          y: rand(0, height),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: rand(1, 2.4),
          t,
        };
      });
    };

    const resize = () => {
      // Cap the pixel ratio to keep fill-rate cheap on HiDPI screens
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = hero;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles(w, h);
    };

    const draw = (delta) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);

      // Move particles and wrap around the edges
      for (const p of particles) {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      // Constellation lines between close particles
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * 0.35;
            ctx.strokeStyle = particleColor((a.t + b.t) / 2, alpha);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Dots on top of the lines
      for (const p of particles) {
        ctx.fillStyle = particleColor(p.t, 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time) => {
      if (!running) return;
      const delta = Math.min(time - lastTime, 50); // clamp after tab switches
      lastTime = time;
      draw(delta);
      rafId = requestAnimationFrame(loop);
    };

    // Start the loop only when the hero is on screen and the tab is visible
    const syncLoop = () => {
      const shouldRun = heroVisible && !document.hidden && !prefersReducedMotion();
      if (shouldRun && !running) {
        running = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
    };

    resize();

    if (prefersReducedMotion()) {
      // Static single frame: draw once, no animation loop
      draw(0);
    } else {
      syncLoop();

      // Re-render the static frame on resize; the loop keeps drawing live anyway
      let resizeTimer = null;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resize();
          if (!running) draw(0);
        }, 150);
      });

      // Pause when the hero scrolls out of view
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => {
            heroVisible = entries[0].isIntersecting;
            syncLoop();
          },
          { threshold: 0 }
        ).observe(hero);
      }

      document.addEventListener("visibilitychange", syncLoop);
      motionQuery.addEventListener("change", () => {
        syncLoop();
        if (prefersReducedMotion()) draw(0);
      });
    }
  };

  /* 3. Typewriter role rotation
     ---------------------------------------------------------------------- */
  const initTypewriter = () => {
    const el = document.getElementById("typewriter");
    if (!el) return;

    let roles = [];
    try {
      roles = JSON.parse(el.dataset.roles || "[]").filter(Boolean);
    } catch {
      roles = [];
    }
    if (!roles.length) return;

    if (prefersReducedMotion()) {
      // No typing animation: show the first role and stop
      el.textContent = roles[0];
      return;
    }

    const TYPE_MS = 70;
    const ERASE_MS = 40;
    const HOLD_MS = 2200;
    const PAUSE_MS = 500;

    let roleIndex = 0;
    let charIndex = roles[0].length;
    let timer = null;

    const step = () => {
      const current = roles[roleIndex];

      if (charIndex < current.length) {
        // Typing phase
        charIndex += 1;
        el.textContent = current.slice(0, charIndex);
        timer = setTimeout(step, TYPE_MS);
      } else if (charIndex === current.length && roleIndex === roles.length - 1 && el.dataset.done !== "1") {
        // Finished the full first cycle; keep looping from the start
        el.dataset.done = "1";
        timer = setTimeout(step, HOLD_MS);
      } else if (charIndex > 0) {
        // Hold, then erase
        if (el.dataset.hold !== "1") {
          el.dataset.hold = "1";
          timer = setTimeout(step, HOLD_MS);
          return;
        }
        charIndex -= 1;
        el.textContent = current.slice(0, charIndex);
        timer = setTimeout(step, ERASE_MS);
      } else {
        // Move to the next role
        el.dataset.hold = "";
        roleIndex = (roleIndex + 1) % roles.length;
        charIndex = 0;
        timer = setTimeout(step, PAUSE_MS);
      }
    };

    timer = setTimeout(step, HOLD_MS);

    // Be a good citizen: stop the timers if the user enables reduced motion
    motionQuery.addEventListener("change", () => {
      if (prefersReducedMotion()) {
        clearTimeout(timer);
        el.textContent = roles[0];
      }
    });
  };

  /* 4. Sticky header state + mobile navigation
     ---------------------------------------------------------------------- */
  const initNavigation = () => {
    const header = document.getElementById("testata");
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("site-nav");

    // Subtle border/shadow once the page is scrolled
    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !nav) return;

    const setMenu = (open) => {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    const isOpen = () => document.body.classList.contains("nav-open");

    toggle.addEventListener("click", () => setMenu(!isOpen()));

    // Close when a menu link is chosen
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    // Close on Escape and give focus back to the toggle button
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Close when clicking/tapping outside the header
    document.addEventListener("pointerdown", (event) => {
      if (isOpen() && !event.target.closest(".site-header")) setMenu(false);
    });

    // Keep Tab focus inside the open mobile panel (only relevant below desktop)
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || !isOpen()) return;
      if (window.matchMedia("(min-width: 860px)").matches) return;

      const focusables = nav.querySelectorAll("a, button");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        toggle.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        toggle.focus();
      }
    });
  };

  /* 5. Active-section highlighting
     ---------------------------------------------------------------------- */
  const initActiveSection = () => {
    const links = document.querySelectorAll(".nav-link[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    const linkById = new Map();
    links.forEach((link) => linkById.set(link.getAttribute("href").slice(1), link));

    const sections = Array.from(linkById.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const clearActive = () => {
      links.forEach((link) => {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      });
    };

    // A section becomes active while its band crosses the upper-middle of the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          clearActive();
          const link = linkById.get(entry.target.id);
          if (link) {
            link.classList.add("active");
            link.setAttribute("aria-current", "true");
          }
        });
      },
      // Top bias: the section around 35% viewport height wins
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  };

  /* 6. Scroll-reveal animations
     ---------------------------------------------------------------------- */
  const initReveal = () => {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // reveal once, then leave it alone
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((item) => observer.observe(item));
  };

  /* 7. Footer year
     ---------------------------------------------------------------------- */
  const initFooterYear = () => {
    const year = document.getElementById("anno");
    if (year) year.textContent = String(new Date().getFullYear());
  };

  /* Boot
     ---------------------------------------------------------------------- */
  const boot = () => {
    initHeroCanvas();
    initTypewriter();
    initNavigation();
    initActiveSection();
    initReveal();
    initFooterYear();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
