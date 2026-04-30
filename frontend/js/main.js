(function () {
  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  let products = [];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function setApiStatus(status, text) {
    const badge = document.getElementById("api-status");
    if (!badge) return;
    badge.className = "badge rounded-pill bg-" + status;
    badge.textContent = text;
  }

  function productCard(product) {
    const name = escapeHtml(product.name);
    const description = escapeHtml(
      product.description || "Produto premium da coleção Draxx.",
    );
    const image = product.image_url
      ? `<img src="${escapeHtml(product.image_url)}" alt="${name}" loading="lazy" />`
      : `<span class="product-placeholder">DX</span>`;
    const status = product.active
      ? `<span class="badge text-bg-success">Disponível</span>`
      : `<span class="badge text-bg-secondary">Indisponível</span>`;

    return `
      <div class="col-sm-6 col-lg-4">
        <article class="card h-100 card-product">
          <div class="product-image">${image}</div>
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between gap-3 align-items-start mb-2">
              <h3 class="h6 card-title mb-0">${name}</h3>
              ${status}
            </div>
            <p class="card-text small text-secondary flex-grow-1">
              ${description}
            </p>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <strong class="text-accent">${currency.format(Number(product.price || 0))}</strong>
              <small class="text-secondary">${Number(product.stock || 0)} em estoque</small>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function renderProducts(filter) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    const visible =
      filter === "active" ? products.filter((product) => product.active) : products;

    if (visible.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <div>
              <h3 class="h5 text-white">Nenhum produto encontrado</h3>
              <p class="mb-0">Cadastre produtos no painel admin para preencher a vitrine.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = visible.map(productCard).join("");
  }

  function bindFilters() {
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-filter]").forEach((item) => {
          item.classList.remove("btn-accent");
          item.classList.add("btn-outline-light");
        });
        button.classList.add("btn-accent");
        button.classList.remove("btn-outline-light");
        renderProducts(button.dataset.filter || "all");
      });
    });
  }

  async function loadProducts() {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("HTTP " + response.status);
    products = await response.json();
    setApiStatus("success", "API online · produtos carregados");
    renderProducts("all");
  }

  async function checkApi() {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }

  setYear();
  bindFilters();

  checkApi()
    .then(() => loadProducts())
    .catch(() => {
      setApiStatus("danger", "API indisponível");
      renderProducts("all");
    });
})();
