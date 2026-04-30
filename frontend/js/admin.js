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

  function setUserChip() {
    const userChip = qs("#admin-user");
    if (!userChip) return;
    userChip.textContent = state.user
      ? `${state.user.name} · ${state.user.role}`
      : "Sem login";
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
  }

  function renderChart() {
    const chart = qs("#sales-chart");
    if (!chart) return;
    const totals = state.orders.slice(0, 7).map((order) => Number(order.total || 0));
    const max = Math.max(...totals, 1);
    chart.innerHTML = totals
      .concat(Array(Math.max(0, 7 - totals.length)).fill(0))
      .slice(0, 7)
      .reverse()
      .map((value) => {
        const height = Math.max(20, Math.ceil((value / max) * 10) * 10);
        return `<span class="chart-h-${height}" title="${currency.format(value)}"></span>`;
      })
      .join("");
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
          <button class="btn btn-sm btn-outline-light" data-edit-product="${product.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-delete-product="${product.id}">Excluir</button>
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

  function orderRow(order) {
    return `
      <tr>
        <td>#${order.id}</td>
        <td>
          <strong>${escapeHtml(order.customer_name || "Cliente")}</strong>
          <div class="small text-secondary">${escapeHtml(order.customer_email || "")}</div>
        </td>
        <td>${currency.format(Number(order.total || 0))}</td>
        <td><span class="badge text-bg-warning">${escapeHtml(order.status)}</span></td>
        <td>${new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
      </tr>
    `;
  }

  function renderOrdersTable(selector) {
    const tbody = qs(selector || "#orders-table");
    if (!tbody) return;
    tbody.innerHTML = state.orders.length
      ? state.orders.map(orderRow).join("")
      : `<tr><td colspan="5" class="text-center text-secondary py-4">Entre como admin para listar pedidos.</td></tr>`;
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
        renderChart();
        renderProductsTable("#latest-products-table");
        renderOrdersTable("#latest-orders-table");
      }
      if (page === "products") {
        renderMetrics();
        renderProductsTable();
      }
      if (page === "orders") {
        renderMetrics();
        renderOrdersTable();
      }
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function bindEvents() {
    qs("#login-form")?.addEventListener("submit", handleLogin);
    qs("#logout-button")?.addEventListener("click", handleLogout);
    qs("#product-form")?.addEventListener("submit", handleProductSubmit);
    qs("#products-table")?.addEventListener("click", handleTableClick);
    qs("#latest-products-table")?.addEventListener("click", handleTableClick);
  }

  setUserChip();
  requireAdmin();
  bindEvents();
  loadCurrentPage();
})();
