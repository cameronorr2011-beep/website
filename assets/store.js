/* Orr Biologicals — storefront cart.
   The site has no server and takes no card: the cart builds an itemised
   order email, which the customer sends from their own mail app. The cart
   lives in localStorage so a reload does not lose it. */
(function () {
  "use strict";

  var STORE_KEY = "orr-biologicals-store-v1";
  var ORDER_EMAIL = "service@orrbiologicals.com";
  var MAX_QTY = 99;

  var STRAINS = [
    { id: "nanno", name: "Nannochloropsis oculata", image: "/assets/strains/nannochloropsis-oculata.jpg" },
    { id: "tiso", name: "Isochrysis aff. galbana (T-Iso)", image: "/assets/strains/tisochrysis-lutea.jpg" },
    { id: "pavlova", name: "Pavlova lutheri", image: "/assets/strains/pavlova-lutheri.jpg" },
    { id: "chaeto", name: "Chaetoceros muelleri", image: "/assets/strains/chaetoceros-muelleri.jpg" },
    { id: "thal", name: "Thalassiosira pseudonana (3H)", image: "/assets/strains/thalassiosira-pseudonana.jpg" },
    { id: "tetra", name: "Tetraselmis suecica", image: "/assets/strains/tetraselmis-suecica.jpg" }
  ];

  var STRAIN_BY_ID = {};
  STRAINS.forEach(function (strain) { STRAIN_BY_ID[strain.id] = strain; });

  var CATALOG = {
    kit: { name: "One-gallon culture kit", image: "/assets/images/culturekit-hero.jpg", kind: "kit" }
  };
  STRAINS.forEach(function (strain) {
    CATALOG[strain.id] = { name: strain.name, image: strain.image, kind: "culture" };
  });

  var els = {
    layer: document.getElementById("cartLayer"),
    panel: document.getElementById("cartPanel"),
    empty: document.getElementById("cartEmpty"),
    lines: document.getElementById("cartLines"),
    form: document.getElementById("orderForm"),
    subtotal: document.getElementById("cartSubtotal"),
    status: document.getElementById("cartStatus")
  };

  var cart = readCart();
  var lastFocus = null;

  /* ---------- data ---------- */

  function isStrain(id) {
    return Object.prototype.hasOwnProperty.call(STRAIN_BY_ID, id);
  }

  function isValidLine(line) {
    if (!line || !CATALOG[line.id]) return false;
    if (line.id === "kit") return isStrain(line.variant);
    return line.variant === "culture" || line.variant === "salt";
  }

  function normalizeQty(value) {
    var qty = parseInt(value, 10);
    if (!isFinite(qty) || qty < 1) return 1;
    return Math.min(qty, MAX_QTY);
  }

  function readCart() {
    var raw;
    try {
      raw = JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]");
    } catch (error) {
      return [];
    }
    if (!Array.isArray(raw)) return [];
    var clean = [];
    raw.forEach(function (line) {
      if (!line || !isValidLine(line)) return;
      var qty = normalizeQty(line.qty);
      var existing = null;
      for (var i = 0; i < clean.length; i++) {
        if (clean[i].id === line.id && clean[i].variant === line.variant) existing = clean[i];
      }
      if (existing) existing.qty = Math.min(existing.qty + qty, MAX_QTY);
      else clean.push({ id: String(line.id), variant: String(line.variant), qty: qty });
    });
    return clean;
  }

  function saveCart() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(cart));
    } catch (error) {
      /* Private mode or a full store: the cart still works for this page. */
    }
  }

  function unitPrice(id, variant) {
    if (id === "kit") return 2500;
    return variant === "salt" ? 2000 : 1500;
  }

  function lineKey(id, variant) {
    return id + "|" + variant;
  }

  function variantLabel(line) {
    if (line.id === "kit") return "Kit · " + STRAIN_BY_ID[line.variant].name;
    if (line.variant === "salt") return "16 oz culture + f/2 + 1,000 g marine salt";
    return "16 oz culture + 50 mL f/2";
  }

  function lineTotal(line) {
    return unitPrice(line.id, line.variant) * line.qty;
  }

  function cartCount() {
    return cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
  }

  function cartSubtotal() {
    return cart.reduce(function (sum, line) { return sum + lineTotal(line); }, 0);
  }

  function money(cents, exact) {
    var value = cents / 100;
    if (exact || value % 1 !== 0) return "$" + value.toFixed(2);
    return "$" + String(value);
  }

  /* ---------- cart state ---------- */

  function addToCart(id, variant, qty) {
    if (!CATALOG[id]) return;
    if (id === "kit" && !isStrain(variant)) return;
    if (id !== "kit" && variant !== "culture" && variant !== "salt") return;
    qty = normalizeQty(qty);
    var key = lineKey(id, variant);
    var found = null;
    cart.forEach(function (line) {
      if (lineKey(line.id, line.variant) === key) found = line;
    });
    if (found) found.qty = Math.min(found.qty + qty, MAX_QTY);
    else cart.push({ id: id, variant: variant, qty: qty });
    saveCart();
    renderCart();
    announce("Added to cart. " + cartCount() + " item" + (cartCount() === 1 ? "" : "s") + ", " + money(cartSubtotal(), true) + ".");
    openCart();
  }

  function setLineQty(key, delta) {
    cart.forEach(function (line) {
      if (lineKey(line.id, line.variant) !== key) return;
      line.qty = Math.min(MAX_QTY, Math.max(1, line.qty + delta));
    });
    saveCart();
    renderCart();
  }

  function removeLine(key) {
    cart = cart.filter(function (line) { return lineKey(line.id, line.variant) !== key; });
    saveCart();
    renderCart();
    announce("Item removed. " + cartCount() + " item" + (cartCount() === 1 ? "" : "s") + " in the cart.");
  }

  function renderCart() {
    if (!els.lines) return;
    els.lines.textContent = "";
    var hasItems = cart.length > 0;

    if (els.empty) els.empty.hidden = hasItems;
    els.lines.hidden = !hasItems;
    if (els.form) els.form.hidden = !hasItems;

    cart.forEach(function (line) {
      var product = CATALOG[line.id];
      var key = lineKey(line.id, line.variant);
      var item = document.createElement("li");
      item.className = "cart-line";
      item.setAttribute("data-line", key);

      var top = document.createElement("div");
      top.className = "cart-line__top";

      var thumb = document.createElement("img");
      thumb.className = "cart-line__thumb";
      thumb.src = product.image;
      thumb.alt = "";
      thumb.width = 48;
      thumb.height = 48;
      thumb.loading = "lazy";

      var info = document.createElement("div");
      var name = document.createElement("p");
      name.className = "cart-line__name";
      name.textContent = product.kind === "kit" ? "One-gallon culture kit" : product.name;
      var meta = document.createElement("p");
      meta.className = "cart-line__meta";
      meta.textContent = variantLabel(line);
      info.appendChild(name);
      info.appendChild(meta);
      top.appendChild(thumb);
      top.appendChild(info);

      var row = document.createElement("div");
      row.className = "cart-line__row";

      var qty = document.createElement("div");
      qty.className = "qty";
      var minus = document.createElement("button");
      minus.type = "button";
      minus.setAttribute("data-line-step", "-1");
      minus.setAttribute("aria-label", "Decrease quantity of " + (product.kind === "kit" ? "the one-gallon kit" : product.name));
      minus.textContent = "\u2212";
      var value = document.createElement("span");
      value.className = "qty__value";
      value.textContent = String(line.qty);
      var plus = document.createElement("button");
      plus.type = "button";
      plus.setAttribute("data-line-step", "1");
      plus.setAttribute("aria-label", "Increase quantity of " + (product.kind === "kit" ? "the one-gallon kit" : product.name));
      plus.textContent = "+";
      qty.appendChild(minus);
      qty.appendChild(value);
      qty.appendChild(plus);

      var right = document.createElement("div");
      right.className = "cart-line__right";
      var price = document.createElement("span");
      price.className = "cart-line__price";
      price.textContent = money(lineTotal(line), true);
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cart-remove";
      remove.setAttribute("data-line-remove", "");
      remove.textContent = "Remove";
      right.appendChild(price);
      right.appendChild(remove);

      row.appendChild(qty);
      row.appendChild(right);
      item.appendChild(top);
      item.appendChild(row);
      els.lines.appendChild(item);
    });

    if (els.subtotal) els.subtotal.textContent = money(cartSubtotal(), true);
    updateBadges();
  }

  function updateBadges() {
    var count = cartCount();
    var nodes = document.querySelectorAll("[data-cart-count]");
    Array.prototype.forEach.call(nodes, function (node) { node.textContent = String(count); });
    var buttons = document.querySelectorAll("[data-open-cart]");
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute("aria-label", "Open cart, " + count + " item" + (count === 1 ? "" : "s"));
      button.setAttribute("data-empty", count === 0 ? "true" : "false");
    });
  }

  function announce(message) {
    if (!els.status) return;
    els.status.textContent = "";
    window.setTimeout(function () { els.status.textContent = message; }, 40);
  }

  /* ---------- drawer ---------- */

  function openCart() {
    if (!els.layer) return;
    lastFocus = document.activeElement;
    els.layer.hidden = false;
    document.body.classList.add("cart-open");
    if (els.panel) els.panel.focus();
  }

  function closeCart() {
    if (!els.layer || els.layer.hidden) return;
    document.body.classList.remove("cart-open");
    els.layer.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.addEventListener("keydown", function (event) {
    if (!els.layer || els.layer.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeCart();
      return;
    }
    if (event.key !== "Tab" || !els.panel) return;
    var focusable = els.panel.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- product cards ---------- */

  Array.prototype.forEach.call(document.querySelectorAll("[data-product]"), function (card) {
    var id = card.getAttribute("data-product");
    var select = card.querySelector("[data-variant]");
    var qtyInput = card.querySelector("[data-qty-input]");
    var priceEl = card.querySelector("[data-price]");
    var addButton = card.querySelector("[data-add]");
    if (!addButton) return;

    Array.prototype.forEach.call(card.querySelectorAll("[data-step]"), function (button) {
      button.addEventListener("click", function () {
        if (!qtyInput) return;
        var next = normalizeQty(qtyInput.value) + Number(button.getAttribute("data-step"));
        qtyInput.value = String(Math.min(MAX_QTY, Math.max(1, next)));
      });
    });

    if (qtyInput) {
      qtyInput.addEventListener("change", function () {
        qtyInput.value = String(normalizeQty(qtyInput.value));
      });
    }

    if (select && priceEl) {
      select.addEventListener("change", function () {
        priceEl.textContent = money(unitPrice(id, select.value), false);
      });
    }

    addButton.addEventListener("click", function () {
      var variant = select ? select.value : "culture";
      var qty = qtyInput ? qtyInput.value : 1;
      addToCart(id, variant, qty);
    });
  });

  /* ---------- cart controls ---------- */

  Array.prototype.forEach.call(document.querySelectorAll("[data-open-cart]"), function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      openCart();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-close-cart]"), function (button) {
    button.addEventListener("click", closeCart);
  });

  if (els.lines) {
    els.lines.addEventListener("click", function (event) {
      var item = event.target.closest("[data-line]");
      if (!item) return;
      var key = item.getAttribute("data-line");
      var step = event.target.closest("[data-line-step]");
      if (step) {
        setLineQty(key, Number(step.getAttribute("data-line-step")));
        return;
      }
      if (event.target.closest("[data-line-remove]")) removeLine(key);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-clear-cart]"), function (button) {
    button.addEventListener("click", function () {
      cart = [];
      saveCart();
      renderCart();
      announce("Cart cleared.");
    });
  });

  /* ---------- order email ---------- */

  if (els.form) {
    els.form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!cart.length) return;
      var data = new FormData(els.form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var address = String(data.get("address") || "").trim();
      var notes = String(data.get("notes") || "").trim();
      var count = cartCount();

      var lines = cart.map(function (line) {
        var label = CATALOG[line.id].kind === "kit" ? variantLabel(line) : CATALOG[line.id].name + " — " + variantLabel(line);
        return line.qty + " × " + label + " — " + money(lineTotal(line), true);
      });

      var body = [
        "Orr Biologicals store order",
        "",
        lines.join("\n"),
        "",
        "Subtotal: " + money(cartSubtotal(), true),
        "Shipping: quote on reply (US only)",
        "",
        "Name: " + name,
        "Email: " + email,
        "Ship to:",
        address
      ];
      if (notes) body.push("", "Notes: " + notes);

      var subject = "Store order — " + count + " item" + (count === 1 ? "" : "s");
      var href = "mailto:" + ORDER_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body.join("\n"));

      announce("Opening your email app with the order.");
      window.location.href = href;
    });
  }

  renderCart();
})();
