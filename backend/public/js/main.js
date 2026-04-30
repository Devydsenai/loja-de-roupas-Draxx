(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const badge = document.getElementById("api-status");
  if (!badge) return;

  fetch("/api/health")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      badge.classList.remove("bg-secondary");
      badge.classList.add("bg-success");
      badge.textContent = "API online · " + (data.service || "ok");
    })
    .catch(function () {
      badge.classList.remove("bg-secondary");
      badge.classList.add("bg-danger");
      badge.textContent = "API indisponível";
    });
})();
