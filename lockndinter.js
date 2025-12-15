/* ==========================================================================
   LearnPython: Main Logic
   Содержит: Блокировку уроков, Monaco Editor, Pyodide Worker
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initLessonLocking();
    // Инициализируем интерпретатор только если мы на странице с редактором
    if (document.getElementById('editor')) {
        initInterpreter();
    }
});

/* --- 1. Логика Блокировки Уроков --- */
function initLessonLocking() {
    // Получаем прогресс (по умолчанию 0 - ничего не пройдено)
    const completedLesson = parseInt(localStorage.getItem('completedLesson') || '0', 10);
    
    const lessons = document.querySelectorAll('.card.lesson');
    lessons.forEach(link => {
        const lessonIdStr = link.getAttribute('data-lesson-id');
        if (!lessonIdStr) return; // Пропускаем элементы без ID

        const lessonId = parseInt(lessonIdStr, 10);

        // Формула: Урок доступен, если его номер <= (пройденные + 1)
        if (lessonId > completedLesson + 1) {
            link.classList.add('locked');
            link.removeAttribute('href'); // Убираем ссылку
            link.title = "Алдымен алдыңғы сабақты аяқтаңыз (Пройдите предыдущий урок)";
            
            // Обработчик клика для заблокированных
            link.addEventListener('click', (e) => {
                e.preventDefault();
                alert(`⚠️ Бұл сабақ әлі құлыптаулы. ${completedLesson + 1}-сабақты аяқтаңыз.`);
            });
        } else {
            link.classList.remove('locked');
        }
    });
}

/* --- 2. Интерпретатор Python (Monaco + Web Worker) --- */
function initInterpreter() {
    let editor = null;
    let pyWorker = null;
    let isWorkerReady = false;

    const outEl = document.getElementById('output');
    const inputLine = document.getElementById('inputLine');
    const runBtn = document.getElementById('run');
    const stopBtn = document.getElementById('stop');
    const clearBtn = document.getElementById('clear');
    const downloadBtn = document.getElementById('download');

    // --- Код Воркера (Запускается в отдельном потоке) ---
    const workerScript = `
        // !!! КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Воркеру нужен importScripts для Pyodide !!!
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.24.0/full/pyodide.js");

        let pyodide = null;
        let inputResolver = null;

        async function load() {
            try {
                pyodide = await loadPyodide();
                self.postMessage({ cmd: 'ready' });
            } catch(e) {
                self.postMessage({ cmd: 'error', msg: String(e) });
            }
        }
        load();

        self.onmessage = async (e) => {
            const { cmd, code, value } = e.data;

            if (cmd === 'run') {
                if (!pyodide) {
                    self.postMessage({ cmd: 'print', text: 'Wait for init...\\n' });
                    return;
                }
                
                // Прикрепляем функции к self, чтобы 'import js' в Python их видел
                self.js_input_request = async (promptText) => {
                    self.postMessage({ cmd: 'input_request', prompt: promptText });
                    return new Promise(resolve => { inputResolver = resolve; });
                };

                self.js_print = (text) => {
                    self.postMessage({ cmd: 'print', text: text + "\\n" });
                };

                // Python код для настройки окружения
                const setupCode = \`
import builtins
import sys
import js 

# Переопределяем вывод (stdout/stderr)
class Writer:
    def write(self, s): 
        # Вызываем функцию из JS (через модуль js)
        if hasattr(js, 'js_print'):
            js.js_print(s)
    def flush(self): pass

sys.stdout = Writer()
sys.stderr = Writer()

# Переопределяем input
async def async_input(prompt=''):
    if prompt: 
        print(prompt, end='')
    if hasattr(js, 'js_input_request'):
        return await js.js_input_request(prompt)
    return ""

builtins.input = async_input
\`;
                try {
                    await pyodide.runPythonAsync(setupCode + "\\n" + code);
                    self.postMessage({ cmd: 'finished' });
                } catch (err) {
                    self.postMessage({ cmd: 'error', msg: String(err) });
                }
            }
            
            if (cmd === 'input_data' && inputResolver) {
                inputResolver(value);
                inputResolver = null;
            }
        };
    `;

    // --- Функции UI ---
    function write(s) {
        outEl.textContent += String(s);
        outEl.scrollTop = outEl.scrollHeight;
    }

    function resetButtons() {
        if(runBtn) runBtn.disabled = false;
        if(stopBtn) stopBtn.disabled = true;
    }

    function createWorker() {
        if (pyWorker) pyWorker.terminate(); 
        
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        pyWorker = new Worker(URL.createObjectURL(blob));

        pyWorker.onmessage = (e) => {
            const data = e.data;
            if (data.cmd === 'ready') {
                isWorkerReady = true;
                if(runBtn) runBtn.disabled = false;
                console.log('Python Worker Ready');
            } else if (data.cmd === 'print') {
                write(data.text);
            } else if (data.cmd === 'error') {
                write('❌ Қате (Error): ' + data.msg + '\n');
                resetButtons();
            } else if (data.cmd === 'finished') {
                write('\n>>> Бағдарлама аяқталды.\n');
                resetButtons();
            } else if (data.cmd === 'input_request') {
                inputLine.style.display = 'block';
                inputLine.value = '';
                inputLine.focus();
                
                const onEnter = (ev) => {
                    if (ev.key === 'Enter') {
                        const val = inputLine.value;
                        write(val + '\n');
                        inputLine.style.display = 'none';
                        inputLine.removeEventListener('keydown', onEnter);
                        pyWorker.postMessage({ cmd: 'input_data', value: val });
                    }
                };
                inputLine.addEventListener('keydown', onEnter);
            }
        };
    }

    // --- Monaco Editor Setup ---
    // !!! КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: require.config необходим для загрузки модулей Monaco !!!
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs' } });
    require(['vs/editor/editor.main'], () => {
        const isLight = document.documentElement.classList.contains('light');
        editor = monaco.editor.create(document.getElementById('editor'), {
            value: `# Мысал:\nimport time\nprint("Сәлем! Санау басталды...")\nfor i in range(1, 6):\n    print(i)\n    time.sleep(0.5)\nprint("Аяқталды!")`,
            language: 'python',
            theme: isLight ? 'vs' : 'vs-dark',
            automaticLayout: true,
            fontSize: 15,
            minimap: { enabled: false }
        });

        // Слушаем переключение темы
        const observer = new MutationObserver(() => {
            const isLight = document.documentElement.classList.contains('light');
            monaco.editor.setTheme(isLight ? 'vs' : 'vs-dark');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });

    // --- Обработчики Кнопок ---
    createWorker(); // Запуск при загрузке

    runBtn.addEventListener('click', () => {
        if (!isWorkerReady) { write('⏳ Интерпретатор жүктелуде...\n'); return; }
        outEl.textContent = ''; // Очистить
        write('▶ Орындалуда...\n');
        runBtn.disabled = true;
        stopBtn.disabled = false;
        
        const code = editor.getValue();
        pyWorker.postMessage({ cmd: 'run', code: code });
    });

    stopBtn.addEventListener('click', () => {
        pyWorker.terminate(); // ЖЕСТКАЯ ОСТАНОВКА
        write('\n🛑 Бағдарлама тоқтатылды.\n');
        resetButtons();
        isWorkerReady = false;
        createWorker(); // Перезапуск для следующего раза
        write('🔄 Интерпретатор қайта жүктелуде...\n');
    });

    clearBtn.addEventListener('click', () => { outEl.textContent = ''; });

    downloadBtn.addEventListener('click', () => {
        const code = editor?.getValue() || '';
        const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'learnpython.py';
        a.click();
    });
}