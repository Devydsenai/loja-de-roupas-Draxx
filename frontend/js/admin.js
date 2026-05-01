(function () {
  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("draxx_admin_user") || "null");
    } catch {
      localStorage.removeItem("draxx_admin_user");
      return null;
    }
  }

  const state = {
    products: [],
    orders: [],
    token: localStorage.getItem("draxx_admin_token") || "",
    user: getStoredUser(),
  };

  const ordersPageState = {
    filter: "all",
    page: 1,
    pageSize: 8,
    sortTotalDesc: false,
    tableSearch: "",
  };

  const MS_DAY = 86400000;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function qs(selector) {
    return document.querySelector(selector);
  }

  function setText(selector, value) {
    const el = qs(selector);
    if (el) el.textContent = value;
  }

  function notify(message, type) {
    const alert = qs("#admin-alert");
    if (!alert) return;
    alert.className = "alert alert-" + (type || "info");
    alert.textContent = message;
    alert.hidden = false;
  }

  function authHeaders() {
    return state.token ? { Authorization: "Bearer " + state.token } : {};
  }

  async function api(path, options) {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error?.message || data?.message || "Erro na API");
    }
    return data;
  }

  function userInitials(name) {
    if (!name || typeof name !== "string") return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function setUserChip() {
    const nameEl = qs("#admin-sidebar-name");
    const emailEl = qs("#admin-sidebar-email");
    const av = qs("#admin-avatar");
    let dashInitials = "?";
    if (state.user) {
      if (nameEl) nameEl.textContent = state.user.name || "Admin";
      if (emailEl) emailEl.textContent = state.user.email || "";
      dashInitials = userInitials(state.user.name || state.user.email || "A");
      if (av) av.textContent = dashInitials;
    } else {
      if (nameEl) nameEl.textContent = "Convidado";
      if (emailEl) emailEl.textContent = "Faça login para continuar";
      if (av) av.textContent = "?";
      dashInitials = "?";
    }
    document.querySelectorAll(".admin-topbar-avatar").forEach((el) => {
      el.textContent = dashInitials;
    });
  }

  function requireAdmin() {
    const protectedPage = document.body.dataset.adminProtected === "true";
    if (!protectedPage) return;

    if (!state.token) {
      notify("Faça login como admin para usar esta área.", "warning");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      if (data.user?.role !== "admin") {
        throw new Error("Este usuário não é administrador.");
      }
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem("draxx_admin_token", data.token);
      localStorage.setItem("draxx_admin_user", JSON.stringify(data.user));
      notify("Login realizado. Dados carregados com sucesso.", "success");
      setUserChip();
      await loadCurrentPage();
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function handleLogout() {
    localStorage.removeItem("draxx_admin_token");
    localStorage.removeItem("draxx_admin_user");
    state.token = "";
    state.user = null;
    setUserChip();
    notify("Sessão encerrada.", "secondary");
  }

  async function loadProducts() {
    state.products = await api("/api/products");
    return state.products;
  }

  async function loadOrders() {
    if (!state.token) return [];
    state.orders = await api("/api/orders/admin/all");
    return state.orders;
  }

  function renderMetrics() {
    const products = state.products;
    const orders = state.orders;
    const revenue = orders.reduce((acc, order) => acc + Number(order.total || 0), 0);
    const stock = products.reduce((acc, product) => acc + Number(product.stock || 0), 0);

    setText("#metric-products", String(products.length));
    setText("#metric-orders", String(orders.length));
    setText("#metric-revenue", currency.format(revenue));
    setText("#metric-stock", String(stock));

    if (qs("#dash-kpi-revenue")) {
      setText("#dash-kpi-revenue", currency.format(revenue));
      setText("#dash-kpi-orders", String(orders.length));
      const paid = orders.filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status)).length;
      setText("#dash-kpi-paid-pct", orders.length ? `${Math.round((paid / orders.length) * 100)}%` : "—");
      const activeN = products.filter((p) => p.active).length;
      setText("#dash-kpi-catalog-hint", `${activeN} ativos`);
      const pending = orders.filter((o) => o.status === "PENDING").length;
      const canceled = orders.filter((o) => o.status === "CANCELLED").length;
      setText("#dash-kpi-pending", String(pending));
      setText("#dash-kpi-canceled", String(canceled));
      setText(
        "#dash-kpi-canceled-note",
        orders.length ? `↓ ${Math.round((canceled / orders.length) * 100)}% do total` : "—",
      );
      const uniq = new Set(orders.map((o) => o.customer_email).filter(Boolean)).size;
      setText("#dash-m-customers", String(uniq || orders.length || 0));
      setText("#metric-products-2", String(products.length));
      const inStock = products.filter((p) => Number(p.stock) > 0).length;
      const outStock = products.filter((p) => Number(p.stock) === 0).length;
      setText("#dash-m-instock", String(inStock));
      setText("#dash-m-outstock", String(outStock));
      setText("#dash-m-revenue-short", currency.format(revenue));

      const kEl = qs("#dash-side-orders-k");
      if (kEl && orders.length >= 1000) kEl.textContent = `${(orders.length / 1000).toFixed(1).replace(/\.0$/, "")}k`;
      else if (kEl) kEl.textContent = String(orders.length);
    }
  }

  function applyStoredAdminTheme() {
    if (localStorage.getItem("draxx_admin_theme") === "dark") {
      document.body.classList.add("admin-theme-dark");
    }
  }

  function bindAdminThemeToggles() {
    document.querySelectorAll("[data-admin-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.body.classList.toggle("admin-theme-dark");
        localStorage.setItem(
          "draxx_admin_theme",
          document.body.classList.contains("admin-theme-dark") ? "dark" : "light",
        );
      });
    });
  }

  const ORD_SVG_TRUCK =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 18V6H4v11a1 1 0 001 1h1m8 0h4l3-6V9h-5M4 18h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="18" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="17" cy="18" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>';
  const ORD_SVG_CLOCK =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4.5l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ORD_SVG_X =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function pctDelta(cur, prev) {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  }

  function renderOrdersKpis() {
    if (!qs("#ord-kpi-total")) return;
    const orders = state.orders;
    const now = Date.now();
    const cutoff7 = now - 7 * MS_DAY;
    const cutoff14 = now - 14 * MS_DAY;
    const inLast7 = (o) => new Date(o.created_at).getTime() >= cutoff7;
    const inPrev7 = (o) => {
      const t = new Date(o.created_at).getTime();
      return t >= cutoff14 && t < cutoff7;
    };

    const tot7 = orders.filter(inLast7).length;
    const totPrev = orders.filter(inPrev7).length;
    const new7 = tot7;
    const newPrev = totPrev;
    const done7 = orders.filter((o) => o.status === "DELIVERED" && inLast7(o)).length;
    const donePrev = orders.filter((o) => o.status === "DELIVERED" && inPrev7(o)).length;
    const can7 = orders.filter((o) => o.status === "CANCELLED" && inLast7(o)).length;
    const canPrev = orders.filter((o) => o.status === "CANCELLED" && inPrev7(o)).length;

    setText("#ord-kpi-total", String(orders.length));

    const tTot = pctDelta(tot7, totPrev);
    const elTot = qs("#ord-kpi-total-trend");
    if (elTot) {
      elTot.textContent = `${tTot >= 0 ? "↑" : "↓"} ${Math.abs(tTot)}%`;
      elTot.className =
        "ord-kpi-card__trend " + (tTot >= 0 ? "ord-kpi-card__trend--up" : "ord-kpi-card__trend--down");
    }

    setText("#ord-kpi-new", String(new7));
    const tNew = pctDelta(new7, newPrev);
    const elNew = qs("#ord-kpi-new-trend");
    if (elNew) {
      elNew.textContent = `${tNew >= 0 ? "↑" : "↓"} ${Math.abs(tNew)}%`;
      elNew.className =
        "ord-kpi-card__trend " + (tNew >= 0 ? "ord-kpi-card__trend--up" : "ord-kpi-card__trend--down");
    }

    const doneAll = orders.filter((o) => o.status === "DELIVERED").length;
    setText("#ord-kpi-done", String(doneAll));
    const tDone = pctDelta(done7, donePrev);
    const elDone = qs("#ord-kpi-done-trend");
    if (elDone) {
      elDone.textContent = `${tDone >= 0 ? "↑" : "↓"} ${Math.abs(tDone)}%`;
      elDone.className =
        "ord-kpi-card__trend " + (tDone >= 0 ? "ord-kpi-card__trend--up" : "ord-kpi-card__trend--down");
    }

    const canAll = orders.filter((o) => o.status === "CANCELLED").length;
    setText("#ord-kpi-canceled", String(canAll));
    const tCan = pctDelta(can7, canPrev);
    const elCan = qs("#ord-kpi-canceled-trend");
    if (elCan) {
      if (tCan === 0) {
        elCan.textContent = "—";
        elCan.className = "ord-kpi-card__trend ord-kpi-card__trend--up";
      } else if (tCan > 0) {
        elCan.textContent = `↑ ${tCan}%`;
        elCan.className = "ord-kpi-card__trend ord-kpi-card__trend--down";
      } else {
        elCan.textContent = `↓ ${Math.abs(tCan)}%`;
        elCan.className = "ord-kpi-card__trend ord-kpi-card__trend--up";
      }
    }
  }

  function getFilteredOrdersList() {
    let list = [...state.orders];
    const f = ordersPageState.filter;
    if (f === "completed") list = list.filter((o) => o.status === "DELIVERED");
    else if (f === "pending") list = list.filter((o) => ["PENDING", "PAID"].includes(o.status));
    else if (f === "canceled") list = list.filter((o) => o.status === "CANCELLED");

    const q = ordersPageState.tableSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const blob = [
          String(o.id),
          o.customer_name,
          o.customer_email,
          o.first_product_name,
          o.status,
          o.payment_method,
        ]
          .map((p) => String(p || "").toLowerCase())
          .join(" ");
        return blob.includes(q);
      });
    }

    list.sort((a, b) => {
      if (ordersPageState.sortTotalDesc) return Number(b.total) - Number(a.total);
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return list;
  }

  function syncOrdTabActive() {
    document.querySelectorAll(".ord-tab").forEach((t) => {
      const fl = t.getAttribute("data-ord-filter");
      t.classList.toggle("is-active", fl === ordersPageState.filter);
    });
  }

  function updateOrdTabCounts() {
    const el = qs("#ord-tab-count-all");
    if (el) el.textContent = `(${state.orders.length})`;
  }

  function orderPaymentCell(status) {
    if (status === "CANCELLED") {
      return `<span class="ord-pay"><span class="ord-dot ord-dot--muted"></span>—</span>`;
    }
    if (status === "PENDING") {
      return `<span class="ord-pay"><span class="ord-dot ord-dot--bad"></span>Não pago</span>`;
    }
    return `<span class="ord-pay"><span class="ord-dot ord-dot--ok"></span>Pago</span>`;
  }

  function orderStatusCell(status) {
    let cls = "ord-status-pill--pending";
    let label = status || "—";
    let icon = ORD_SVG_CLOCK;
    switch (status) {
      case "DELIVERED":
        cls = "ord-status-pill--delivered";
        label = "Entregue";
        icon = ORD_SVG_TRUCK;
        break;
      case "SHIPPED":
        cls = "ord-status-pill--shipped";
        label = "Enviado";
        icon = ORD_SVG_TRUCK;
        break;
      case "PENDING":
        label = "Pendente";
        icon = ORD_SVG_CLOCK;
        break;
      case "PAID":
        label = "Pago · envio";
        icon = ORD_SVG_CLOCK;
        break;
      case "CANCELLED":
        cls = "ord-status-pill--cancel";
        label = "Cancelado";
        icon = ORD_SVG_X;
        break;
      default:
        break;
    }
    return `<span class="ord-status-pill ${cls}">${icon}<span>${label}</span></span>`;
  }

  function orderMgmtRow(order, displayIndex) {
    const n = Number(order.order_item_count) || 0;
    const extra =
      n > 1
        ? ` <span class="small" style="color:var(--admin-muted)">+${n - 1} itens</span>`
        : "";
    const thumb = order.first_product_image
      ? `<img src="${escapeHtml(order.first_product_image)}" alt="">`
      : `<span class="ord-product-ph">DX</span>`;
    const pName = escapeHtml(order.first_product_name || "Itens do pedido");
    return `
      <tr>
        <td><input type="checkbox" class="form-check-input mt-0 ord-row-check" aria-label="Selecionar pedido" /></td>
        <td>${displayIndex + 1}</td>
        <td><strong>#${order.id}</strong><div class="small" style="color:var(--admin-muted)">${escapeHtml(order.customer_name || "—")}</div></td>
        <td>
          <div class="ord-product-cell">
            ${thumb}
            <div><strong class="d-block">${pName}</strong>${extra}</div>
          </div>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
        <td><strong>${currency.format(Number(order.total || 0))}</strong></td>
        <td>${orderPaymentCell(order.status)}</td>
        <td>${orderStatusCell(order.status)}</td>
      </tr>`;
  }

  function renderOrdersPaginationControls(totalPages, totalItems) {
    const wrap = qs("#orders-pagination-pages");
    const prev = qs("#orders-page-prev");
    const next = qs("#orders-page-next");
    if (!wrap || !prev || !next) return;

    let page = ordersPageState.page;
    if (totalItems === 0) {
      wrap.innerHTML = "";
      prev.disabled = true;
      next.disabled = true;
      return;
    }
    if (page > totalPages) {
      ordersPageState.page = totalPages;
      page = totalPages;
    }
    prev.disabled = page <= 1;
    next.disabled = page >= totalPages;

    const pageBtn = (n, active) =>
      `<button type="button" class="ord-page-btn${active ? " is-active" : ""}" data-ord-page="${n}">${n}</button>`;

    if (totalPages <= 7) {
      let html = "";
      for (let i = 1; i <= totalPages; i += 1) html += pageBtn(i, i === page);
      wrap.innerHTML = html;
      return;
    }

    const parts = [];
    const add = (h) => parts.push(h);
    const windowSize = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);

    if (start > 1) {
      add(pageBtn(1, page === 1));
      if (start > 2) add('<span class="ord-page-ellipsis">…</span>');
    }
    for (let i = start; i <= end; i += 1) add(pageBtn(i, page === i));
    if (end < totalPages) {
      if (end < totalPages - 1) add('<span class="ord-page-ellipsis">…</span>');
      add(pageBtn(totalPages, page === totalPages));
    }
    wrap.innerHTML = parts.join("");
  }

  function renderOrdersPage() {
    if (document.body.dataset.adminPage !== "orders" || !qs("#orders-table")) return;

    updateOrdTabCounts();
    syncOrdTabActive();

    const filtered = getFilteredOrdersList();
    const totalItems = filtered.length;
    const { pageSize } = ordersPageState;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

    renderOrdersPaginationControls(totalPages, totalItems);

    const tbody = qs("#orders-table");
    if (!state.token) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary py-4">Faça login para ver pedidos.</td></tr>`;
      return;
    }
    if (!totalItems) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary py-4">Nenhum pedido neste filtro.</td></tr>`;
      return;
    }

    const page = Math.min(ordersPageState.page, totalPages);
    ordersPageState.page = page;
    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);
    tbody.innerHTML = slice.map((o, i) => orderMgmtRow(o, start + i)).join("");
  }

  function bindOrdersPage() {
    if (document.body.dataset.adminPage !== "orders") return;
    const main = qs(".admin-main--orders");
    if (!main || main.dataset.ordersBound === "1") return;
    main.dataset.ordersBound = "1";

    main.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-ord-filter]");
      if (tab && main.contains(tab)) {
        ordersPageState.filter = tab.getAttribute("data-ord-filter") || "all";
        ordersPageState.page = 1;
        syncOrdTabActive();
        renderOrdersPage();
        return;
      }
      const pg = e.target.closest("[data-ord-page]");
      if (pg) {
        ordersPageState.page = Number(pg.getAttribute("data-ord-page")) || 1;
        renderOrdersPage();
      }
    });

    qs("#orders-page-prev")?.addEventListener("click", () => {
      if (ordersPageState.page > 1) {
        ordersPageState.page -= 1;
        renderOrdersPage();
      }
    });
    qs("#orders-page-next")?.addEventListener("click", () => {
      const filtered = getFilteredOrdersList();
      const totalPages = Math.max(1, Math.ceil(filtered.length / ordersPageState.pageSize) || 1);
      if (ordersPageState.page < totalPages) {
        ordersPageState.page += 1;
        renderOrdersPage();
      }
    });

    qs("#orders-table-search")?.addEventListener("input", (e) => {
      ordersPageState.tableSearch = e.target.value;
      ordersPageState.page = 1;
      renderOrdersPage();
    });

    qs("#orders-global-search")?.addEventListener("input", (e) => {
      ordersPageState.tableSearch = e.target.value;
      ordersPageState.page = 1;
      const tableInput = qs("#orders-table-search");
      if (tableInput && tableInput !== e.target) tableInput.value = e.target.value;
      renderOrdersPage();
    });

    qs("#orders-sort-toggle")?.addEventListener("click", () => {
      ordersPageState.sortTotalDesc = !ordersPageState.sortTotalDesc;
      qs("#orders-sort-toggle")?.classList.toggle("is-active", ordersPageState.sortTotalDesc);
      renderOrdersPage();
    });

    qs("#orders-filter-pop")?.addEventListener("click", () => {
      notify("Filtros avançados em breve — use as abas e a busca.", "secondary");
    });

    qs("#orders-more-action")?.addEventListener("click", () => {
      notify("Mais ações em breve.", "secondary");
    });
  }

  const DASH_FASHION_ICONS = [
    '<svg class="dash-spot-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5l2-2h6l2 2v3h-2l-1.4 14h-4.2L9 8H7V5z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/></svg>',
    '<svg class="dash-spot-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6l1.5 3H18a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h1.5L9 3zM9 11h6" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '<svg class="dash-spot-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8h12v11a2 2 0 01-2 2H8a2 2 0 01-2-2V8zM9 8V6a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  ];

  function renderDashboardAreaChart() {
    const el = qs("#dash-area-chart");
    if (!el) return;
    let vals = state.orders.slice(0, 7).map((o) => Number(o.total || 0));
    vals.reverse();
    while (vals.length < 7) vals.unshift(0);
    vals = vals.slice(-7);
    const max = Math.max(...vals, 1);
    const W = 640;
    const H = 210;
    const padL = 36;
    const padR = 16;
    const padT = 16;
    const padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const n = vals.length;
    const step = n > 1 ? chartW / (n - 1) : 0;
    const pts = vals.map((v, i) => {
      const x = padL + i * step;
      const y = padT + chartH - (v / max) * chartH * 0.9;
      return [x, y];
    });
    let lineD = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i += 1) lineD += ` L ${pts[i][0]},${pts[i][1]}`;
    const areaD = `${lineD} L ${pts[n - 1][0]},${padT + chartH} L ${pts[0][0]},${padT + chartH} Z`;
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const xLabels = days
      .map((d, i) => {
        const x = padL + i * step;
        return `<text class="dash-chart-axis" x="${x}" y="${H - 6}" text-anchor="middle">${d}</text>`;
      })
      .join("");
    const yTicks = [0, 0.5, 1].map((t) => {
      const val = Math.round(max * t);
      const y = padT + chartH - t * chartH * 0.9;
      return `<text class="dash-chart-axis" x="6" y="${y + 4}">${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}</text>`;
    });
    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Valores de pedidos ao longo da semana">
        <defs>
          <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${yTicks.join("")}
        <path d="${areaD}" fill="url(#dashAreaGrad)" stroke="none"/>
        <path d="${lineD}" fill="none" stroke="#5b21b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#7c3aed" stroke-width="2"/>`).join("")}
        ${xLabels}
      </svg>`;
  }

  function renderMiniBars() {
    const el = qs("#dash-mini-bars");
    if (!el) return;
    const totals = state.orders.slice(0, 10).map((o) => Number(o.total || 0));
    const max = Math.max(...totals, 1);
    const bars = totals.length
      ? totals.map((t) => {
          const h = Math.max(12, Math.round((t / max) * 100));
          return `<span style="height:${h}%"></span>`;
        })
      : Array.from({ length: 8 }, () => `<span style="height:22%"></span>`);
    el.innerHTML = bars.join("");
  }

  function renderProductSpotlight() {
    const el = qs("#dash-product-spotlight");
    if (!el) return;
    const list = state.products.slice(0, 3);
    const maxStock = Math.max(...state.products.map((p) => Number(p.stock) || 0), 1);
    if (!list.length) {
      el.innerHTML =
        '<p class="small text-secondary mb-0">Cadastre peças no catálogo para ver destaques com ícones de moda.</p>';
      return;
    }
    el.innerHTML = list
      .map((p, i) => {
        const stock = Number(p.stock) || 0;
        const pct = Math.min(100, Math.round((stock / maxStock) * 100));
        const up = stock > 0;
        const iconInner = p.image_url
          ? `<img src="${escapeHtml(p.image_url)}" alt="">`
          : DASH_FASHION_ICONS[i % DASH_FASHION_ICONS.length];
        const delta = up ? `+${pct}% estoque` : "Sem unidades";
        return `
          <div class="dash-spot-row">
            <div class="dash-spot-icon-wrap">${iconInner}</div>
            <div class="dash-spot-meta">
              <strong>${escapeHtml(p.name)}</strong>
              <span>${escapeHtml((p.description || "").slice(0, 42))}${(p.description || "").length > 42 ? "…" : ""}</span>
            </div>
            <div class="text-end">
              <div class="dash-spot-bar"><i style="width:${pct}%"></i></div>
              <span class="dash-spot-pct ${up ? "dash-spot-pct--up" : "dash-spot-pct--down"}">${delta}</span>
            </div>
          </div>`;
      })
      .join("");
  }

  function dashboardOrderStatusDot(status) {
    if (["PAID", "DELIVERED", "SHIPPED"].includes(status)) return ["ok", "Pago / envio"];
    if (status === "CANCELLED") return ["danger", "Cancelado"];
    if (status === "PENDING") return ["warn", "Pendente"];
    return ["warn", status || "—"];
  }

  function dashboardOrderRow(order, i) {
    const [dot, label] = dashboardOrderStatusDot(order.status);
    return `
      <tr>
        <td>${i + 1}</td>
        <td>#${order.id}</td>
        <td>
          <strong>${escapeHtml(order.customer_name || "—")}</strong>
          <div class="small text-secondary">${escapeHtml(order.customer_email || "")}</div>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
        <td><span class="dash-status"><span class="dash-dot dash-dot--${dot}"></span>${label}</span></td>
        <td class="text-end">${currency.format(Number(order.total || 0))}</td>
      </tr>`;
  }

  function renderDashboardOrdersTable() {
    const tbody = qs("#latest-orders-table");
    if (!tbody) return;
    const rows = state.orders.slice(0, 6);
    tbody.innerHTML = rows.length
      ? rows.map((o, i) => dashboardOrderRow(o, i)).join("")
      : `<tr><td colspan="6" class="text-center text-secondary py-4">Nenhum pedido listado.</td></tr>`;
  }

  function dashboardProductRow(product) {
    const stock = Number(product.stock) || 0;
    const ok = stock > 0;
    const thumb = product.image_url
      ? `<img class="dash-product-thumb" src="${escapeHtml(product.image_url)}" alt="">`
      : `<span class="dash-product-thumb dash-product-thumb--placeholder">DX</span>`;
    return `
      <tr>
        <td>
          <div class="dash-product-cell">
            ${thumb}
            <div><strong>${escapeHtml(product.name)}</strong></div>
          </div>
        </td>
        <td>—</td>
        <td>
          <span class="dash-status">
            <span class="dash-dot dash-dot--${ok ? "ok" : "danger"}"></span>${ok ? "Em estoque" : "Sem estoque"}
          </span>
        </td>
        <td class="text-end">${currency.format(Number(product.price || 0))}</td>
      </tr>`;
  }

  function renderDashboardProductsTable() {
    const tbody = qs("#latest-products-table");
    if (!tbody) return;
    const list = [...state.products].sort((a, b) => Number(b.stock) - Number(a.stock)).slice(0, 6);
    tbody.innerHTML = list.length
      ? list.map(dashboardProductRow).join("")
      : `<tr><td colspan="4" class="text-center text-secondary py-4">Nenhum produto.</td></tr>`;
  }

  function renderTopProductsList() {
    const ul = qs("#dash-top-products-list");
    if (!ul) return;
    const list = state.products.slice(0, 8);
    ul.innerHTML = list.length
      ? list
          .map((p) => {
            const thumb = p.image_url
              ? `<img class="dash-product-thumb" src="${escapeHtml(p.image_url)}" alt="">`
              : `<span class="dash-product-thumb dash-product-thumb--placeholder">DX</span>`;
            const key = escapeHtml((p.name || "").toLowerCase());
            return `<li class="dash-top-item" data-search="${key}">
            ${thumb}
            <div class="flex-grow-1 min-w-0">
              <strong class="d-block text-truncate">${escapeHtml(p.name)}</strong>
              <span class="small text-secondary">#${p.id}</span>
            </div>
            <strong>${currency.format(Number(p.price || 0))}</strong>
          </li>`;
          })
          .join("")
      : '<li class="text-secondary small px-1">Sem produtos no catálogo.</li>';
  }

  function bindDashboardWidgets() {
    qs("#dash-product-search")?.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      qs("#dash-top-products-list")?.querySelectorAll(".dash-top-item").forEach((li) => {
        const s = li.dataset.search || "";
        li.hidden = Boolean(q && !s.includes(q));
      });
    });
    const pills = document.querySelectorAll(".dash-metric-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("is-active"));
        pill.classList.add("is-active");
      });
    });
  }

  function renderDashboard() {
    if (document.body.dataset.adminPage !== "dashboard" || !qs("#dash-board")) return;
    renderDashboardAreaChart();
    renderMiniBars();
    renderProductSpotlight();
    renderDashboardOrdersTable();
    renderDashboardProductsTable();
    renderTopProductsList();
  }

  function productRow(product) {
    return `
      <tr>
        <td>
          <strong>${escapeHtml(product.name)}</strong>
          <div class="small text-secondary">${escapeHtml(product.description)}</div>
        </td>
        <td>${currency.format(Number(product.price || 0))}</td>
        <td>${Number(product.stock || 0)}</td>
        <td>
          <span class="badge text-bg-${product.active ? "success" : "secondary"}">
            ${product.active ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary" type="button" data-edit-product="${product.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" type="button" data-delete-product="${product.id}">Excluir</button>
        </td>
      </tr>
    `;
  }

  function renderProductsTable(selector) {
    const tbody = qs(selector || "#products-table");
    if (!tbody) return;
    tbody.innerHTML = state.products.length
      ? state.products.map(productRow).join("")
      : `<tr><td colspan="5" class="text-center text-secondary py-4">Nenhum produto cadastrado.</td></tr>`;
  }

  function fillProductForm(product) {
    const form = qs("#product-form");
    if (!form || !product) return;
    form.elements.id.value = product.id;
    form.elements.name.value = product.name || "";
    form.elements.description.value = product.description || "";
    form.elements.price.value = product.price || "";
    form.elements.stock.value = product.stock || "";
    form.elements.imageUrl.value = product.image_url || "";
    form.elements.active.checked = Boolean(product.active);
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!state.token) {
      notify("Faça login como admin antes de salvar produtos.", "warning");
      return;
    }
    const payload = {
      name: form.elements.name.value,
      description: form.elements.description.value,
      price: Number(form.elements.price.value),
      stock: Number(form.elements.stock.value),
      imageUrl: form.elements.imageUrl.value || undefined,
      active: form.elements.active.checked,
    };
    const id = form.elements.id.value;
    try {
      await api(id ? `/api/products/${id}` : "/api/products", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      form.reset();
      form.elements.active.checked = true;
      notify("Produto salvo com sucesso.", "success");
      await loadProducts();
      renderProductsTable();
      renderMetrics();
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function handleTableClick(event) {
    const editId = event.target.dataset.editProduct;
    const deleteId = event.target.dataset.deleteProduct;
    if (editId) {
      fillProductForm(state.products.find((item) => String(item.id) === editId));
    }
    if (deleteId) {
      if (!state.token) {
        notify("Faça login como admin antes de excluir produtos.", "warning");
        return;
      }
      if (!window.confirm("Excluir este produto?")) return;
      try {
        await api(`/api/products/${deleteId}`, { method: "DELETE" });
        notify("Produto excluído.", "success");
        await loadProducts();
        renderProductsTable();
        renderMetrics();
      } catch (error) {
        notify(error.message, "danger");
      }
    }
  }

  async function loadCurrentPage() {
    const page = document.body.dataset.adminPage;
    try {
      await loadProducts();
      if (state.token) await loadOrders();
      if (page === "dashboard") {
        renderMetrics();
        renderDashboard();
      }
      if (page === "products") {
        renderMetrics();
        renderProductsTable();
      }
      if (page === "orders") {
        renderOrdersKpis();
        renderOrdersPage();
      }
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function bindEvents() {
    applyStoredAdminTheme();
    bindAdminThemeToggles();

    qs("#login-form")?.addEventListener("submit", handleLogin);
    qs("#logout-button")?.addEventListener("click", handleLogout);
    qs("#product-form")?.addEventListener("submit", handleProductSubmit);
    qs("#products-table")?.addEventListener("click", handleTableClick);

    bindDashboardWidgets();
    bindOrdersPage();

    const layout = qs(".admin-layout");
    const collapseBtn = qs("#admin-sidebar-collapse");
    if (layout && collapseBtn) {
      const key = "draxx_admin_sidebar_collapsed";
      if (localStorage.getItem(key) === "1") layout.classList.add("admin-layout--collapsed");
      collapseBtn.addEventListener("click", () => {
        layout.classList.toggle("admin-layout--collapsed");
        localStorage.setItem(key, layout.classList.contains("admin-layout--collapsed") ? "1" : "0");
      });
    }
  }

  setUserChip();
  requireAdmin();
  bindEvents();
  loadCurrentPage();
})();
