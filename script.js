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
/* ===== PYTHON INTERPRETER ===== */

let pyodide;
let editor;

async function loadPy() {
    pyodide = await loadPyodide();
}
loadPy();

require.config({
    paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs" }
});

require(["vs/editor/editor.main"], () => {
    editor = monaco.editor.create(document.getElementById("editor"), {
        value: `name = input("Атыңды енгіз: ")\nprint("Сәлем,", name)`,
        language: "python",
        theme: document.documentElement.classList.contains("light")
            ? "vs-light"
            : "vs-dark",
        automaticLayout: true,
        fontSize: 15,
    });
});

/* Auto theme sync */
const themeObserver = new MutationObserver(() => {
    if (!editor) return;
    monaco.editor.setTheme(
        document.documentElement.classList.contains("light")
            ? "vs-light"
            : "vs-dark"
    );
});
themeObserver.observe(document.documentElement, { attributes: true });

/* Output area */
const output = document.getElementById("output");

function makeInput() {
    return new Promise(resolve => {
        const line = document.createElement("div");
        line.className = "input-line";

        const input = document.createElement("input");
        input.id = "user-input";

        line.appendChild(input);
        output.appendChild(line);
        input.focus();

        input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                const val = input.value;
                line.remove();
                output.innerHTML += val + "\n";
                resolve(val);
            }
        });
    });
}

async function runPython() {
    output.innerHTML = "";

    pyodide.setStdin(makeInput);

    try {
        const code = editor.getValue();
        const result = await pyodide.runPythonAsync(code);

        if (result !== undefined) {
            output.innerHTML += result + "\n";
        }
    } catch (err) {
        output.innerHTML += "Қате:\n" + err + "\n";
    }
}

document.getElementById("run").onclick = runPython;

/* Download .py */
document.getElementById("download").onclick = () => {
    const code = editor.getValue();
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learnpython.py";
    a.click();
};
/* Clear output */
document.getElementById("clear").onclick = () => {
    output.innerHTML = "";
};
