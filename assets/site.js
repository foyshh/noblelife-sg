// Noble Life SG prototype: cart drawer, quantity picker, sticky buy bar, Meta events.
// In WooCommerce this becomes the store's own cart; the event names stay the same.
(function () {
  const KEY = "nl-cart";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = (n) => "S$" + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "");

  // ?review highlights everything Noble Life still has to confirm
  if (/[?&]review\b/.test(location.search)) document.body.classList.add("review");

  // Meta Pixel and GA4 events. fbq and gtag exist only once the real tags are added.
  function track(name, data) {
    try { if (window.fbq) window.fbq("track", name, data); } catch (e) {}
    try { if (window.gtag) window.gtag("event", name, data); } catch (e) {}
  }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  let cart = load();

  function add(item, qty) {
    const found = cart.find((l) => l.id === item.id);
    if (found) found.qty += qty; else cart.push({ ...item, qty });
    save(cart); render();
    track("AddToCart", { content_ids: [item.id], content_type: "product", value: item.price * qty, currency: "SGD" });
  }

  function render() {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    $$(".cart-count").forEach((el) => { el.textContent = count; el.dataset.n = count; });
    const box = $("#cart-items");
    if (!box) return;
    box.innerHTML = cart.length ? cart.map((l, i) => `
        <div class="line">
          <img src="${l.img}" alt="">
          <div><b>${l.name}</b><span class="small">${money(l.price)} a box</span>
            <div class="stepper">
              <button type="button" data-step="-1" data-i="${i}" aria-label="One less ${l.name}">&minus;</button>
              <span aria-live="polite">${l.qty}</span>
              <button type="button" data-step="1" data-i="${i}" aria-label="One more ${l.name}">+</button>
            </div></div>
          <b>${money(l.price * l.qty)}</b>
        </div>`).join("")
      : '<p class="empty">Your cart is empty. Crypto Coffee (S$25) is an easy place to start.</p>';
    const t = $("#cart-total"); if (t) t.textContent = money(cart.reduce((s, l) => s + l.qty * l.price, 0));
  }

  let lastFocus = null;
  function openCart() {
    const d = $("#cart"); if (!d) return;
    lastFocus = document.activeElement;
    d.classList.add("is-open"); d.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    setTimeout(() => $(".drawer__head button", d).focus(), 50);
  }
  function closeCart() {
    const d = $("#cart"); if (!d || !d.classList.contains("is-open")) return;
    d.classList.remove("is-open"); d.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    if (lastFocus) lastFocus.focus();
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-add]");
    if (a) {
      const data = JSON.parse(a.dataset.add);
      const picker = a.dataset.qtyFrom ? $(`input[name="${a.dataset.qtyFrom}"]:checked`) : null;
      const qty = picker ? Number(picker.value) : 1;
      (Array.isArray(data) ? data : [data]).forEach((item) => add(item, qty));
      openCart();
      return;
    }
    if (e.target.closest("[data-open-cart]")) { openCart(); return; }
    if (e.target.closest("[data-close-cart]")) { closeCart(); return; }
    const s = e.target.closest("[data-step]");
    if (s) {
      const i = Number(s.dataset.i), l = cart[i];
      l.qty += Number(s.dataset.step);
      if (l.qty <= 0) cart.splice(i, 1);
      save(cart); render(); return;
    }
    const wa = e.target.closest("[data-wa]");
    if (wa) { track("Contact", { method: "whatsapp", where: wa.dataset.wa }); return; }
    if (e.target.closest("[data-checkout]")) {
      e.preventDefault();
      track("InitiateCheckout", { value: cart.reduce((s, l) => s + l.qty * l.price, 0), currency: "SGD" });
      toast("Prototype: checkout opens in WooCommerce");
      return;
    }
    const m = e.target.closest(".menu-btn");
    if (m) { const open = $(".nav").classList.toggle("is-open"); m.setAttribute("aria-expanded", String(open)); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  // the quantity picker updates the price on the buy button
  $$(".qty input").forEach((inp) => inp.addEventListener("change", () => {
    const total = money(Number(inp.dataset.each) * Number(inp.value));
    $$("[data-total]").forEach((el) => (el.textContent = total));
  }));

  // phones: a buy bar slides up once the main buy button has scrolled away
  const bar = $(".buybar"), mainBtn = $("#buy-main");
  if (bar && mainBtn && "IntersectionObserver" in window) {
    document.body.classList.add("has-buybar");
    new IntersectionObserver(([en]) => bar.classList.toggle("is-on", !en.isIntersecting && en.boundingClientRect.top < 0)).observe(mainBtn);
  }

  // cart: WhatsApp reminders opt-in. Unticked by default; the number field shows once a box is ticked.
  const OPT = "nl-optin", optBox = $(".cart-optin");
  if (optBox) {
    const boxes = $$("[data-optin]", optBox), num = $(".cart-optin__num", optBox), tel = $("#cart-wa"), time = $("#cart-time");
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(OPT)) || {}; } catch (e) {}
    boxes.forEach((b) => { b.checked = !!saved[b.name]; });
    if (saved.tel) tel.value = saved.tel; if (saved.time) time.value = saved.time;
    const sync = () => {
      const any = boxes.some((b) => b.checked); num.hidden = !any;
      const data = { tel: tel.value.trim(), time: time.value, v: "2026-11-09b" }; boxes.forEach((b) => { data[b.name] = b.checked; });
      try { localStorage.setItem(OPT, JSON.stringify(data)); } catch (e) {}
    };
    [...boxes, tel, time].forEach((el) => el.addEventListener("change", sync));
    tel.addEventListener("input", sync);
    sync();
    // at checkout, ask for a number if reminders were ticked
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-checkout]")) return;
      if (boxes.some((b) => b.checked)) {
        if (tel.value.replace(/\D/g, "").length < 8) { e.preventDefault(); e.stopImmediatePropagation(); tel.focus(); toast("Add your WhatsApp number for the reminders, or untick them"); }
      }
    }, true);
  }

  const pid = document.body.dataset.product;
  if (pid) track("ViewContent", { content_ids: [pid], content_type: "product", currency: "SGD", value: Number(document.body.dataset.price || 0) });

  render();
})();
