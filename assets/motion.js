// Noble Life SG prototype v5: motion (GSAP + ScrollTrigger, three.js for the 01 story).
// Scrolling is never captured or smoothed. Everything is readable without this file.
// Phones and "reduce motion" get calm versions; the story falls back to CSS without WebGL.
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ease = "cubic-bezier(.2,.7,.1,1)";
  const hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const R = Math.random;

  // ----- header -----
  const header = $(".header, .lp-head");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-solid", y > 20);
      if (window.innerWidth >= 960) header.classList.toggle("is-hidden", y > lastY && y > 500 && !document.body.classList.contains("cart-open"));
    }
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ----- Shop drop-down: click on any screen, hover on laptops -----
  const shop = $(".shopmenu");
  if (shop) {
    const btn = $(".shopmenu__btn", shop);
    const set = (open) => { shop.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", String(open)); };
    let hoveredAt = 0;
    btn.addEventListener("click", () => {
      if (Date.now() - hoveredAt < 600) { set(true); return; }
      set(!shop.classList.contains("is-open"));
    });
    if (window.matchMedia("(hover: hover) and (min-width: 960px)").matches) {
      let t;
      shop.addEventListener("pointerenter", () => { clearTimeout(t); if (!shop.classList.contains("is-open")) hoveredAt = Date.now(); set(true); });
      shop.addEventListener("pointerleave", () => { t = setTimeout(() => set(false), 180); });
    }
    document.addEventListener("click", (e) => { if (!shop.contains(e.target)) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  }

  // ----- hero: full-bleed video, or a slow slideshow until the video exists -----
  const hero = $(".hero6");
  if (hero) {
    const imgs = $$(".hero6__media img", hero);
    let k = 0, heroOn = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);
    if (imgs.length > 1 && !reduce) setInterval(() => {
      if (!heroOn || document.hidden) return;
      imgs[k].classList.remove("is-on"); k = (k + 1) % imgs.length; imgs[k].classList.add("is-on");
    }, 5200);
    const v = $(".hero6__video", hero);
    if (v && reduce) v.pause();
  }

  // ----- "how to take it" scenes, drawn in SVG -----
  const NS = "http://www.w3.org/2000/svg";
  const scenes = new Map();
  const dot = (parent, r, fill) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", r); c.setAttribute("fill", fill); parent.appendChild(c); return c; };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const buildScene = (fig) => {
    const vid = $(".scene__video", fig);
    if (vid) return { play: () => { vid.play().catch(() => {}); }, pause: () => vid.pause() };
    const host = $(".obj3d", fig);
    if (host) { const o = object3D(host, host.dataset.obj); if (o) { fig.classList.add("scene--3d"); return o; } host.remove(); }
    const id = fig.dataset.scene, svg = $("svg", fig), q = (s) => $(s, svg), qa = (s) => $$(s, svg);
    const bits = q(".sc-bits"), loops = [], ticks = [];
    const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.4 });

    // shared: a sachet tips powder into the vessel
    const sachetPour = (at, colour, n, landY) => {
      const sachet = q(".sc-sachet");
      tl.fromTo(sachet, { x: 40, y: -90, rotation: 0, opacity: 1 }, { x: 150, y: 40, rotation: 0, duration: .6, ease: "power3.out", transformOrigin: "50% 50%" }, at)
        .to(sachet, { rotation: 125, duration: .5, ease: "power2.inOut", transformOrigin: "50% 50%" }, at + .6)
        .to(sachet, { x: 260, y: -110, rotation: 160, opacity: 0, duration: .6, ease: "power2.in", transformOrigin: "50% 50%" }, at + 2.1);
      const grains = [];
      for (let i = 0; i < n; i++) {
        const g = dot(bits, 1.5 + R() * 2.2, colour); g.setAttribute("cx", 192 + R() * 16); g.setAttribute("cy", 104);
        grains.push(g);
        tl.fromTo(g, { x: 0, y: 0, opacity: 0 }, { x: (R() - .5) * 40, y: landY() - 104, opacity: 1, duration: .55 + R() * .3, ease: "power2.in" }, at + 1 + i * .04);
      }
      return grains;
    };

    if (id === "crypto-coffee") {
      const level = q(".sc-level"), wave = q(".sc-liquid"), stream = q(".sc-stream"), steam = q(".sc-steam");
      const full = parseFloat(level.getAttribute("transform").split(",")[1]);
      loops.push(gsap.to(wave, { x: -60, duration: 1.8, ease: "none", repeat: -1, paused: true }));
      qa(".sc-swirl ellipse").forEach((e, i) => loops.push(gsap.to(e, { strokeDashoffset: i ? 84 : -84, duration: 1.4, ease: "none", repeat: -1, paused: true })));
      qa(".sc-steam path").forEach((p, i) => loops.push(gsap.fromTo(p, { y: 8, opacity: 0 }, { y: -26, opacity: .9, duration: 2.2, ease: "sine.inOut", repeat: -1, yoyo: true, delay: i * .5, paused: true })));
      const follow = () => stream.setAttribute("height", Math.max(0, gsap.getProperty(level, "y")));
      tl.set(stream, { opacity: 0 }, 0).set(level, { y: 345 }, 0).set(steam, { opacity: 0 }, 0).set(wave, { fill: "#A49B6A" }, 0);
      const grains = sachetPour(0, "#4F4A22", 22, () => 318 + R() * 10);
      tl.set(stream, { opacity: 1, attr: { y: 0, height: 0 } }, 2.6)
        .to(stream, { attr: { height: 340 }, duration: .3, ease: "power1.in" }, 2.6)
        .to(level, { y: full, duration: 2, ease: "power1.out", onUpdate: follow }, 2.85)
        .to(stream, { attr: { y: full, height: 0 }, duration: .35, ease: "power1.in" }, 4.85)
        .to(grains, { opacity: 0, duration: .4 }, 2.9)
        .to(wave, { fill: "#6B6131", duration: 1.6 }, 3)
        .to(steam, { opacity: 1, duration: .8 }, 4.4)
        .to({}, { duration: 1.4 });
    }

    if (id === "crypto-tablets") {
      const pack = q(".sc-pack"), tear = q(".sc-tear"), pills = qa(".sc-pill"), cup = q(".sc-cup"), water = q(".sc-cupwater"), face = q(".sc-face");
      loops.push(gsap.to(face, { y: -1.5, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut", paused: true }));
      tl.set(pills, { x: 0, y: 0, opacity: 0 }, 0).set(tear, { x: 0, y: 0, rotation: 0, opacity: 1 }, 0)
        .set(cup, { x: 60, y: 0, rotation: 0, opacity: 0, svgOrigin: "0 0" }, 0).set(water, { y: 0, rotation: 0 }, 0)
        .fromTo(pack, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: "back.out(1.6)" }, 0)
        .to(tear, { x: 18, y: -30, rotation: 40, opacity: 0, duration: .5, ease: "power2.out", transformOrigin: "50% 50%" }, .7);
      pills.forEach((p, i) => {
        const dx = 255 - parseFloat(p.getAttribute("cx")), dy = 251 - parseFloat(p.getAttribute("cy")), t = 1.05 + i * .16;
        tl.set(p, { opacity: 1 }, t)
          .to(p, { x: dx, duration: .75, ease: "power1.in" }, t)
          .to(p, { keyframes: [{ y: dy - 48, duration: .4, ease: "power2.out" }, { y: dy, duration: .35, ease: "power2.in" }] }, t)
          .set(p, { opacity: 0 }, t + .8);
      });
      tl.to(pack, { y: 60, opacity: 0, duration: .5, ease: "power2.in" }, 2.1)
        .to(cup, { x: 0, opacity: 1, duration: .5, ease: "power2.out", svgOrigin: "0 0" }, 2.35)
        .to(cup, { x: -20, y: -20, rotation: -52, duration: 1, ease: "power2.inOut", svgOrigin: "0 0" }, 2.95)
        .to(water, { rotation: 52, duration: 1, ease: "power2.inOut", transformOrigin: "50% 50%" }, 2.95)
        .to(water, { y: 26, duration: 1.3, ease: "sine.inOut" }, 3.95)
        .to(cup, { x: 0, y: 0, rotation: 0, duration: 1, ease: "power2.inOut", svgOrigin: "0 0" }, 5.4)
        .to(water, { rotation: 0, duration: 1, ease: "power2.inOut", transformOrigin: "50% 50%" }, 5.4)
        .to({}, { duration: .8 });
    }

    if (id === "cleanse") {
      const vl = q(".sc-vliquid"), rings = qa(".sc-vrings ellipse"), orb = q(".sc-orbit"), bub = q(".sc-bubbles");
      const L = 150, CX = 200, st = { spin: 0, tint: 0, show: 0 };
      const water = [140, 198, 224, .55], fibre = [205, 210, 152, .95];
      const parts = Array.from({ length: 38 }, () => ({ c: dot(orb, 1.4 + R() * 2.4, R() < .5 ? "#C2BC82" : "#9FA866"), a: R() * 6.3, h: R(), r: .35 + R() * .65 }));
      let off = 0;
      const tick = () => {
        const d = 96 * st.spin, w = 18 + 26 * (1 - st.spin * .5);
        let path = `M140,${L}`;
        for (let x = 140; x <= 260; x += 5) path += ` L${x},${(L + d * Math.exp(-Math.pow((x - CX) / w, 2))).toFixed(1)}`;
        vl.setAttribute("d", path + " L260,340 L140,340 Z");
        const c = mix(water, fibre, st.tint); vl.style.fill = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(2)})`;
        off += 2.2 * st.spin;
        rings.forEach((e, k) => {
          const f = (k + 1) / (rings.length + 1);
          e.setAttribute("cy", (L + d * f * .92).toFixed(1));
          e.setAttribute("rx", (w * 1.5 * (1 - f * .8)).toFixed(1)); e.setAttribute("ry", (w * .26 * (1 - f * .8)).toFixed(1));
          e.style.opacity = (st.spin * .85).toFixed(2); e.style.strokeDashoffset = String(-off * (1 + k * .6));
        });
        parts.forEach((p) => {
          p.a += (.03 + .09 * (1 - p.h)) * st.spin + .003;
          const rad = (w * 1.45 * (1 - p.h * .8)) * p.r, y0 = L + 4 + p.h * Math.max(d * .95, 26) + (1 - st.spin) * p.h * 60;
          const s = Math.sin(p.a);
          p.c.setAttribute("cx", (CX + rad * Math.cos(p.a)).toFixed(1)); p.c.setAttribute("cy", (y0 + rad * .22 * s).toFixed(1));
          p.c.style.opacity = (st.show * (s > 0 ? .95 : .35)).toFixed(2);
        });
      };
      ticks.push(tick);
      tl.set(st, { spin: 0, tint: 0, show: 0 }, 0);
      const grains = sachetPour(0, "#D6CF96", 26, () => L + 2);
      tl.to(grains, { opacity: 0, duration: .3 }, 1.95)
        .to(st, { show: 1, duration: .4 }, 1.8)
        .to(st, { spin: 1, duration: 1.4, ease: "power2.in" }, 1.9)
        .to(st, { tint: 1, duration: 2.6, ease: "none" }, 2.2)
        .to(st, { spin: 0, duration: 1.6, ease: "power2.out" }, 4.7)
        .to(st, { show: 0, duration: 1.1 }, 5.4);
      for (let i = 0; i < 7; i++) {
        const b = dot(bub, 1.5 + R() * 2.5, "rgba(255,255,255,.8)"); b.setAttribute("cx", 172 + R() * 56); b.setAttribute("cy", 322);
        tl.fromTo(b, { y: 0, opacity: 0 }, { y: -(322 - L) + 6, opacity: .9, duration: 1.2 + R(), ease: "power1.in" }, 5.6 + i * .15).to(b, { opacity: 0, duration: .2 }, ">");
      }
      tl.to({}, { duration: .6 });
    }

    if (id === "ppars-plus") {
      const cap = q(".sc-cap"), hl = q(".sc-half--l"), hr = q(".sc-half--r"), shine = q(".sc-capshine"), helix = q(".sc-helix"), labs = qa(".sc-lab"), shadow = q(".sc-shadow");
      const st = { open: 0, show: 0, t: 0 };
      const parts = Array.from({ length: 40 }, (_, i) => {
        const g = i < 20 ? 0 : 1;
        return { g, k: i % 20, c: dot(helix, 2.6 + R() * 2, g ? (R() < .5 ? "#6B2D5C" : "#8E3E7A") : (R() < .5 ? "#3E8A3A" : "#7DBB5E")) };
      });
      const tick = () => {
        st.t += .025;
        parts.forEach((p) => {
          const th = st.t * 1.3 + p.k * (6.283 / 20) + p.g * 3.14, rad = 96 * st.open * (.86 + .14 * Math.sin(p.k * 1.7));
          const s = Math.sin(th), dir = p.g ? 1 : -1;
          p.c.setAttribute("cx", (200 + rad * Math.cos(th)).toFixed(1));
          p.c.setAttribute("cy", (158 + dir * rad * .36 * s).toFixed(1));
          p.c.style.opacity = (st.show * (s * dir > 0 ? 1 : .4)).toFixed(2);
        });
      };
      ticks.push(tick);
      tl.set(st, { open: 0, show: 0 }, 0).set(labs, { opacity: 0 }, 0).set([hl, hr], { x: 0 }, 0).set(shine, { opacity: 1 }, 0)
        .fromTo(cap, { y: -220, rotation: -35, scaleX: 1 }, { y: 0, rotation: 0, duration: 1.1, ease: "bounce.out", transformOrigin: "50% 50%" }, 0)
        .fromTo(shadow, { scaleX: .3, opacity: .2 }, { scaleX: 1, opacity: 1, duration: 1.1, ease: "bounce.out", transformOrigin: "50% 50%" }, 0)
        .to(cap, { scaleX: -1, duration: .3, ease: "sine.in", transformOrigin: "50% 50%" }, 1.25)
        .to(cap, { scaleX: 1, duration: .3, ease: "sine.out", transformOrigin: "50% 50%" }, 1.55)
        .to(cap, { y: -24, duration: .5, ease: "power2.out" }, 1.9)
        .to(hl, { x: -40, duration: .55, ease: "back.out(1.8)" }, 2)
        .to(hr, { x: 40, duration: .55, ease: "back.out(1.8)" }, 2)
        .to(shine, { opacity: 0, duration: .2 }, 2)
        .to(st, { open: 1, duration: 1, ease: "power3.out" }, 2.2)
        .to(st, { show: 1, duration: .4 }, 2.2)
        .to(labs, { opacity: 1, duration: .5, stagger: .35 }, 2.9)
        .to(labs, { opacity: 0, duration: .4 }, 5.1)
        .to(st, { open: 0, duration: .8, ease: "power2.in" }, 5.3)
        .to(st, { show: 0, duration: .3 }, 5.9)
        .to([hl, hr], { x: 0, duration: .45, ease: "power2.inOut" }, 5.95)
        .to(shine, { opacity: 1, duration: .3 }, 6.3)
        .to(cap, { y: 0, duration: .5, ease: "bounce.out" }, 6.3)
        .to({}, { duration: 1 });
    }

    return {
      play: () => { tl.restart(); loops.forEach((l) => l.play()); ticks.forEach((f) => gsap.ticker.add(f)); },
      pause: () => { tl.pause(); loops.forEach((l) => l.pause()); ticks.forEach((f) => gsap.ticker.remove(f)); },
    };
  };

  // ----- a real-looking chlorella tablet: speckled green, with the pressed ring -----
  const tabletMesh = () => {
    const tc = document.createElement("canvas"); tc.width = 512; tc.height = 512;
    const tx = tc.getContext("2d"); tx.fillStyle = "#1d4720"; tx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { const l = 12 + R() * 22; tx.fillStyle = `hsla(${105 + R() * 25},${35 + R() * 25}%,${l}%,${.35 + R() * .5})`; tx.fillRect(R() * 512, R() * 512, 1 + R() * 2.4, 1 + R() * 2.4); }
    const bc = document.createElement("canvas"); bc.width = 64; bc.height = 512;
    const bx = bc.getContext("2d"); bx.fillStyle = "#808080"; bx.fillRect(0, 0, 64, 512);
    for (let i = 0; i < 2500; i++) { bx.fillStyle = `rgba(${R() < .5 ? 0 : 255},${R() < .5 ? 0 : 255},${R() < .5 ? 0 : 255},.08)`; bx.fillRect(R() * 64, R() * 512, 2, 2); }
    bx.fillStyle = "#3a3a3a"; bx.fillRect(0, 512 * .1, 64, 9); bx.fillRect(0, 512 * .9 - 9, 64, 9);
    const V = (x, y) => new THREE.Vector2(x, y), prof = [V(0, .34)];
    for (let i = 1; i <= 8; i++) prof.push(V(1.35 * i / 8, .34 - .05 * Math.pow(i / 8, 2)));
    for (let i = 1; i <= 10; i++) { const a = Math.PI / 2 - Math.PI * i / 10; prof.push(V(1.35 + .28 * Math.cos(a), .29 * Math.sin(a))); }
    for (let i = 7; i >= 0; i--) prof.push(V(1.35 * i / 8, -.34 + .05 * Math.pow(i / 8, 2)));
    const mat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(tc), bumpMap: new THREE.CanvasTexture(bc), bumpScale: .035, roughness: .72, metalness: 0, envMapIntensity: .55 });
    mat.map.encoding = THREE.sRGBEncoding;
    return new THREE.Mesh(new THREE.LatheGeometry(prof, 96), mat);
  };

  // ----- 03: a real-looking tablet or capsule, turning in slow motion (three.js) -----
  const object3D = (host, kind) => {
    if (!window.THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    if (!renderer.getContext()) return null;
    const PR = Math.min(devicePixelRatio || 1, 2);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
    camera.position.set(0, .4, 9);
    // soft studio light for reflections
    const pmrem = new THREE.PMREMGenerator(renderer), envS = new THREE.Scene();
    envS.add(new THREE.Mesh(new THREE.BoxGeometry(14, 14, 14), new THREE.MeshBasicMaterial({ color: 0xb9c2b4, side: THREE.BackSide })));
    [[7, 4, -5, 4, 4], [3, 7, 6, 1, 3], [10, 1.5, 0, 6.5, -2]].forEach(([w, h, x, y, z]) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      pl.position.set(x, y, z); pl.lookAt(0, 0, 0); envS.add(pl);
    });
    scene.environment = pmrem.fromScene(envS, .02).texture;
    scene.add(new THREE.AmbientLight(0xffffff, .25));
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, .7); rim.position.set(4, 2, -4); scene.add(rim);
    const obj = new THREE.Group(); scene.add(obj);
    const V = (x, y) => new THREE.Vector2(x, y);

    // a soft contact shadow under the object
    const sc = document.createElement("canvas"); sc.width = sc.height = 128;
    const sx = sc.getContext("2d"), gr = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(20,40,20,.35)"); gr.addColorStop(1, "rgba(20,40,20,0)"); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.9; scene.add(shadow);

    const extras = [];
    if (kind === "tablet") {
      const tab = tabletMesh();
      tab.rotation.x = Math.PI / 2; obj.add(tab);
      // two more tablets drifting further back, softer
      [[-2.6, 1.1, -4, .42], [2.5, -.9, -5, .38]].forEach(([x, y, z, s]) => {
        const m2 = tab.clone(); m2.scale.setScalar(s); m2.position.set(x, y, z); m2.userData.spin = .5 + R(); scene.add(m2); extras.push(m2);
      });
    } else {
      // a two-tone capsule: a white body under a dark cap
      const half = (r, len) => { const p = [V(0, -.02)]; p.push(V(r, -.02)); p.push(V(r, len)); for (let i = 1; i <= 14; i++) { const a = Math.PI / 2 * i / 14; p.push(V(r * Math.cos(a), len + r * Math.sin(a))); } return p; };
      const white = new THREE.MeshPhysicalMaterial({ color: 0xe9e9e4, roughness: .3, metalness: 0, clearcoat: 1, clearcoatRoughness: .1, envMapIntensity: .6 });
      const dark = new THREE.MeshPhysicalMaterial({ color: 0x15181c, roughness: .28, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: .7 });
      const body = new THREE.Mesh(new THREE.LatheGeometry(half(.6, .95), 72), white); body.rotation.z = Math.PI; body.position.y = .15;
      const cap = new THREE.Mesh(new THREE.LatheGeometry(half(.63, 1.05), 72), dark); cap.position.y = -.05;
      const caps = new THREE.Group(); caps.add(body, cap); caps.rotation.z = Math.PI / 2 - .35; obj.add(caps);
      // chlorella (green) and grape skin (purple) circling it slowly
      const gm = new THREE.MeshStandardMaterial({ color: 0x2c6a28, roughness: .45, envMapIntensity: .5 }), pm = new THREE.MeshStandardMaterial({ color: 0x3e0f33, roughness: .4, envMapIntensity: .5 });
      for (let i = 0; i < 26; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(.05 + R() * .07, 16, 12), i % 2 ? pm : gm);
        s.userData = { a: R() * 6.283, r: 2 + R() * .9, y: (R() - .5) * 1.6, sp: .15 + R() * .2, g: i % 2 };
        scene.add(s); extras.push(s);
      }
    }
    const size = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setPixelRatio(1); renderer.setSize(Math.round(w * PR), Math.round(h * PR), false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    size(); if ("ResizeObserver" in window) new ResizeObserver(size).observe(host);
    let on = false, raf = 0, t0 = performance.now(), mx = 0, my = 0;
    host.parentElement.addEventListener("pointermove", (e) => { const r = host.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });
    const frame = (now) => {
      if (!on) return; raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      // slow motion: a quarter turn every few seconds, a gentle float
      obj.rotation.y = (kind === "tablet" ? t * .35 : Math.sin(t * .35) * .85) + mx * .6; obj.rotation.x = Math.sin(t * .4) * .25 + my * .4; obj.position.y = Math.sin(t * .8) * .12;
      shadow.scale.setScalar(1 - Math.sin(t * .8) * .05);
      extras.forEach((e) => {
        const u = e.userData;
        if (u.r) { const a = u.a + t * u.sp; e.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * .6 + u.a) * .2, Math.sin(a) * u.r * .6); }
        else { e.rotation.y = t * .25 * u.spin; e.rotation.x = Math.PI / 2 + Math.sin(t * .3) * .3; }
      });
      renderer.render(scene, camera);
    };
    return { play: () => { if (on) return; on = true; size(); raf = requestAnimationFrame(frame); }, pause: () => { on = false; cancelAnimationFrame(raf); } };
  };
  const sceneOf = (fig) => {
    if (!hasGsap || !fig) return null;
    if (!scenes.has(fig)) scenes.set(fig, buildScene(fig));
    return scenes.get(fig);
  };
  let playing = null;
  const playScene = (fig) => {
    const s = sceneOf(fig);
    if (playing && playing !== s) playing.pause();
    if (s && s !== playing) s.play();
    playing = s;
  };
  const stopScene = () => { if (playing) playing.pause(); playing = null; };
  const activeScene = () => { const p = $(".ppanel.is-on"); const sl = p && $(".pgal__slide.is-on", p); return sl && $(".scene", sl); };

  // ----- product tabs: one product at a time, with its scene and photos -----
  const ptabs = $$(".ptab");
  if (ptabs.length) {
    const show = (tab) => {
      ptabs.forEach((t) => { const on = t === tab; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
      $$(".ppanel").forEach((p) => {
        const on = p.id === tab.getAttribute("aria-controls");
        p.hidden = !on; p.classList.toggle("is-on", on);
        if (on && !reduce) p.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 550, easing: ease });
      });
      const sc = activeScene(); sc ? playScene(sc) : stopScene();
    };
    ptabs.forEach((t, i) => {
      t.addEventListener("click", () => show(t));
      t.addEventListener("keydown", (e) => {
        const k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (k) { const n = ptabs[(i + k + ptabs.length) % ptabs.length]; n.focus(); show(n); }
      });
    });
    const box = $(".ppanels");
    if (box && "IntersectionObserver" in window) new IntersectionObserver(([e]) => { if (e.isIntersecting) { const sc = activeScene(); if (sc) playScene(sc); } else stopScene(); }, { threshold: .25 }).observe(box);
  }
  $$(".pgal").forEach((g) => {
    const slides = $$(".pgal__slide", g), btns = $$(".pgal__thumbs button", g);
    btns.forEach((b, i) => b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      slides.forEach((s, j) => s.classList.toggle("is-on", j === i));
      const sc = $(".scene", slides[i]); sc ? playScene(sc) : stopScene();
    }));
  });

  // ----- chapter points: open and close smoothly -----
  $$(".points").forEach((list) => {
    const items = $$("li", list);
    items.forEach((li, i) => {
      const btn = $("button", li), ans = $(".ans", li);
      const set = (open) => {
        const from = ans.offsetHeight;
        li.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", String(open));
        const to = open ? ans.scrollHeight : 0;
        if (!reduce) ans.animate([{ height: from + "px" }, { height: to + "px" }], { duration: 450, easing: ease });
      };
      btn.addEventListener("click", () => {
        const open = !li.classList.contains("is-open");
        items.forEach((o) => { if (o !== li && o.classList.contains("is-open")) { o.classList.remove("is-open"); $("button", o).setAttribute("aria-expanded", "false"); } });
        set(open);
      });
      if (i === 0) { li.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
    });
  });

  // ----- FAQ: smooth open and close -----
  $$(".faq details").forEach((d) => {
    const sum = $("summary", d), ans = $(".ans", d);
    if (!ans || reduce) return;
    sum.addEventListener("click", (e) => {
      e.preventDefault();
      if (d.open) ans.animate([{ height: ans.offsetHeight + "px" }, { height: "0px" }], { duration: 380, easing: ease }).onfinish = () => (d.open = false);
      else { d.open = true; ans.animate([{ height: "0px" }, { height: ans.offsetHeight + "px" }], { duration: 480, easing: ease }); }
    });
  });

  // ----- 01 / the story in WebGL: cells, a tablet, a glass of water -----
  const story = $(".story");
  const storyGL = () => {
    const host = story && $(".story__gl", story);
    if (!host || !window.THREE || reduce) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { return null; }
    if (!renderer.getContext()) return null;
    const mobile = innerWidth < 960, N = mobile ? 3600 : 7600;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    scene.background = new THREE.Color(0x133624);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding;
    camera.position.set(0, 0, 17);
    const group = new THREE.Group(); scene.add(group);

    // a soft studio around the scene, so the glass has something real to reflect
    const pmrem = new THREE.PMREMGenerator(renderer), envS = new THREE.Scene();
    envS.add(new THREE.Mesh(new THREE.BoxGeometry(14, 14, 14), new THREE.MeshBasicMaterial({ color: 0x1b4630, side: THREE.BackSide })));
    [[7, 3.5, -5, 3.5, 4], [2.4, 7, 6, 1, 3], [9, 1.4, 0, 6, -2], [3, 2, 2, -4, 5]].forEach(([w, h, x, y, z]) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      pl.position.set(x, y, z); pl.lookAt(0, 0, 0); envS.add(pl);
    });
    scene.environment = pmrem.fromScene(envS, .015).texture;
    scene.add(new THREE.AmbientLight(0xffffff, .35));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-4, 6, 8); scene.add(key);

    // the glass of water: real refraction, a water body and slow bubbles
    const V = (x, y) => new THREE.Vector2(x, y);
    const glassG = new THREE.Group(); glassG.position.set(1.8, 0, 0); group.add(glassG);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xf2fbff, metalness: 0, roughness: .02, transmission: 1, transparent: true, envMapIntensity: 2.6, clearcoat: 1, clearcoatRoughness: .02, side: THREE.DoubleSide });
    const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x9fd2e6, metalness: 0, roughness: .06, transmission: .55, transparent: true, envMapIntensity: 1.5 });
    glassG.add(new THREE.Mesh(new THREE.LatheGeometry([V(0, -2.62), V(1.1, -2.62), V(1.19, -2.56), V(1.5, 1.95), V(1.43, 1.97), V(1.13, -2.28), V(0, -2.28)], 72), glassMat));
    const waterMesh = new THREE.Mesh(new THREE.LatheGeometry([V(0, -2.27), V(1.12, -2.27), V(1.355, .95), V(0, .95)], 72), waterMat);
    glassG.add(waterMesh);
    const surfMat = new THREE.MeshPhysicalMaterial({ color: 0xe9f7fc, metalness: 0, roughness: .02, transmission: .35, transparent: true, envMapIntensity: 2.8, clearcoat: 1 });
    const surf = new THREE.Mesh(new THREE.CircleGeometry(1.35, 72), surfMat); surf.rotation.x = -Math.PI / 2; surf.position.y = .95; glassG.add(surf);
    const glint = new THREE.PointLight(0xffffff, .9, 12); glint.position.set(-1.5, 2.5, 3); glassG.add(glint);
    const bubMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transmission: .85, transparent: true, envMapIntensity: 2.2 });
    const bubs = Array.from({ length: 26 }, () => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(.025 + R() * .045, 12, 10), bubMat);
      b.userData = { a: R() * 6.283, r: .1 + R() * .9, s: .25 + R() * .35, o: R() }; glassG.add(b); return b;
    });
    glassG.visible = false;
    // the real tablet the particles turn into
    const realTab = tabletMesh(); realTab.material.transparent = true; realTab.material.opacity = 0; realTab.visible = false;
    group.add(realTab);

    // four shapes the particles move between
    const S = [0, 1, 2, 3].map(() => new Float32Array(N * 3)), C = [0, 1, 2, 3].map(() => new Float32Array(N * 3));
    const rnd = (a, b) => a + R() * (b - a);
    const sph = () => { const u = R() * 2 - 1, t = R() * 6.283, s = Math.sqrt(1 - u * u); return [s * Math.cos(t), u, s * Math.sin(t)]; };
    const GREENS = [[.47, .76, .36], [.29, .6, .26], [.62, .86, .46], [.2, .46, .2]], BLUE = [.66, .86, .94], GLASS = [.86, .94, .96];
    const put = (k, i, p, c, j = .05) => { S[k].set(p, i * 3); C[k].set([c[0] + rnd(-j, j), c[1] + rnd(-j, j), c[2] + rnd(-j, j)], i * 3); };
    const cells = Array.from({ length: mobile ? 46 : 80 }, () => ({ c: [rnd(-4.6, 5.6), rnd(-3.8, 3.8), rnd(-3, 3)], r: rnd(.22, .6) }));
    const water = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const g = GREENS[i % 4], f = i / N;
      // 0: one large cell, membrane plus a cup of chloroplast inside
      if (f < .72) { const d = sph(), r = rnd(2.75, 2.95); put(0, i, [d[0] * r, d[1] * r, d[2] * r], g); }
      else { const d = sph(), r = rnd(1.2, 2.2); put(0, i, [d[0] * r, d[1] * r - .3, d[2] * r], [.18, .42, .17]); }
      // 1: many small cells in fresh water, plus bubbles
      water[i] = R() < .16 ? 1 : 0;
      if (water[i]) put(1, i, [rnd(-5, 6), rnd(-4.2, 4.2), rnd(-3, 3)], BLUE, .03);
      else { const cl = cells[i % cells.length], d = sph(); put(1, i, [cl.c[0] + d[0] * cl.r, cl.c[1] + d[1] * cl.r, cl.c[2] + d[2] * cl.r], g); }
      // 2: pressed into one tablet (faces and rounded rim)
      { const a = R() * 6.283, face = R() < .68;
        if (face) { const r = 3 * Math.sqrt(R()), z = (R() < .5 ? -.55 : .55) * (1 - Math.pow(r / 3, 6) * .35); put(2, i, [Math.cos(a) * r, Math.sin(a) * r, z], g); }
        else { const t = rnd(-1, 1) * Math.PI / 2, r = 3 - .55 + .55 * Math.cos(t); put(2, i, [Math.cos(a) * r, Math.sin(a) * r, .55 * Math.sin(t)], g); } }
      // 3: a small tablet beside a glass of water
      if (f < .3) { const a = R() * 6.283, r = 1.25 * Math.sqrt(R()); put(3, i, [-2.7 + Math.cos(a) * r, -1.6 + Math.sin(a) * r * .45, (R() < .5 ? -.25 : .25) + rnd(-.05, .05)], g); }
      else { const a = R() * 6.283, y = rnd(-2.1, .8), r = (1.02 + (y + 2.3) / 3.3 * .22) * Math.sqrt(R()); put(3, i, [1.8 + Math.cos(a) * r, y, Math.sin(a) * r], GLASS, .02); }
    }
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), scl = new Float32Array(N), sz = new Float32Array(N), del = new Float32Array(N);
    for (let i = 0; i < N; i++) { scl[i] = rnd(.7, 1.3) * (water[i] ? .8 : 1); del[i] = R() * .4; }
    sz.set(scl); const inGlass = (i) => i / N >= .3;
    pos.set(S[0]); col.set(C[0]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uSize: { value: mobile ? 8.5 : 7.5 }, uPR: { value: Math.min(devicePixelRatio || 1, 2) } },
      vertexColors: true, transparent: false, depthWrite: true,
      vertexShader: `attribute float aScale; varying vec3 vC; varying float vD; uniform float uSize; uniform float uPR;
        void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); vD = clamp((-mv.z - 12.0) / 10.0, 0.0, 1.0);
        gl_PointSize = uSize * aScale * uPR * (12.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; varying float vD;
        void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float d = dot(p,p); if (d > 1.0) discard;
        vec3 n = vec3(p.x, -p.y, sqrt(1.0 - d)); float l = max(dot(n, normalize(vec3(-.45,.6,.75))), 0.0);
        float spec = pow(max(dot(reflect(-normalize(vec3(-.45,.6,.75)), n), vec3(0,0,1)), 0.0), 18.0);
        vec3 c = vC * (.38 + .8 * l) + spec * .35; c = mix(c, vec3(.075,.21,.14), vD * .55); gl_FragColor = vec4(c, 1.0); }`,
    });
    group.add(new THREE.Points(geo, mat));

    const PR = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(1);
    const size = () => {
      const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(Math.round(w * PR), Math.round(h * PR), false); camera.aspect = w / h; camera.updateProjectionMatrix();
      group.position.x = w >= 960 ? 3.6 : 0; group.position.y = w >= 960 ? -.3 : .35;
      const s = w >= 960 ? 1 : Math.min(.85, (w / h) / .9 * .95); group.scale.set(s, s, s);
    };
    size(); addEventListener("resize", size);
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(host);
    let prog = 0, mx = 0, my = 0, visible = false, t0 = performance.now();
    addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
    const sm = (x) => x * x * (3 - 2 * x);
    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - t0) / 1000, p = Math.min(Math.max(prog * 4 - .5, 0), 2.9999), a = Math.floor(p), f = p - a, A = S[a], B = S[a + 1], CA = C[a], CB = C[a + 1];
      // the cells press into a tablet, then a real tablet takes over from the particles
      const wt = sm(Math.min(1, Math.max(0, (p - 1.55) / .4))), mv = sm(Math.min(1, Math.max(0, (p - 2) / .75)));
      realTab.visible = wt > .01; realTab.material.opacity = wt; realTab.material.transparent = wt < .99; realTab.material.depthWrite = wt >= .99;
      realTab.scale.setScalar((1.84 + (.8 - 1.84) * mv) * (.94 + .06 * wt));
      realTab.position.set(-2.7 * mv, -1.6 * mv, 0);
      realTab.rotation.set(Math.PI / 2 - .55 * mv, 0, t * .15 * (1 - mv));
      for (let i = 0; i < N; i++) {
        const k = sm(Math.min(1, Math.max(0, (f - del[i]) / .6))), j = i * 3, w = Math.sin(t * .7 + i) * .045;
        pos[j] = A[j] + (B[j] - A[j]) * k + w; pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * k + Math.cos(t * .6 + i * .7) * .045 + (a === 1 && water[i] ? ((t * .35 + i * .13) % 1) * .6 * (1 - k) : 0);
        pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * k;
        col[j] = CA[j] + (CB[j] - CA[j]) * k; col[j + 1] = CA[j + 1] + (CB[j + 1] - CA[j + 1]) * k; col[j + 2] = CA[j + 2] + (CB[j + 2] - CA[j + 2]) * k;
        if (a === 2 && inGlass(i)) { sz[i] = scl[i] * .14 * k; pos[j + 1] += k * (((t * .2 + del[i] * 9) % 1) * 2.6 - 1.3) * .6; }
        else if (a === 2) sz[i] = 0;
        else if (a === 1) sz[i] = scl[i] * (1 - wt);
        else sz[i] = scl[i];
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.attributes.aScale.needsUpdate = true;
      // the real glass fades in as the particles settle into it
      const wg = sm(Math.min(1, Math.max(0, (p - 2.05) / .6)));
      glassG.visible = wg > .01; glassMat.opacity = wg; waterMat.opacity = wg * .92; surfMat.opacity = wg * .9; bubMat.opacity = wg;
      glassG.scale.setScalar(.92 + .08 * wg);
      waterMesh.rotation.y = t * .2;
      bubs.forEach((b) => { const u = b.userData, y = ((t * u.s * .25 + u.o) % 1); b.position.set(Math.cos(u.a + t * .3) * u.r, -2.1 + y * 2.95, Math.sin(u.a + t * .3) * u.r); });
      // a slow turn for the cells, a tilt that shows the tablet's edge, then a steady view of the glass
      const tab = Math.max(0, 1 - Math.abs(prog - .62) / .16), end = Math.min(1, Math.max(0, (prog - .74) / .1));
      group.rotation.x = (.22 + my * .2) * (1 - tab) + (-.72 + my * .15) * tab;
      const base = (t * .12 + prog * 1.4 + mx * .35) % 6.283;
      group.rotation.y = (base * (1 - tab) + (.4 + mx * .3 + Math.sin(t * .4) * .25) * tab) * (1 - end) + (mx * .3 + Math.sin(t * .5) * .12) * end;
      renderer.render(scene, camera);
    };
    requestAnimationFrame(frame);
    story.classList.add("story--gl");
    return { set: (v) => { prog = v; } };
  };

  // CSS fallback bubbles for the story
  if (story) {
    const bb = $(".story__bubbles", story);
    if (bb) for (let i = 0; i < 10; i++) {
      const b = document.createElement("b");
      b.style.cssText = `left:${18 + R() * 64}%;--b:${6 + R() * 14}px;--t:${3 + R() * 3}s;--dl:-${(R() * 4).toFixed(2)}s`;
      bb.appendChild(b);
    }
  }

  const wheel = $(".wheel");
  const flat = () => {
    if (wheel) wheel.classList.add("wheel--flat");
    if (story) story.classList.add("story--flat");
    const tl0 = $(".tl"); if (tl0) tl0.classList.add("tl--flat");
    $$(".statement .w").forEach((w) => w.classList.add("on"));
  };
  if (!hasGsap) { flat(); return; }
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  // ----- hero entrance and scroll -----
  if (hero) {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero6__media", { scale: 1.12, duration: 2.4, ease: "power2.out" }, 0)
      .from(".hero6 h1 .mask > span", { yPercent: 110, duration: 1.1, stagger: .1 }, .2)
      .from(".hero6__meta, .hero6__lead, .hero6 .hero__ctas", { y: 22, opacity: 0, duration: .9, stagger: .08 }, .5)
      .from(".hero6__range a", { y: 16, opacity: 0, duration: .8, stagger: .06 }, .8);
    const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    gsap.to(".hero6__media", { yPercent: 12, scale: 1.05, ease: "none", scrollTrigger: st });
    gsap.to(".hero6__in", { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: st });
  }

  // ----- pages with a floating head: the tablets drift with the mouse -----
  $$(".pagehead__floaters").forEach((fl) => {
    gsap.from($$("i", fl), { scale: 0, opacity: 0, duration: 1, stagger: .07, ease: "back.out(2)", delay: .3 });
    $$("i", fl).forEach((f) => gsap.to(f, { y: -220 * (parseFloat(f.dataset.depth) || .5), ease: "none", scrollTrigger: { trigger: fl.parentElement, start: "top top", end: "bottom top", scrub: true } }));
    mm.add("(pointer: fine)", () => {
      const qx = gsap.quickTo(fl, "x", { duration: 1.2, ease: "power3" }), qy = gsap.quickTo(fl, "y", { duration: 1.2, ease: "power3" });
      const move = (e) => { qx((e.clientX / innerWidth - .5) * -40); qy((e.clientY / innerHeight - .5) * -28); };
      addEventListener("pointermove", move);
      return () => removeEventListener("pointermove", move);
    });
  });

  // ----- statement words light up as you read -----
  $$(".statement > .wrap > p:first-child").forEach((p) => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    const words = $$(".w", p);
    ScrollTrigger.create({ trigger: p, start: "top 80%", end: "bottom 45%", scrub: true,
      onUpdate: (s) => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle("on", i < n)); } });
  });

  // ----- What is it: the journey line draws itself -----
  const jl = $(".journey__line path");
  if (jl) {
    const len = jl.getTotalLength();
    gsap.fromTo(jl, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".journey", start: "top 70%", end: "top 10%", scrub: true } });
  }
  $$(".stack__over").forEach((o) => gsap.from(o, { y: 80, ease: "none", scrollTrigger: { trigger: o, start: "top bottom", end: "top 40%", scrub: true } }));

  // ----- Our story: the years slide past as you scroll -----
  const tlx = $(".tl");
  if (tlx) {
    mm.add("(min-width: 960px)", () => {
      tlx.classList.remove("tl--flat");
      const row = $(".tl__row", tlx);
      const tw = gsap.to(row, { x: () => -(row.scrollWidth - innerWidth + 80), ease: "none",
        scrollTrigger: { trigger: $(".tl__track", tlx), start: "top top", end: "bottom bottom", scrub: .6, invalidateOnRefresh: true } });
      $$(".tl__year", tlx).forEach((y) => gsap.from(y, { yPercent: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: y, containerAnimation: tw, start: "left 90%", end: "left 55%", scrub: true } }));
      return () => tw.kill();
    });
    mm.add("(max-width: 959px)", () => { tlx.classList.add("tl--flat"); });
  }
  // ----- 01 / the story -----
  if (story) {
    const gl = storyGL();
    const steps = $$(".story__step", story), stage = $(".story__stage", story);
    const prog = document.createElement("ol"); prog.className = "story__progress"; prog.setAttribute("aria-hidden", "true");
    prog.innerHTML = steps.map(() => "<li><i></i></li>").join(""); $(".story__sticky", story).appendChild(prog);
    const bars = $$("i", prog);
    let cur = 0;
    const setStep = (n) => {
      if (n === cur) return; cur = n;
      if (stage) stage.dataset.step = String(n);
      steps.forEach((s, i) => s.classList.toggle("is-on", i === n));
      $$(".story__big", story).forEach((s, i) => s.classList.toggle("is-on", i === n));
    };
    if (stage) stage.dataset.step = "0";
    ScrollTrigger.create({ trigger: $(".story__track", story), start: "top top", end: "bottom bottom", scrub: .8,
      onUpdate: (s) => {
        const p = s.progress; if (gl) gl.set(p);
        setStep(Math.min(3, Math.floor(p * 4)));
        bars.forEach((b, i) => gsap.set(b, { scaleY: Math.min(1, Math.max(0, p * 4 - i)) }));
      } });
    gsap.from([".story__swap", ".story__sub"], { yPercent: 60, opacity: 0, duration: 1.1, stagger: .1, ease: "power4.out", scrollTrigger: { trigger: story, start: "top 70%" } });
    if (!gl) {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: $(".story__track", story), start: "top top", end: "bottom bottom", scrub: .6 } });
      tl.fromTo(".story__cell", { scale: .3 }, { scale: 1, duration: 1 }, 0)
        .to(".story__cell", { rotation: 70, duration: 1 }, 1)
        .to(".story__cell", { scale: .12, autoAlpha: 0, duration: .7 }, 2)
        .fromTo(".story__tabs i", { scale: .2, autoAlpha: 0, y: -60 }, { scale: 1, autoAlpha: 1, y: 0, duration: .6, stagger: .12, ease: "back.out(2)" }, 2.15)
        .to(".story__tabs", { xPercent: -24, duration: .8 }, 3)
        .fromTo(".story__glass", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: .5 }, 3)
        .fromTo(".story__glass span", { height: "0%" }, { height: "74%", duration: .7 }, 3.2)
        .to({}, { duration: .2 }, 3.8);
    }
  }

  // ----- headings rise out of a mask -----
  $$("[data-rise]").forEach((h) => {
    if (!h.querySelector(".mask")) h.innerHTML = `<span class="mask"><span>${h.innerHTML}</span></span>`;
    gsap.from($(".mask > span", h), { yPercent: 105, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: h, start: "top 88%" } });
  });
  $$(".promises, .steps, .remind__list, .points, .shopgrid, .forms").forEach((g) => {
    gsap.from(g.children, { y: 40, opacity: 0, duration: .9, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: g, start: "top 86%" } });
  });

  // ----- product wheel: the dome turns as you scroll, two laps so it is never empty -----
  if (wheel) {
    mm.add("(min-width: 960px)", () => {
      wheel.classList.remove("wheel--flat");
      const items = $$(".wheel__item", wheel), texts = $$(".wheel__text", wheel), dots = $$(".wheel__dots button", wheel);
      const dome = $(".wheel__dome", wheel);
      const n = items.length, m = texts.length, step = 25;
      let cur = -1, r = 0;
      const layout = () => { r = dome.offsetWidth / 2; };
      texts.forEach((t, i) => gsap.set(t, { autoAlpha: i ? 0 : 1 }));
      // only one product's words are ever visible: the old ones vanish at once
      const show = (idx) => {
        const dir = idx > cur ? 1 : -1; cur = idx;
        texts.forEach((t, i) => { gsap.killTweensOf(t); if (i !== idx) gsap.set(t, { autoAlpha: 0, y: 0 }); });
        gsap.fromTo(texts[idx], { autoAlpha: 0, y: 26 * dir }, { autoAlpha: 1, y: 0, duration: .5, ease: "power3.out" });
        dots.forEach((d, i) => d.setAttribute("aria-current", String(i === idx)));
      };
      const place = (p) => {
        const f = p * (m - 1);
        items.forEach((it, i) => {
          let d = i - f;
          d = ((d + n / 2) % n + n) % n - n / 2;
          const a = d * step, sc = 1 - Math.min(Math.abs(d), 2) * .16;
          it.style.transform = `rotate(${a}deg) translateY(${-r}px) scale(${sc})`;
          it.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
          it.style.visibility = Math.abs(d) > 3.4 ? "hidden" : "visible";
        });
        const idx = Math.min(m - 1, Math.round(f));
        if (idx !== cur) show(idx);
      };
      layout();
      let st = null;
      st = ScrollTrigger.create({ trigger: $(".wheel__track", wheel), start: "top top", end: "bottom bottom", scrub: .8,
        onUpdate: (s) => place(s.progress), onRefresh: () => { layout(); place(st ? st.progress : 0); } });
      place(0);
      dots.forEach((d, i) => d.addEventListener("click", () => scrollTo({ top: st.start + (st.end - st.start) * (i / (m - 1)) + 2, behavior: "smooth" })));
      return () => st.kill();
    });
    mm.add("(max-width: 959px)", () => { wheel.classList.add("wheel--flat"); });
  }

  // ----- the phone: messages arrive one by one -----
  const chat = $$(".chat > *");
  if (chat.length) {
    gsap.set(chat, { autoAlpha: 0, y: 16, scale: .96, transformOrigin: "bottom left" });
    ScrollTrigger.create({ trigger: ".phone", start: "top 70%", once: true,
      onEnter: () => gsap.to(chat, { autoAlpha: 1, y: 0, scale: 1, duration: .5, stagger: .7, ease: "back.out(1.7)" }) });
  }

  // ----- closing circle turns slowly -----
  if ($(".closer__img")) gsap.fromTo(".closer__img img", { rotate: -8, scale: 1.1 }, { rotate: 8, scale: 1, ease: "none", scrollTrigger: { trigger: ".closer", start: "top bottom", end: "bottom top", scrub: true } });

  // ----- footer wordmark rises -----
  if ($(".footer__mark")) gsap.from(".footer__mark", { yPercent: 60, opacity: 0, duration: 1.4, ease: "power4.out", scrollTrigger: { trigger: ".footer__mark", start: "top 95%" } });

  // ----- product page: images open up as they arrive -----
  if ($(".pdp")) {
    gsap.from(".pdp__imgs figure:first-child", { clipPath: "inset(10% 10% 10% 10%)", duration: 1.3, ease: "expo.out" });
    gsap.from(".buy > *", { y: 24, opacity: 0, duration: .8, stagger: .05, ease: "power3.out", delay: .1 });
    $$(".pdp__imgs figure:not(:first-child)").forEach((f) => gsap.from(f, { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 90%" } }));
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();
