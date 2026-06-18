/* ============================================================
   WhoamiTwist — Portfolio JS
   ============================================================ */
(function () {
  "use strict";

  // This portfolio is motion-driven, so animations play even when the OS
  // "reduce motion" setting is on. Set FORCE_MOTION = false to honor it.
  const FORCE_MOTION = true;
  const prefersReduced = FORCE_MOTION ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Preloader (boot sequence) ---------- */
  function initPreloader() {
    const pre = $("#preloader");
    const log = $("#pl-log");
    const bar = $("#preloader-bar");
    const pct = $("#pl-pct");
    const statusEl = $("#pl-status");
    if (!pre) return;

    let done = false;
    function finish() {
      if (pre.classList.contains("is-done")) return;
      pre.classList.add("is-done");
      document.body.style.overflow = "";
      setTimeout(() => pre.remove(), 820);
    }

    if (prefersReduced || !log) { finish(); return; }
    document.body.style.overflow = "hidden";

    // Track the REAL page load — the boot script fills to ~90%, then the
    // loader holds until the browser actually finishes loading the page.
    let pageReady = document.readyState === "complete";
    if (!pageReady) addEventListener("load", () => { pageReady = true; }, { once: true });

    function line(html, cls) {
      const el = document.createElement("div");
      el.className = "pl-line" + (cls ? " " + cls : "");
      el.innerHTML = html;
      log.appendChild(el);
      return el;
    }
    function check(text) {
      line('<span class="pl-check">✓</span><span class="pl-sub">' + text + '</span>', "pl-subline");
    }

    const steps = [
      { cmd: "booting portfolio",   status: "booting",   ok: "core modules loaded" },
      { cmd: "securing connection", status: "securing",  ok: "tls 1.3 handshake" },
      { cmd: "rendering interface", status: "rendering", ok: "assets ready" },
    ];

    // Smooth tween of the bar + percentage toward `target`
    let progress = 0, target = 0;
    (function tick() {
      progress += (target - progress) * 0.14;
      if (Math.abs(target - progress) < 0.4) progress = target;
      const v = Math.round(progress);
      if (bar) bar.style.width = v + "%";
      if (pct) pct.textContent = v;
      if (!done || v < 100) requestAnimationFrame(tick);
    })();

    let idx = 0;
    function runStep() {
      if (idx >= steps.length) { finalize(); return; }

      const step = steps[idx];
      if (statusEl) statusEl.textContent = step.status;

      const row = line('<span class="pl-prompt">$</span><span class="pl-cmd"></span><span class="pl-typecaret"></span>');
      const cmdEl = row.querySelector(".pl-cmd");
      const caret = row.querySelector(".pl-typecaret");

      let c = 0;
      const typer = setInterval(() => {
        cmdEl.textContent = step.cmd.slice(0, ++c);
        if (c < step.cmd.length) return;
        clearInterval(typer);
        setTimeout(() => {
          if (caret) caret.remove();
          check(step.ok);
          idx++;
          target = Math.min(90, Math.round((idx / steps.length) * 90));
          setTimeout(runStep, 170);
        }, 220);
      }, 34);
    }

    function finalize() {
      if (statusEl) statusEl.textContent = "finalizing";
      (function waitReady() {
        if (!pageReady) {
          target = Math.min(target + 1, 96); // gently creep while assets load
          setTimeout(waitReady, 160);
          return;
        }
        target = 100;
        if (statusEl) statusEl.textContent = "ready";
        line('<span class="pl-prompt accent">➜</span><span class="pl-launch"> welcome.</span>', "pl-done");
        done = true;
        setTimeout(finish, 600);
      })();
    }

    runStep();

    // Hard fallback in case the load event never fires
    setTimeout(() => { pageReady = true; }, 11000);
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    const dot = $("#cursor-dot");
    const ring = $("#cursor-ring");
    if (!dot || !ring || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    // Hide the native OS cursor everywhere
    document.documentElement.classList.add("cursor-custom");

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let dx = mx, dy = my;

    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.classList.remove("is-hidden");
      ring.classList.remove("is-hidden");
    });

    // Smooth follow: dot tight, ring looser (trailing)
    (function loop() {
      dx += (mx - dx) * 0.35;
      dy += (my - dy) * 0.35;
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    // Press reaction
    addEventListener("mousedown", () => { ring.classList.add("is-down"); dot.classList.add("is-down"); });
    addEventListener("mouseup",   () => { ring.classList.remove("is-down"); dot.classList.remove("is-down"); });

    // Hide when leaving / returning to the window
    document.addEventListener("mouseleave", () => { dot.classList.add("is-hidden"); ring.classList.add("is-hidden"); });
    document.addEventListener("mouseenter", () => { dot.classList.remove("is-hidden"); ring.classList.remove("is-hidden"); });

    const hoverables = "a, button, .service, .project, .chip, .stat, input, textarea, .social, .sv-card, .filter, .float-chip";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) ring.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
    });
  }

  /* ---------- Particle background ---------- */
  function initParticles() {
    const canvas = $("#bg-canvas");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles, raf;
    const COUNT = Math.min(70, Math.floor(innerWidth / 22));

    function resize() {
      w = canvas.width = innerWidth * devicePixelRatio;
      h = canvas.height = innerHeight * devicePixelRatio;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
    }
    function make() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.4 * devicePixelRatio,
        r: (Math.random() * 1.6 + 0.6) * devicePixelRatio,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59,130,246,0.55)";
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          const max = 130 * devicePixelRatio;
          if (dist < max) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56,189,248,${0.16 * (1 - dist / max)})`;
            ctx.lineWidth = devicePixelRatio * 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    resize(); make(); draw();
    let t;
    addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { resize(); make(); }, 200); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    });
  }

  /* ---------- Nav ---------- */
  function initNav() {
    const nav = $("#nav");
    const toggle = $("#nav-toggle");
    const links = $("#nav-links");
    const backdrop = $("#nav-backdrop");

    addEventListener("scroll", () => {
      nav.classList.toggle("is-stuck", scrollY > 30);
    }, { passive: true });

    function setMenu(open) {
      links.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open);
      document.body.classList.toggle("nav-open", open);
      if (backdrop) {
        if (open) backdrop.hidden = false;
        requestAnimationFrame(() => backdrop && backdrop.classList.toggle("is-open", open));
        if (!open) setTimeout(() => { if (!links.classList.contains("is-open")) backdrop.hidden = true; }, 400);
      }
    }

    toggle.addEventListener("click", () => setMenu(!links.classList.contains("is-open")));
    const closeBtn = $("#nav-close");
    closeBtn && closeBtn.addEventListener("click", () => setMenu(false));
    backdrop && backdrop.addEventListener("click", () => setMenu(false));
    addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    $$(".nav__link, .nav__cta-mobile", links).forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );

    // Active section spy + gliding indicator
    const sections = $$("main section[id]");
    const navLinks = $$(".nav__link");
    const indicator = $("#nav-indicator");

    function moveIndicator(link) {
      if (!indicator || !link || getComputedStyle(indicator).display === "none") {
        indicator && indicator.classList.remove("is-active");
        return;
      }
      indicator.style.left = link.offsetLeft + "px";
      indicator.style.width = link.offsetWidth + "px";
      indicator.classList.add("is-active");
    }
    function activeLink() { return navLinks.find((l) => l.classList.contains("is-active")); }

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = en.target.id;
          navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
          moveIndicator(activeLink());
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));

    // Indicator follows hover, snaps back to active section on leave
    navLinks.forEach((l) => l.addEventListener("mouseenter", () => moveIndicator(l)));
    links.addEventListener("mouseleave", () => moveIndicator(activeLink()));
    addEventListener("resize", () => moveIndicator(activeLink()), { passive: true });
  }

  /* ---------- Scroll progress + to-top ---------- */
  function initScrollUI() {
    const prog = $("#scroll-progress");
    const top = $("#to-top");
    addEventListener("scroll", () => {
      const sc = document.documentElement.scrollHeight - innerHeight;
      const pct = sc > 0 ? (scrollY / sc) * 100 : 0;
      prog.style.width = pct + "%";
      top.classList.toggle("is-visible", scrollY > 600);
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (prefersReduced) { items.forEach((i) => i.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en, idx) => {
        if (en.isIntersecting) {
          const siblings = [...en.target.parentElement.children].filter(c => c.classList.contains("reveal"));
          const order = siblings.indexOf(en.target);
          en.target.style.transitionDelay = Math.min(order * 80, 320) + "ms";
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((i) => io.observe(i));
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    const nums = $$(".stat__num, .sv-stat-num");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || "";
        if (prefersReduced) { el.textContent = target + suffix; io.unobserve(el); return; }
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 60));
        const t = setInterval(() => {
          cur += step;
          if (cur >= target) { cur = target; clearInterval(t); }
          el.textContent = cur + suffix;
        }, 22);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  }

  /* ---------- Skill bars ---------- */
  function initSkills() {
    const fills = $$(".skill__fill");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const fill = en.target;
        const level = +fill.dataset.level;
        fill.style.width = level + "%";

        // count up the percentage label
        const pct = fill.closest(".skill")?.querySelector(".skill__pct");
        if (pct) {
          if (prefersReduced) {
            pct.textContent = level + "%";
          } else {
            let cur = 0;
            const step = level / 60;
            const t = setInterval(() => {
              cur = Math.min(cur + step, level);
              pct.textContent = Math.round(cur) + "%";
              if (cur >= level) clearInterval(t);
            }, 16);
          }
        }
        io.unobserve(fill);
      });
    }, { threshold: 0.5 });
    fills.forEach((f) => io.observe(f));
  }

  /* ---------- Skills section constellation ---------- */
  function initSkillsParticles() {
    const canvas = $("#skills-particles");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    let W, H, pts = [], raf;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    function make() {
      const count = Math.max(28, Math.min(55, Math.floor(W / 26)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 0.5,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6"; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    // Only animate while the section is on-screen (saves CPU)
    const section = $("#skills");
    const vis = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) { if (!raf) draw(); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0 });

    resize(); make();
    if (section) vis.observe(section); else draw();
    addEventListener("resize", () => { resize(); make(); }, { passive: true });
  }

  /* ---------- Services section constellation ---------- */
  function initServiceParticles() {
    const canvas = $("#sv-particles");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    let W, H, pts = [], raf;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    function make() {
      const count = Math.max(28, Math.min(55, Math.floor(W / 26)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 0.5,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6"; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    // Only animate while the section is on-screen (saves CPU)
    const section = $("#services");
    const vis = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) { if (!raf) draw(); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0 });

    resize(); make();
    if (section) vis.observe(section); else draw();
    addEventListener("resize", () => { resize(); make(); }, { passive: true });
  }

  /* ---------- Hero rotating role typewriter ---------- */
  function initTyping() {
    const el = $("#role-rotator");
    if (!el) return;

    const roles = [
      "Full-Stack Developer",
      "Security Researcher",
      "UI / UX Engineer",
      "Penetration Tester",
      "Ethical Hacker",
    ];

    // Reduced motion: just keep the first role static.
    if (prefersReduced) { el.textContent = roles[0]; return; }

    let r = 0;        // current role index
    let i = 0;        // current char count
    let deleting = false;

    function tick() {
      const word = roles[r];
      i += deleting ? -1 : 1;
      el.textContent = word.slice(0, i);

      let delay = deleting ? 45 : 80;          // typing vs deleting speed
      if (!deleting && i === word.length) {
        delay = 1600;                          // pause on full word
        deleting = true;
      } else if (deleting && i === 0) {
        deleting = false;

        r = (r + 1) % roles.length;            // next role
        delay = 350;
      }
      setTimeout(tick, delay);
    }

    el.textContent = "";
    setTimeout(tick, 600);
  }

  /* ---------- Project filters ---------- */
  function initFilters() {
    const btns = $$(".filter");
    const cards = $$(".project");
    btns.forEach((b) =>
      b.addEventListener("click", () => {
        btns.forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        const f = b.dataset.filter;
        cards.forEach((c, idx) => {
          const show = f === "all" || c.dataset.cat === f;
          c.classList.toggle("is-hidden", !show);
          if (show && !prefersReduced) {
            c.style.animation = "none";
            void c.offsetWidth;
            c.style.opacity = "0";
            c.style.transform = "translateY(20px)";
            requestAnimationFrame(() => {
              c.style.transition = "opacity .5s ease, transform .5s ease";
              c.style.transitionDelay = (idx * 50) + "ms";
              c.style.opacity = "1";
              c.style.transform = "none";
            });
          }
        });
      })
    );
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    const form = $("#contact-form");
    const status = $("#form-status");
    if (!form) return;

    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#name"), email = $("#email"), msg = $("#message");
      let ok = true;
      [name, email, msg].forEach((f) => f.classList.remove("is-invalid"));

      if (name.value.trim().length < 2) { name.classList.add("is-invalid"); ok = false; }
      if (!isEmail(email.value.trim())) { email.classList.add("is-invalid"); ok = false; }
      if (msg.value.trim().length < 10) { msg.classList.add("is-invalid"); ok = false; }

      if (!ok) {
        status.textContent = "✗ Please fix the highlighted fields.";
        status.className = "form-status err";
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "Sending…";
      status.textContent = "";
      status.className = "form-status";

      // Send via FormSubmit (no backend needed) -> delivers to twisthero15@gmail.com
      const data = new FormData(form);
      const category = ($("#ct-category")?.value || "General").trim();
      const subjVal = $("#subject")?.value.trim();
      data.append("_subject", `[${category}] ${subjVal || "New portfolio message"} ✦`);
      data.append("_template", "table");
      data.append("_captcha", "false");

      fetch("https://formsubmit.co/ajax/twisthero15@gmail.com", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: data,
      })
        .then(async (r) => {
          const res = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${res.message || r.statusText}`);
          return res;
        })
        .then((res) => {
          if (res && (res.success === "true" || res.success === true)) {
            form.reset();
            status.textContent = "✓ Message sent! I'll get back to you within 24 hours.";
            status.className = "form-status ok";
          } else {
            throw new Error(res && res.message ? res.message : "send failed");
          }
        })
        .catch((err) => {
          // Surface the real reason in the console for debugging (activation, CORS, network…)
          console.error("[contact form] send failed:", err);
          status.textContent = "✗ Couldn't send. Please email twisthero15@gmail.com directly.";
          status.className = "form-status err";
        })
        .finally(() => {
          btn.disabled = false;
          btn.innerHTML = original;
        });
    });
  }

  /* ---------- Lo-fi beat (Web Audio, royalty-free, generated) ---------- */
  function createBeat() {
    let ctx = null, master = null, timer = null, step = 0, playing = false;
    const BPM = 84;
    const stepDur = 60 / BPM / 2; // eighth notes

    function ensure() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0;
      // gentle low-pass for the lo-fi feel
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 2600; lp.Q.value = 0.5;
      master.connect(lp); lp.connect(ctx.destination);
    }

    function kick(t) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
    }
    function hat(t, open) {
      const bufSize = ctx.sampleRate * (open ? 0.18 : 0.05);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
      const g = ctx.createGain(); g.gain.value = open ? 0.18 : 0.28;
      src.connect(hp); hp.connect(g); g.connect(master); src.start(t);
    }
    function chord(t) {
      // soft dreamy pad — Am9 voicing
      const freqs = [220, 261.63, 329.63, 493.88];
      freqs.forEach((f) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.4);
        g.gain.linearRampToValueAtTime(0.0, t + 1.9);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 2);
      });
    }

    function schedule() {
      const t = ctx.currentTime + 0.05;
      const s = step % 16;
      if (s === 0 || s === 6 || s === 10) kick(t);        // boom-bap-ish
      hat(t, s % 4 === 2);                                 // off-beat open hat
      if (s === 0 || s === 8) chord(t);                    // pad every half-bar
      step++;
    }

    return {
      async start() {
        ensure();
        if (ctx.state === "suspended") await ctx.resume();
        if (playing) return;
        playing = true; step = 0;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 1.2);
        schedule();
        timer = setInterval(schedule, stepDur * 1000);
      },
      stop() {
        if (!playing) return;
        playing = false;
        clearInterval(timer); timer = null;
        if (master) {
          const now = ctx.currentTime;
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(master.gain.value, now);
          master.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        }
      },
    };
  }

  /* ---------- Video modal ---------- */
  function initVideoModal() {
    const modal = $("#video-modal");
    const player = $("#video-modal-player");
    if (!modal || !player) return;

    let lastFocus = null;
    let beat = null;
    let beatOn = false;

    function open(src, withBeat) {
      if (!src) return;
      lastFocus = document.activeElement;
      if (player.getAttribute("src") !== src) player.setAttribute("src", src);

      beatOn = !!withBeat;
      player.muted = beatOn;        // mute the video when running the beat
      modal.classList.toggle("has-beat", beatOn);

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      const p = player.play();
      if (p && p.catch) p.catch(() => {});

      if (beatOn) {
        if (!beat) beat = createBeat();
        beat.start();
      }
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      player.pause();
      if (beat && beatOn) beat.stop();
      beatOn = false;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // pause beat if the video is paused/ends; resume on play
    player.addEventListener("pause", () => { if (beat && beatOn) beat.stop(); });
    player.addEventListener("play", () => { if (beat && beatOn) beat.start(); });

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-video]");
      if (trigger) { e.preventDefault(); open(trigger.dataset.video, trigger.dataset.beat === "1"); return; }
      if (e.target.closest("[data-close]")) close();
    });

    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Tilt on cards (subtle) ---------- */
  function initTilt() {
    if (prefersReduced || window.matchMedia("(pointer: coarse)").matches) return;
    $$(".project, .service, .sv-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-8px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Command palette (⌘K / Ctrl+K) ---------- */
  function initCommandPalette() {
    const modal = $("#cmdk");
    const input = $("#cmdk-input");
    const list = $("#cmdk-list");
    const trigger = $("#cmdk-trigger");
    if (!modal || !input || !list) return;

    const go = (sel) => () => { close(); const t = $(sel); if (t) t.scrollIntoView({ behavior: "smooth" }); };
    const commands = [
      { icon: "ti-user", label: "Go to About", hint: "about", run: go("#about") },
      { icon: "ti-chart-bar", label: "Go to Skills", hint: "skills", run: go("#skills") },
      { icon: "ti-folder", label: "Go to Projects", hint: "projects", run: go("#projects") },
      { icon: "ti-briefcase", label: "Go to Services", hint: "services", run: go("#services") },
      { icon: "ti-certificate", label: "Go to Certifications", hint: "certs", run: go("#certs") },
      { icon: "ti-message-circle", label: "Go to Contact", hint: "contact", run: go("#contact") },
      { icon: "ti-arrow-up", label: "Back to top", hint: "hero", run: go("#hero") },
      { icon: "ti-copy", label: "Copy email address", hint: "twisthero15@gmail.com", run: () => {
          navigator.clipboard?.writeText("twisthero15@gmail.com").catch(() => {});
          close();
        } },
      { icon: "ti-download", label: "Download CV", hint: "résumé", run: () => {
          close();
          window.open("assets/cv.html", "_blank", "noopener");
        } },
      { icon: "ti-send", label: "Hire me — open contact form", hint: "let's talk", run: go("#contact") },
      { icon: "ti-brand-github", label: "Open GitHub", hint: "external", run: () => { window.open("https://github.com/", "_blank", "noopener"); close(); } },
    ];

    let filtered = commands.slice();
    let active = 0;

    function render() {
      list.innerHTML = "";
      if (!filtered.length) {
        list.innerHTML = '<li class="cmdk__empty">No matching commands</li>';
        return;
      }
      filtered.forEach((c, i) => {
        const li = document.createElement("li");
        li.className = "cmdk__item" + (i === active ? " is-active" : "");
        li.setAttribute("role", "option");
        li.innerHTML =
          `<span class="cmdk__item-icon"><i class="ti ${c.icon}"></i></span>` +
          `<span class="cmdk__item-label">${c.label}</span>` +
          `<span class="cmdk__item-hint">${c.hint}</span>`;
        li.addEventListener("click", () => c.run());
        li.addEventListener("mousemove", () => { active = i; paint(); });
        list.appendChild(li);
      });
    }
    function paint() {
      [...list.children].forEach((el, i) => el.classList?.toggle("is-active", i === active));
    }
    function filter() {
      const q = input.value.trim().toLowerCase();
      filtered = commands.filter((c) => (c.label + " " + c.hint).toLowerCase().includes(q));
      active = 0; render();
    }
    function open() {
      modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
      input.value = ""; filter(); setTimeout(() => input.focus(), 30);
    }
    function close() {
      modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true");
    }

    addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); modal.classList.contains("is-open") ? close() : open();
      } else if (modal.classList.contains("is-open")) {
        if (e.key === "Escape") { close(); }
        else if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); paint(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); paint(); }
        else if (e.key === "Enter") { e.preventDefault(); filtered[active]?.run(); }
      }
    });
    input.addEventListener("input", filter);
    trigger?.addEventListener("click", open);
    $$("[data-cmdk-close]", modal).forEach((el) => el.addEventListener("click", close));
    render();
  }

  /* ---------- Live About terminal ---------- */
  function initTerminal() {
    const form = $("#terminal-form");
    const input = $("#terminal-input");
    const output = $("#terminal-output");
    const body = $("#terminal-body");
    if (!form || !input || !output) return;

    const history = [];
    let hi = -1;

    const print = (html, cls) => {
      const p = document.createElement("p");
      if (cls) p.className = cls;
      p.innerHTML = html;
      output.appendChild(p);
    };
    const scroll = () => { body.scrollTop = body.scrollHeight; };

    const commands = {
      help: () => print(
        "Available commands:<br>" +
        "&nbsp;&nbsp;<b>whoami</b>   – who is this<br>" +
        "&nbsp;&nbsp;<b>skills</b>   – tech stack<br>" +
        "&nbsp;&nbsp;<b>projects</b> – jump to work<br>" +
        "&nbsp;&nbsp;<b>services</b> – what I offer<br>" +
        "&nbsp;&nbsp;<b>contact</b>  – get in touch<br>" +
        "&nbsp;&nbsp;<b>social</b>   – find me online<br>" +
        "&nbsp;&nbsp;<b>banner</b>   – the logo<br>" +
        "&nbsp;&nbsp;<b>sudo hire-me</b> – ;)<br>" +
        "&nbsp;&nbsp;<b>clear</b>    – clear the screen", "t-out"),
      whoami: () => print("WhoamiTwist — Full-Stack Developer, UI/UX Designer & Ethical Hacker. Builder by day, breaker by night.", "t-out"),
      skills: () => print("→ React · Next.js · TypeScript · Node · Python<br>→ Figma · Design Systems<br>→ Burp · Metasploit · Nmap · OSINT · Linux", "t-out"),
      projects: () => { print("Opening projects…", "t-out"); setTimeout(() => $("#projects")?.scrollIntoView({ behavior: "smooth" }), 350); },
      services: () => { print("Opening services…", "t-out"); setTimeout(() => $("#services")?.scrollIntoView({ behavior: "smooth" }), 350); },
      contact: () => { print("Routing you to the contact form…", "t-out"); setTimeout(() => $("#contact")?.scrollIntoView({ behavior: "smooth" }), 350); },
      social: () => print("GitHub · LinkedIn · X · Telegram · Discord — links are in the hero & footer.", "t-out"),
      banner: () => print("<span class='t-glow'>██╗    ██╗████████╗  WhoamiTwist</span><br><span class='t-glow'>╚██╗ ██╔╝╚══██╔══╝  build · secure · ship</span>", "t-out"),
      "sudo hire-me": () => print("[sudo] access granted ✓ — scroll to Contact and let's talk. The smart move. 🚀", "t-glow"),
      clear: () => { output.innerHTML = ""; },
      ls: () => print("about.md  skills.json  projects/  services/  contact.sh", "t-out"),
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;
      history.unshift(raw); hi = -1;
      print(`<span class="t-prompt">$</span> <span class="t-cmd">${raw.replace(/</g, "&lt;")}</span>`);
      const cmd = raw.toLowerCase();
      const fn = commands[cmd];
      if (fn) fn();
      else print(`command not found: ${raw.replace(/</g, "&lt;")} — type <b>help</b>`, "t-err");
      input.value = "";
      form.classList.remove("is-typing");
      scroll();
    });

    input.addEventListener("input", () => form.classList.toggle("is-typing", input.value.length > 0));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); if (hi < history.length - 1) input.value = history[++hi]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (hi > 0) input.value = history[--hi]; else { hi = -1; input.value = ""; } }
    });
    // Clicking anywhere in the terminal focuses the prompt
    body.addEventListener("click", () => input.focus());
  }

  /* ---------- Magnetic micro-interactions ---------- */
  function initMagnetic() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    // Buttons pull toward the cursor
    $$(".btn, .sv-hire-btn, .ct-send-btn, .cmdk-trigger").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    // Hero language chips drift away from the cursor
    const chips = $$(".float-chip");
    if (chips.length) {
      const hero = $("#hero");
      hero?.addEventListener("mousemove", (e) => {
        chips.forEach((chip) => {
          const r = chip.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const dx = cx - e.clientX, dy = cy - e.clientY;
          const dist = Math.hypot(dx, dy);
          if (dist < 160) {
            const push = (160 - dist) / 160;
            chip.style.setProperty("--px", `${(dx / dist) * push * 26}px`);
            chip.style.setProperty("--py", `${(dy / dist) * push * 26}px`);
          } else {
            chip.style.setProperty("--px", "0px");
            chip.style.setProperty("--py", "0px");
          }
        });
      });
      hero?.addEventListener("mouseleave", () => {
        chips.forEach((c) => { c.style.setProperty("--px", "0px"); c.style.setProperty("--py", "0px"); });
      });
    }
  }

  /* ---------- Contact compose UI (category toggle + char counter) ---------- */
  function initComposeUI() {
    const toggle = $("#ct-cat-toggle");
    const hidden = $("#ct-category");
    if (toggle && hidden) {
      const btns = $$(".ct-cat-btn", toggle);
      btns.forEach((b) => {
        b.addEventListener("click", () => {
          btns.forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-checked", "false"); });
          b.classList.add("is-active");
          b.setAttribute("aria-checked", "true");
          hidden.value = b.dataset.cat;
        });
      });
    }

    const msg = $("#message");
    const count = $("#ct-count");
    if (msg && count) {
      const update = () => { count.textContent = msg.value.length; };
      msg.addEventListener("input", update);
      update();
    }

    // Discord — copy username to clipboard (usernames aren't directly linkable)
    const discord = $("#ct-discord");
    if (discord) {
      const label = $(".ct-channel-copy", discord);
      discord.addEventListener("click", async () => {
        const handle = discord.dataset.copy || "";
        try {
          await navigator.clipboard.writeText(handle);
        } catch {
          // Fallback for older / insecure-context browsers
          const t = document.createElement("textarea");
          t.value = handle; t.style.position = "fixed"; t.style.opacity = "0";
          document.body.appendChild(t); t.select();
          try { document.execCommand("copy"); } catch {}
          t.remove();
        }
        discord.classList.add("is-copied");
        if (label) label.textContent = "copied!";
        setTimeout(() => {
          discord.classList.remove("is-copied");
          if (label) label.textContent = "copy";
        }, 1600);
      });
    }

    // WhatsApp — keep the wa.me link prefilled with whatever's typed, in real time
    const wa = $("#ct-wa-send");
    if (wa) {
      const PHONE = "233256238978";
      const buildLink = () => {
        const cat = ($("#ct-category")?.value || "General").trim();
        const name = $("#name")?.value.trim();
        const subject = $("#subject")?.value.trim();
        const body = $("#message")?.value.trim();
        const lines = [`[${cat}] message from your portfolio`];
        if (name) lines.push(`From: ${name}`);
        if (subject) lines.push(`Subject: ${subject}`);
        if (body) lines.push("", body);
        const text = encodeURIComponent(lines.join("\n"));
        wa.href = `https://wa.me/${PHONE}?text=${text}`;
      };
      ["#name", "#email", "#subject", "#message"].forEach((sel) => {
        $(sel)?.addEventListener("input", buildLink);
      });
      $$(".ct-cat-btn", toggle || document).forEach((b) => b.addEventListener("click", buildLink));
      buildLink();
    }
  }

  /* ---------- Certifications (staggered reveal + progress) ---------- */
  function initCerts() {
    const grid = $("#certs-grid");
    if (!grid) return;
    const cards = $$(".cert-card", grid);

    if (prefersReduced || !("IntersectionObserver" in window)) {
      cards.forEach((c) => c.classList.add("is-in"));
    } else {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const delay = parseInt(e.target.dataset.delay || "0", 10);
          setTimeout(() => e.target.classList.add("is-in"), delay * 90);
          obs.unobserve(e.target);
        });
      }, { threshold: 0.15 });
      cards.forEach((c) => obs.observe(c));
    }

    initCertParticles();
  }

  function initCertParticles() {
    const cvs = $("#cert-particles");
    if (!cvs || prefersReduced) return;
    const ctx = cvs.getContext("2d");
    let W = 0, H = 0, pts = [];

    function resize() { W = cvs.width = cvs.offsetWidth; H = cvs.height = cvs.offsetHeight; }
    function make() {
      pts = [];
      for (let i = 0; i < 45; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.3 + 0.3,
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#3b82f6";
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${0.1 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    resize(); make(); draw();
    window.addEventListener("resize", () => { resize(); make(); });
  }

  /* ---------- Reviews carousel ---------- */
  function initReviews() {
    const track = $("#rv-track");
    const viewport = $("#rv-viewport");
    if (!track || !viewport) return;

    const cards = $$(".rv-card", track);
    const dotsEl = $("#rv-dots");
    const TOTAL = cards.length;
    if (!TOTAL) return;

    let cur = 0, paused = false, timer = null;
    const GAP = 24;

    // Build dots
    cards.forEach((_, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "rv-dot" + (i === 0 ? " is-active" : "");
      d.setAttribute("role", "tab");
      d.setAttribute("aria-label", `Go to review ${i + 1}`);
      d.addEventListener("click", () => { goTo(i); resetAuto(); });
      dotsEl.appendChild(d);
    });
    const dots = $$(".rv-dot", dotsEl);

    function update() {
      const cw = cards[0].offsetWidth + GAP;
      const vw = viewport.offsetWidth;
      const maxOff = Math.max(0, TOTAL * cw - GAP - vw);
      // Center the current card in the viewport, then clamp to the track bounds
      let off = cur * cw - (vw / 2 - cards[0].offsetWidth / 2);
      off = Math.max(0, Math.min(off, maxOff));
      track.style.transform = `translateX(${-off}px)`;
      dots.forEach((d, i) => d.classList.toggle("is-active", i === cur));
      cards.forEach((c, i) => c.classList.toggle("is-active", i === cur));
    }

    function goTo(n) { cur = Math.max(0, Math.min(n, TOTAL - 1)); update(); }
    function next() { cur = (cur + 1) % TOTAL; update(); }
    function prev() { cur = (cur - 1 + TOTAL) % TOTAL; update(); }

    function resetAuto() {
      clearInterval(timer);
      if (prefersReduced) return;
      timer = setInterval(() => { if (!paused) next(); }, 4200);
    }

    $("#rv-next")?.addEventListener("click", () => { next(); resetAuto(); });
    $("#rv-prev")?.addEventListener("click", () => { prev(); resetAuto(); });

    viewport.addEventListener("mouseenter", () => { paused = true; });
    viewport.addEventListener("mouseleave", () => { paused = false; });

    // Touch swipe
    let sx = 0;
    viewport.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); resetAuto(); }
    }, { passive: true });

    update();
    resetAuto();
    window.addEventListener("resize", update);

    initReviewParticles();
  }

  function initReviewParticles() {
    const cvs = $("#rv-particles");
    if (!cvs || prefersReduced) return;
    const ctx = cvs.getContext("2d");
    let W = 0, H = 0, ps = [];

    function resize() { W = cvs.width = cvs.offsetWidth; H = cvs.height = cvs.offsetHeight; }
    function make() {
      ps = [];
      for (let i = 0; i < 40; i++) {
        ps.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
          r: Math.random() * 1.2 + 0.3,
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#3b82f6";
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    resize(); make(); draw();
    window.addEventListener("resize", () => { resize(); make(); });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initCursor();
    initParticles();
    initNav();
    initScrollUI();
    initReveal();
    initCounters();
    initSkills();
    initSkillsParticles();
    initServiceParticles();
    initTyping();
    initFilters();
    initForm();
    initVideoModal();
    initYear();
    initTilt();
    initCommandPalette();
    initTerminal();
    initMagnetic();
    initReviews();
    initComposeUI();
    initCerts();
  });
})();
