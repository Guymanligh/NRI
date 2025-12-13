// script.js — темы
document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const sun = btn.querySelector(".sun");
  const moon = btn.querySelector(".moon");

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    html.classList.add("light");
  } else {
    html.classList.remove("light");
  }

  const updateIcon = () => {
    const isLight = html.classList.contains("light");
    sun.style.opacity = isLight ? "0" : "1";
    moon.style.opacity = isLight ? "1" : "0";
  };

  btn.addEventListener("click", () => {
    html.classList.toggle("light");
    localStorage.setItem("theme", html.classList.contains("light") ? "light" : "dark");
    updateIcon();
    btn.style.transition = "transform 0.6s ease";
    btn.style.transform = "rotate(360deg)";
    setTimeout(() => (btn.style.transform = ""), 600);
  });

  updateIcon();
});

