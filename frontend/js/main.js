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

  function productCard(product) {
    const name = escapeHtml(product.name);
    const description = escapeHtml(
      product.description || "Produto premium da coleção Draxx.",
    );
    const image = product.image_url
      ? `<img src="${escapeHtml(product.image_url)}" alt="${name}" loading="lazy" />`
      : `<span class="product-placeholder">DX</span>`;
    const isActive = product.active !== false && product.active !== 0;
    const status = isActive
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
      filter === "active"
        ? products.filter((product) => product.active !== false && product.active !== 0)
        : products;

    if (visible.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <div>
              <h3 class="h5 empty-state__title">Nenhum produto encontrado</h3>
              <p class="mb-0">
                Cadastre itens no painel admin ou, com o banco vazio, rode
                <code>npm run seed:products</code> na pasta <code>backend</code>.
              </p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = visible.map(productCard).join("");
  }

  function initHorizontalCarousel(rootSelector, itemSelector) {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const viewport = root.querySelector(".explore-carousel__viewport");
    const track = root.querySelector(".explore-carousel__track");
    const prevBtn = root.querySelector(".explore-carousel__prev");
    const nextBtn = root.querySelector(".explore-carousel__next");
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    function gapPx() {
      const g = getComputedStyle(track).gap || getComputedStyle(track).columnGap;
      const n = parseFloat(g, 10);
      return Number.isFinite(n) ? n : 16;
    }

    function step() {
      const first = track.querySelector(itemSelector);
      if (!first) return viewport.clientWidth * 0.45;
      const rect = first.getBoundingClientRect();
      return rect.width + gapPx();
    }

    function maxScroll() {
      return Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    }

    function updateArrows() {
      const left = viewport.scrollLeft;
      const max = maxScroll();
      const eps = 3;
      const atStart = left <= eps;
      const atEnd = left >= max - eps;
      prevBtn.disabled = atStart;
      nextBtn.disabled = atEnd || max <= eps;
      prevBtn.setAttribute("aria-disabled", atStart ? "true" : "false");
      nextBtn.setAttribute("aria-disabled", nextBtn.disabled ? "true" : "false");
      prevBtn.classList.toggle("is-disabled", atStart);
      nextBtn.classList.toggle("is-disabled", nextBtn.disabled);
    }

    prevBtn.addEventListener("click", () => {
      viewport.scrollBy({ left: -step(), behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
      viewport.scrollBy({ left: step(), behavior: "smooth" });
    });

    viewport.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        viewport.scrollBy({ left: step(), behavior: "smooth" });
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        viewport.scrollBy({ left: -step(), behavior: "smooth" });
      }
    });

    requestAnimationFrame(() => {
      updateArrows();
    });
  }

  function bindFilters() {
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-filter]").forEach((item) => {
          item.classList.remove("btn-accent");
          item.classList.add("btn-outline-secondary");
        });
        button.classList.add("btn-accent");
        button.classList.remove("btn-outline-secondary");
        renderProducts(button.dataset.filter || "all");
      });
    });
  }

  async function loadProducts() {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Erro ao listar produtos (HTTP " + response.status + ").");
    }
    const ct = response.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      throw new Error("Resposta não é JSON — abra o site pelo servidor Node (npm run dev na pasta backend).");
    }
    const data = await response.json();
    products = Array.isArray(data) ? data : [];
    renderProducts("all");
  }

  async function checkApi() {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("API indisponível (HTTP " + response.status + ").");
    return response.json();
  }

  function showCatalogError(err) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;
    const detail = err && err.message
      ? `<p class="mb-0 small text-secondary mt-2">${escapeHtml(err.message)}</p>`
      : "";
    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <div>
            <h3 class="h5 empty-state__title">Não foi possível carregar o catálogo</h3>
            <p class="mb-0">
              Inicie a API na pasta <code>backend</code> (<code>npm run dev</code>) com <code>DATABASE_URL</code>
              e <code>JWT_SECRET</code> no <code>.env</code>. Acesse a loja em <code>http://localhost:3000</code>
              (mesmo servidor que entrega o HTML e a API).
            </p>
            ${detail}
          </div>
        </div>
      </div>
    `;
  }

  function syncDealSubNav() {
    const nav = document.querySelector(".deal-sub-right");
    if (!nav) return;

    const hash = location.hash || "";
    const links = [...nav.querySelectorAll("a")];
    let matched = links.find((a) => {
      const href = a.getAttribute("href") || "";
      return href.startsWith("#") && href === hash;
    });
    if (!matched) {
      matched = links.find((a) => (a.getAttribute("href") || "") === "/") || links[0];
    }

    links.forEach((a) => {
      const on = a === matched;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    const offcanvas = document.getElementById("dealMobileNav");
    if (offcanvas) {
      const activeHref = matched.getAttribute("href") || "/";
      offcanvas.querySelectorAll("a.deal-offcanvas__link").forEach((a) => {
        const h = a.getAttribute("href") || "";
        const on = h === activeHref;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    }
  }

  setYear();
  syncDealSubNav();
  window.addEventListener("hashchange", syncDealSubNav);
  window.addEventListener("pageshow", syncDealSubNav);
  bindFilters();
  initHorizontalCarousel("[data-explore-carousel]", ".explore-cat-card");
  initHorizontalCarousel("[data-limited-carousel]", ".deal-product-card");

  checkApi()
    .then(() => loadProducts())
    .catch(showCatalogError);
})();
