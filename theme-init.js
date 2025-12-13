// theme.js — единый файл без конфликтов
(function () {
  const html = document.documentElement;

  // === 1. Применяем тему сразу (до клика) ===
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    html.classList.add("light");
  } else {
    html.classList.remove("light");
  }

  // === 2. Когда DOM готов — подключаем кнопку ===
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme-toggle");
    if (!btn) {
      console.warn("[theme] Кнопка не найдена");
      return;
    }

    const sun = btn.querySelector(".sun");
    const moon = btn.querySelector(".moon");

    function updateIcon() {
      const isLight = html.classList.contains("light");
      if (sun) sun.style.opacity = isLight ? "0" : "1";
      if (moon) moon.style.opacity = isLight ? "1" : "0";
    }

    btn.addEventListener("click", () => {
      html.classList.toggle("light");
      localStorage.setItem(
        "theme",
        html.classList.contains("light") ? "light" : "dark"
      );
      updateIcon();

      // анимация
      btn.style.transition = "transform 0.5s ease";
      btn.style.transform = "rotate(360deg)";
      setTimeout(() => (btn.style.transform = ""), 500);

      console.log("[theme] click OK");
    });

    updateIcon();
  });
})();
