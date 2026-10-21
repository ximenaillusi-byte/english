// app.js - Lógica actualizada con vista limpia de un solo día

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

document.addEventListener('DOMContentLoaded', async () => {
    loadUserProgress();
    setupDaySelector();
    setupTabNavigation();
    setupImportExport();
    await loadDay(1);
});

function loadUserProgress() {
    const saved = localStorage.getItem('reto_ingles_progress');
    if (saved) {
        try {
            userProgress = JSON.parse(saved);
        } catch (e) {
            console.error("Error al cargar progreso:", e);
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

function setupDaySelector() {
    const selector = document.getElementById('day-selector');
    selector.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
        const option = document.createElement('option');
        option.value = i;
        const isCompleted = userProgress.completedDays.includes(i) ? ' (Completado)' : '';
        option.innerText = `Día ${i}${isCompleted}`;
        selector.appendChild(option);
    }
    selector.addEventListener('change', (e) => {
        loadDay(parseInt(e.target.value));
    });
}

async function loadDay(dayNumber) {
    currentDay = dayNumber;
    const targetWeek = Math.ceil(dayNumber / 7);

    document.getElementById('day-selector').value = dayNumber;

    if (!weekData[targetWeek]) {
        await fetchWeekData(targetWeek);
    }

    renderDayContent(dayNumber);
}

async function fetchWeekData(week) {
    try {
        const response = await fetch(`data/semana-${week}.json`);
        if (response.ok) {
            const data = await response.json();
            Object.assign(weekData, data);
        } else {
            console.error(`No se pudo cargar data/semana-${week}.json`);
        }
    } catch (e) {
        console.error(`Error de red al cargar semana-${week}.json`, e);
    }
}

function renderDayContent(day) {
    // Buscar la semana correspondiente para extraer los datos del JSON cargado
    const targetWeek = Math.ceil(day / 7);
    const dataWeek = weekData[targetWeek] || weekData; 
    const data = dataWeek[day] || {
        category: `Semana ${targetWeek}`,
        title: `Día ${day}: Práctica`,
        repaso: [{ expression: "Sin datos", note: "Verifica que los JSON estén en la carpeta data." }],
        contraste: [],
        oido: { audioText: "Hello world", phonetic: "Pronunciación estándar" },
        escuchaReal: { material: "Material libre", task: "Escucha y practica." }
    };

    document.getElementById('day-category').innerText = data.category || `Semana ${targetWeek}`;
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

    // Renderizar Bloque 1: Repaso
    const repasoContainer = document.getElementById('repaso-items');
    if (data.repaso && data.repaso.length > 0) {
        repasoContainer.innerHTML = data.repaso.map(item => `
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span class="font-bold text-brand-500 text-xs">${item.expression}</span>
                <p class="text-xs text-slate-300 mt-1">${item.note}</p>
            </div>
        `).join('');
    } else {
        repasoContainer.innerHTML = `<p class="text-xs text-slate-500">No hay elementos de repaso para hoy.</p>`;
    }

    // Renderizar Bloque 2: Contraste
    const contrasteContainer = document.getElementById('contraste-items');
    if (data.contraste && data.contraste.length > 0) {
        contrasteContainer.innerHTML = data.contraste.map(c => `
            <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <h4 class="font-semibold text-slate-200 text-xs">${c.title}</h4>
                <p class="text-xs text-slate-400">${c.use}</p>
                <div class="space-y-1 pt-1">
                    ${c.examples.map(ex => `
                        <div class="text-xs bg-slate-950 p-2 rounded border border-slate-800 flex justify-between gap-2">
                            <span class="font-mono text-amber-400">${ex.text}</span>
                            <span class="text-slate-400 text-right">${ex.context}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } else {
        contrasteContainer.innerHTML = `<p class="text-xs text-slate-500">Sin contraste registrado para este día.</p>`;
    }

    // Renderizar Bloque 3: Oído
    const oidoContainer = document.getElementById('oido-items');
    if (data.oido) {
        oidoContainer.innerHTML = `
            <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
                <div class="flex items-center gap-3">
                    <button onclick="playDictation('${data.oido.audioText}')" class="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition">
                        Reproducir Dictado
                    </button>
                </div>
                <textarea id="oido-input" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500" placeholder="Escribe lo que escuchas..."></textarea>
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

    // Renderizar Bloque 4: Escucha Real
    const escuchaContainer = document.getElementById('escucha-instructions');
    if (data.escuchaReal) {
        escuchaContainer.innerHTML = `
            <p><strong>Material asignado:</strong> ${data.escuchaReal.material}</p>
            <p><strong>Instrucciones:</strong> ${data.escuchaReal.task}</p>
        `;
    }

    // Renderizar Bloque 5: Cierre
    const saved = userProgress.savedSentences[day] || ["", "", ""];
    document.getElementById('sentence-1').value = saved[0] || "";
    document.getElementById('sentence-2').value = saved[1] || "";
    document.getElementById('sentence-3').value = saved[2] || "";
}

function playDictation(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function logError(type) {
    userProgress.errors[type]++;
    userProgress.errorHistory.push({
        day: currentDay,
        type: type,
        date: new Date().toISOString()
    });
    saveUserProgress();
    alert(`Fallo clasificado como Tipo ${type}. Registrado.`);
}

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
        setupDaySelector();
        loadDay(currentDay);
        alert(`¡Día ${currentDay} completado con éxito!`);
    });
}

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
                    setupDaySelector();
                    loadDay(currentDay);
                    alert("¡Progreso importado con éxito!");
                } else {
                    alert("El archivo JSON no tiene el formato correcto.");
                }
            } catch (err) {
                alert("Error al leer el archivo JSON.");
            }
        };
        reader.readAsText(file);
    });
}