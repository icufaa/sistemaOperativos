// Configuración inicial
let MEMORY_SIZE = 512; // Tamaño de la memoria (configurable)
const BLOCK_SIZE = 128; // Cada bloque es de 128MB
let totalBlocks = MEMORY_SIZE / BLOCK_SIZE;
let freeMemory = MEMORY_SIZE;
let memoryBlocks = Array(totalBlocks).fill(null);

// Variables adicionales
let exclusiónMutua = false; // Controla la exclusión mutua
let modoCompactacion = false; // Indica si se está usando compactación o paginación

// Colas de procesos
let colaNuevos = [];
let colaListos = [];
let colaBloqueados = [];
let colaTerminados = [];

// Elementos del DOM adicionales
const selectorCompactacion = document.getElementById('selector-compactacion');
const btnMemoria512 = document.getElementById('memoria-512');
const btnMemoria1024 = document.getElementById('memoria-1024');
const btnMemoria2048 = document.getElementById('memoria-2048');
const memoriaLibre = document.getElementById('memoria-libre');
const tablaProcesos = document.getElementById('tabla-procesos');
const memoriaUI = document.getElementById('memoria');
const tablaPaginacion = document.getElementById('tabla-paginacion');
const btnCrearProceso = document.getElementById('crear-proceso');
const btnLiberarMemoria = document.getElementById('liberar-memoria');
const btnLimpiarProcesos = document.getElementById('limpiar-procesos');


// Depuración para verificar el evento click del botón
btnCrearProceso.addEventListener('click', () => {
    console.log('Botón "Crear Proceso" presionado'); // Mensaje para depuración

    const memoryNeeded = Math.floor(Math.random() * 256) + 128; // Memoria entre 128MB y 384MB
    const pid = Math.floor(Math.random() * 10000);
    const proceso = new Process(pid, memoryNeeded);
    
    asignarMemoria(proceso); // Asignar memoria al nuevo proceso
    actualizarEstadosProcesos(); // Actualizar la tabla de procesos
});

// Clase para representar un proceso
class Process {
    constructor(pid, memoryNeeded) {
        this.pid = pid;
        this.memoryNeeded = memoryNeeded;
        this.inMemory = false;
        this.duration = Math.random() * 3000 + 1000; // Simula duración entre 1s y 4s
        this.state = 'Listo'; // Estado inicial
        this.pages = [];
    }

    // Simulación de ejecución del proceso con barra de progreso
    run() {
        this.state = 'Ejecutando';
        actualizarEstadosProcesos();

        const startTime = Date.now();
        const interval = setInterval(() => {
            let elapsedTime = Date.now() - startTime;
            let progress = Math.min((elapsedTime / this.duration) * 100, 100); // Progreso en %

            document.getElementById(`progress-${this.pid}`).style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                this.state = 'Terminado';
                liberarMemoria(this);
                actualizarEstadosProcesos();
                verificarColaNuevos();
            }
        }, 100);
    }
}

// Función para asignar memoria a un proceso
function asignarMemoria(proceso) {
    const blocksNeeded = Math.ceil(proceso.memoryNeeded / BLOCK_SIZE);

    if (blocksNeeded <= getFreeBlocks()) {
        for (let i = 0; i < totalBlocks && proceso.pages.length < blocksNeeded; i++) {
            if (memoryBlocks[i] === null) {
                memoryBlocks[i] = proceso.pid;
                proceso.pages.push(i);
            }
        }

        freeMemory -= blocksNeeded * BLOCK_SIZE;
        proceso.inMemory = true;
        proceso.state = 'Ejecutando';
        colaListos.push(proceso);
        actualizarMemoriaLibre();
        actualizarEstadosProcesos();
        actualizarMemoria();
        actualizarTablaPaginacion(proceso);
        proceso.run();
    } else {
        colaNuevos.push(proceso);
        actualizarColaNuevos();
    }
}

// Función para resetear completamente el simulador
function resetearSimulador() {
    // Limpiar todas las colas
    colaNuevos = [];
    colaListos = [];
    colaBloqueados = [];
    colaTerminados = [];

    // Resetear la memoria
    freeMemory = MEMORY_SIZE;
    memoryBlocks = Array(totalBlocks).fill(null);

    // Limpiar la interfaz de usuario
    actualizarMemoriaLibre();
    actualizarMemoria();
    actualizarEstadosProcesos();
    actualizarColaNuevos();
    
    // Limpiar la tabla de paginación
    const tbodyPaginacion = tablaPaginacion.querySelector('tbody');
    tbodyPaginacion.innerHTML = '';

    alert('Simulador reseteado por completo.');
}

// Asignar evento al botón para resetear todo
btnLimpiarProcesos.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas resetear el simulador? Esto eliminará todos los procesos y restablecerá la memoria.')) {
        resetearSimulador();
    }
});


// Funciones de apoyo (actualización de memoria, tablas, etc.)
function actualizarEstadosProcesos() {
    const tbody = tablaProcesos.querySelector('tbody');
    tbody.innerHTML = '';

    colaListos.concat(colaNuevos).forEach(proceso => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border px-4 py-2">${proceso.pid}</td>
            <td class="border px-4 py-2">${proceso.memoryNeeded} MB</td>
            <td class="border px-4 py-2">${proceso.state}</td>
            <td class="border px-4 py-2">
                <div class="w-full bg-gray-700">
                    <div id="progress-${proceso.pid}" class="bg-green-500 h-4" style="width: 0%"></div>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function actualizarMemoria() {
    memoriaUI.innerHTML = '';
    memoryBlocks.forEach((block, index) => {
        const blockDiv = document.createElement('div');
        blockDiv.className = block === null ? 'bg-gray-600' : 'bg-green-500';
        blockDiv.textContent = block === null ? '' : block;
        memoriaUI.appendChild(blockDiv);
    });
}

function actualizarMemoriaLibre() {
    memoriaLibre.textContent = `Memoria Libre: ${freeMemory} MB`;
}

function actualizarColaNuevos() {
    const listaColaNuevos = document.getElementById('cola-nuevos');
    listaColaNuevos.innerHTML = '';
    colaNuevos.forEach(proceso => {
        const listItem = document.createElement('li');
        listItem.textContent = `Proceso ${proceso.pid} (${proceso.memoryNeeded} MB)`;
        listaColaNuevos.appendChild(listItem);
    });
}

function actualizarTablaPaginacion(proceso) {
    const tbody = tablaPaginacion.querySelector('tbody');
    proceso.pages.forEach((block, pageIndex) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border px-4 py-2">${proceso.pid}</td>
            <td class="border px-4 py-2">${pageIndex}</td>
            <td class="border px-4 py-2">${block}</td>
        `;
        tbody.appendChild(row);
    });
}

function liberarMemoria(proceso) {
    proceso.pages.forEach(block => {
        memoryBlocks[block] = null;
    });
    freeMemory += proceso.memoryNeeded;
    actualizarMemoriaLibre();
    actualizarMemoria();
}

function verificarColaNuevos() {
    if (colaNuevos.length > 0) {
        const procesoEnCola = colaNuevos.shift();
        asignarMemoria(procesoEnCola);
    }
}

function getFreeBlocks() {
    return memoryBlocks.filter(block => block === null).length;
}

// Función para liberar manualmente la memoria de un proceso seleccionado
btnLiberarMemoria.addEventListener('click', () => {
    // Preguntamos el ID del proceso a liberar
    const procesoId = prompt('Ingrese el ID del proceso a liberar:');
    if (procesoId) {
        // Buscamos el proceso en la cola de listos o ejecutando
        const proceso = colaListos.find(p => p.pid == procesoId);
        if (proceso && proceso.inMemory) {
            liberarMemoria(proceso);
            // Movemos el proceso a la cola de terminados y lo quitamos de los listos
            proceso.state = 'Terminado';
            colaTerminados.push(proceso);
            colaListos = colaListos.filter(p => p.pid !== procesoId);
            actualizarEstadosProcesos(); // Refrescamos la tabla
            alert(`Proceso ${procesoId} liberado con éxito.`);
        } else {
            alert('Proceso no encontrado o ya no está en memoria.');
        }
    }
});


// Función para limpiar solo los procesos que están terminados
btnLimpiarProcesos.addEventListener('click', () => {
    if (colaTerminados.length === 0) {
        alert('No hay procesos terminados para limpiar.');
        return;
    }

    // Limpiamos solo los procesos terminados
    colaTerminados.forEach(proceso => {
        liberarMemoria(proceso);  // Liberamos la memoria ocupada por cada proceso terminado
    });

    // Vaciamos la cola de procesos terminados
    colaTerminados = [];

    // Actualizamos la interfaz
    actualizarMemoriaLibre();
    actualizarMemoria();
    actualizarEstadosProcesos();
    actualizarColaNuevos();
    actualizarTablaPaginacion();

    alert('Los procesos terminados han sido limpiados.');
});





// Otros eventos del DOM (selector de compactación y botones de tamaño de memoria)
selectorCompactacion.addEventListener('change', (event) => {
    modoCompactacion = event.target.value === 'compactacion';
    console.log('Modo de administración de memoria:', modoCompactacion ? 'Compactación' : 'Paginación');
});

btnMemoria512.addEventListener('click', () => configurarMemoria(512));
btnMemoria1024.addEventListener('click', () => configurarMemoria(1024));
btnMemoria2048.addEventListener('click', () => configurarMemoria(2048));

function configurarMemoria(tamano) {
    MEMORY_SIZE = tamano;
    totalBlocks = MEMORY_SIZE / BLOCK_SIZE;
    freeMemory = MEMORY_SIZE;
    memoryBlocks = Array(totalBlocks).fill(null);
    actualizarMemoriaLibre();
    actualizarMemoria();
}