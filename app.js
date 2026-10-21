// app.js - Lógica y Persistencia del Reto de 30 Días

// Estado Global
let currentDay = 1;
let currentWeek = 1;
let weekData = {};
let userProgress = {
    completedDays: [],
    streak: 0,
    errors: { A: 0, B: 0, C: 0 },
    errorHistory: [],
    savedSentences: {}
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadUserProgress();
    setupTabNavigation();
    setupImportExport();
    loadDay(1);
});

// 1. Carga del progreso desde localStorage
function loadUserProgress() {
    const saved = localStorage.getItem('reto_ingles_progress');
    if (saved) {
        try {
            userProgress = JSON.parse(saved);
        } catch (e) {
            console.error("Error al cargar el progreso guardado:", e);
        }
    }
    updateProgressUI();
}

function saveUserProgress() {
    localStorage.setItem('reto_ingles_progress', JSON.stringify(userProgress));
    updateProgressUI();
}

function updateProgressUI() {
    document.getElementById('streak-counter').innerText = `Racha: ${userProgress.streak} días`;
    document.getElementById('count-err-a').innerText = userProgress.errors.A;
    document.getElementById('count-err-b').innerText = userProgress.errors.B;
    document.getElementById('count-err-c').innerText = userProgress.errors.C;
}

// 2. Control de Nodos y Carga de Datos por Semana
async function loadDay(dayNumber) {
    currentDay = dayNumber;
    const targetWeek = Math.ceil(dayNumber / 7);

    // Cargar nuevo archivo semanal si cambió la semana
    if (targetWeek !== currentWeek || !weekData[dayNumber]) {
        currentWeek = targetWeek;
        await fetchWeekData(currentWeek);
    }

    renderDaysGrid();
    renderDayContent(dayNumber);
}

async function fetchWeekData(week) {
    try {
        const response = await fetch(`data/semana-${week}.json`);
        if (response.ok) {
            const data = await response.json();
            Object.assign(weekData, data);
        } else {
            console.warn(`No se pudo cargar data/semana-${week}.json. Generando plantilla.`);
            generateFallbackDayData(currentDay);
        }
    } catch (e) {
        console.warn(`Archivo data/semana-${week}.json no encontrado localmente.`, e);
        generateFallbackDayData(currentDay);
    }
}

function generateFallbackDayData(day) {
    if (!weekData[day]) {
        weekData[day] = {
            category: `Semana ${Math.ceil(day / 7)}: Práctica`,
            title: `Día ${day}: Entrenamiento de Oído`,
            repaso: [
                { expression: "Never mind", note: "Usa para cancelar una idea previa." }
            ],
            contraste: [
                {
                    title: "Expresiones Cotidianas",
                    use: "Revisa cuándo usar cada expresión según el nivel de formalidad.",
                    examples: [
                        { text: "Never mind", context: "Olvídalo / Ya no importa." },
                        { text: "No matter", context: "Sin importar qué." }
                    ]
                }
            ],
            oido: {
                audioText: "I was gonna ask for help, but never mind, it's no big deal.",
                phonetic: "'gonna' = going to. 'never mind' = pronunciado de forma corrida."
            },
            escuchaReal: {
                material: "Busca en YouTube la canción o entrevista asignada para el día.",
                task: "Escucha a ciegas de 3 a 5 veces sin subtítulos. Clasifica tus fallos abajo."
            }
        };
    }
}

// 3. Renderizado de Interfaz
function renderDaysGrid() {
    const grid = document.getElementById('days-grid');
    grid.innerHTML = '';

    for (let i = 1; i <= 30; i++) {
        const isCompleted = userProgress.completedDays.includes(i);
        const isActive = i === currentDay;

        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `p-2 text-xs font-bold rounded border transition ${
            isActive 
                ? 'bg-brand-500 text-slate-950 border-brand-500' 
                : isCompleted 
                    ? 'bg-slate-800 text-emerald-400 border-emerald-800' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
        }`;
        btn.onclick = () => loadDay(i);
        grid.appendChild(btn);
    }
}

function renderDayContent(day) {
    const data = weekData[day] || {};

    document.getElementById('day-category').innerText = data.category || `Semana ${Math.ceil(day / 7)}`;
    document.getElementById('day-title').innerText = data.title || `Día ${day}`;
    
    const isCompleted = userProgress.completedDays.includes(day);
    const statusBadge = document.getElementById('day-status');
    if (isCompleted) {
        statusBadge.innerText = 'Completado';
        statusBadge.className = 'text-xs bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800';
    } else {
        statusBadge.innerText = 'Pendiente';
        statusBadge.className = 'text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700';
    }

    // Bloque 1: Repaso
    const repasoContainer = document.getElementById('repaso-items');
    if (data.repaso && data.repaso.length > 0) {
        repasoContainer.innerHTML = data.repaso.map(item => `
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span class="font-bold text-brand-500 text-sm">${item.expression}</span>
                <p class="text-xs text-slate-300 mt-1">${item.note}</p>
            </div>
        `).join('');
    } else {
        repasoContainer.innerHTML = `<p class="text-xs text-slate-500">No hay errores pendientes para repasar hoy.</p>`;
    }

    // Bloque 2: Contraste
    const contrasteContainer = document.getElementById('contraste-items');
    if (data.contraste) {
        contrasteContainer.innerHTML = data.contraste.map(c => `
            <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <h4 class="font-semibold text-slate-200 text-sm">${c.title}</h4>
                <p class="text-xs text-slate-400">${c.use}</p>
                <div class="space-y-1 pt-2">
                    ${c.examples.map(ex => `
                        <div class="text-xs bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                            <span class="font-mono text-amber-400">${ex.text}</span>
                            <span class="text-slate-400">${ex.context}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Bloque 3: Oído
    const oidoContainer = document.getElementById('oido-items');
    if (data.oido) {
        oidoContainer.innerHTML = `
            <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
                <div class="flex items-center gap-3">
                    <button onclick="playDictation('${data.oido.audioText}')" class="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition">
                        Reproducir Dictado (100% Velocidad)
                    </button>
                </div>
                <textarea id="oido-input" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500" placeholder="Escribe lo que escuchas..."></textarea>
                <button onclick="document.getElementById('oido-reveal').classList.toggle('hidden')" class="text-xs text-slate-400 underline">
                    Mostrar/Ocultar solución
                </button>
                <div id="oido-reveal" class="hidden text-xs bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                    <p class="text-emerald-400 font-mono">${data.oido.audioText}</p>
                    <p class="text-slate-400">${data.oido.phonetic}</p>
                </div>
            </div>
        `;
    }

    // Bloque 4: Escucha Real
    const escuchaContainer = document.getElementById('escucha-instructions');
    if (data.escuchaReal) {
        escuchaContainer.innerHTML = `
            <p><strong>Material asignado:</strong> ${data.escuchaReal.material}</p>
            <p><strong>Instrucciones:</strong> ${data.escuchaReal.task}</p>
        `;
    }

    // Bloque 5: Cierre
    const saved = userProgress.savedSentences[day] || ["", "", ""];
    document.getElementById('sentence-1').value = saved[0] || "";
    document.getElementById('sentence-2').value = saved[1] || "";
    document.getElementById('sentence-3').value = saved[2] || "";
}

// 4. Reproducción con Web Speech API
function playDictation(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

// 5. Gestión de Errores (Tipos A, B, C)
function logError(type) {
    userProgress.errors[type]++;
    userProgress.errorHistory.push({
        day: currentDay,
        type: type,
        date: new Date().toISOString()
    });
    saveUserProgress();
    alert(`Fallo clasificado como Tipo ${type}. Registrado correctamente.`);
}

// 6. Navegación entre Pestañas de Bloques
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.block-tab');
    const contents = document.querySelectorAll('.block-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.className = 'block-tab px-4 py-2 text-xs font-semibold rounded-t-lg text-slate-400 hover:text-slate-200 transition whitespace-nowrap';
            });
            contents.forEach(c => c.classList.add('hidden'));

            tab.className = 'block-tab px-4 py-2 text-xs font-semibold rounded-t-lg bg-slate-800 text-brand-500 border-t border-x border-slate-700 whitespace-nowrap';
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Evento para completar el día
    document.getElementById('finish-day-btn').addEventListener('click', () => {
        const s1 = document.getElementById('sentence-1').value;
        const s2 = document.getElementById('sentence-2').value;
        const s3 = document.getElementById('sentence-3').value;

        userProgress.savedSentences[currentDay] = [s1, s2, s3];

        if (!userProgress.completedDays.includes(currentDay)) {
            userProgress.completedDays.push(currentDay);
            userProgress.streak++;
        }

        saveUserProgress();
        renderDaysGrid();
        renderDayContent(currentDay);
        alert(`¡Día ${currentDay} completado exitosamente!`);
    });
}

// 7. Importación y Exportación de Progreso (JSON)
function setupImportExport() {
    document.getElementById('export-btn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userProgress, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `progreso_reto_ingles_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    document.getElementById('import-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.completedDays && importedData.errors) {
                    userProgress = importedData;
                    saveUserProgress();
                    loadDay(currentDay);
                    alert("¡Progreso importado con éxito!");
                } else {
                    alert("El archivo JSON seleccionado no tiene el formato correcto.");
                }
            } catch (err) {
                alert("Error al leer el archivo JSON.");
            }
        };
        reader.readAsText(file);
    });
}