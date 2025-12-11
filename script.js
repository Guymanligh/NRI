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

/* ===== PYTHON INTERPRETER ===== */
let pyodide;
let editor;
const statusEl = document.getElementById("py-status");
const runBtn = document.getElementById("run");
const downloadBtn = document.getElementById("download");
const clearBtn = document.getElementById("clear");
const reloadBtn = document.getElementById("py-reload");
const controlButtons = [runBtn, downloadBtn, clearBtn].filter(Boolean);
const pyodideUrls = [
  // 0.23.4 — классический UMD, дружит с обычным <script>
  "https://unpkg.com/pyodide@0.23.4/full/pyodide.js",
  // запасной (на случай блокировки первого)
  "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js",
];

const setStatus = (text, busy = false) => {
  if (statusEl) statusEl.textContent = text;
  controlButtons.forEach((btn) => (btn.disabled = busy));
};

async function loadPy() {
  try {
    setStatus("Pyodide жүктелуде...", true);
    if (typeof loadPyodide !== "function") {
      await ensurePyodideScript();
    }
    pyodide = await loadPyodide();
    setStatus("Дайын: Pyodide жүктелді");
  } catch (err) {
    console.error(err);
    const reason = err?.message || String(err);
    setStatus("Қате: Pyodide жүктелмеді. Себебі: " + reason, true);
  }
}
loadPy();

async function ensurePyodideScript() {
  for (const url of pyodideUrls) {
    try {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = url;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Скрипт жүктелмеді: " + url));
        document.head.appendChild(s);
      });
      if (typeof loadPyodide === "function") return;
    } catch (e) {
      console.warn(e);
      continue;
    }
  }
  throw new Error("Pyodide скрипттері қолжетімсіз (CDN).");
}

require.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs" },
});

require(["vs/editor/editor.main"], () => {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: `name = input("Атыңды енгіз: ")\nprint("Сәлем,", name)`,
    language: "python",
    theme: document.documentElement.classList.contains("light") ? "vs-light" : "vs-dark",
    automaticLayout: true,
    fontSize: 15,
  });
});

const themeObserver = new MutationObserver(() => {
  if (!editor) return;
  monaco.editor.setTheme(document.documentElement.classList.contains("light") ? "vs-light" : "vs-dark");
});
themeObserver.observe(document.documentElement, { attributes: true });

const output = document.getElementById("output");

function makeInput() {
  return new Promise((resolve) => {
    const line = document.createElement("div");
    line.className = "input-line";

    const input = document.createElement("input");
    input.id = "user-input";

    line.appendChild(input);
    output.appendChild(line);
    input.focus();

    input.addEventListener("keydown", (e) => {
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

  if (!pyodide) {
    setStatus("Pyodide әлі жүктелген жоқ. Күтіңіз...", true);
    return;
  }

  setStatus("Орындалуда...", true);
  pyodide.setStdin(makeInput);

  try {
    const code = editor.getValue();
    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined) {
      output.innerHTML += result + "\n";
    }
  } catch (err) {
    output.innerHTML += "Қате:\n" + err + "\n";
  } finally {
    setStatus("Дайын", false);
  }
}

if (runBtn) runBtn.onclick = runPython;

if (downloadBtn)
  downloadBtn.onclick = () => {
    const code = editor.getValue();
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learnpython.py";
    a.click();
  };

if (clearBtn)
  clearBtn.onclick = () => {
    output.innerHTML = "";
  };

if (reloadBtn)
  reloadBtn.onclick = () => {
    pyodide = null;
    setStatus("Қайта жүктелуде...", true);
    loadPy();
  };

