// script.js — сохранение темы на всех страницах
document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const btn = document.getElementById("theme-toggle");

  if (!btn) return;

  const sun = btn.querySelector(".sun");
  const moon = btn.querySelector(".moon");

  // ---- 1) При загрузке применяем сохранённую тему ----
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    html.classList.add("light");
  } else {
    html.classList.remove("light");
  }

  // Функция обновления иконок
  const updateIcon = () => {
    const isLight = html.classList.contains("light");
    sun.style.opacity = isLight ? "0" : "1";
    moon.style.opacity = isLight ? "1" : "0";
  };

  // ---- 2) Кнопка переключения темы ----
  btn.addEventListener("click", () => {
    html.classList.toggle("light");

    // Сохраняем текущую тему
    if (html.classList.contains("light")) {
      localStorage.setItem("theme", "light");
    } else {
      localStorage.setItem("theme", "dark");
    }

    updateIcon();

    // Анимация поворота
    btn.style.transition = "transform 0.6s ease";
    btn.style.transform = "rotate(360deg)";
    setTimeout(() => btn.style.transform = "", 600);
  });

  // ---- 3) Показываем корректную иконку ----
  updateIcon();
});
