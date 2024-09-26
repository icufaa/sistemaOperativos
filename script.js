// Configuración inicial
const MEMORY_SIZE = 1024; // Tamaño de la memoria principal
const BLOCK_SIZE = 128; // Cada bloque es de 128MB
const TOTAL_BLOCKS = MEMORY_SIZE / BLOCK_SIZE; // 8 bloques en total

let freeMemory = MEMORY_SIZE; // Memoria libre
let memoryBlocks = Array(TOTAL_BLOCKS).fill(null); // Representa los bloques de memoria

// Colas de procesos
let colaNuevos = [];
let colaListos = [];
let colaTerminados = [];

// Elementos del DOM
const memoriaLibre = document.getElementById('memoria-libre');
const tablaProcesos = document.getElementById('tabla-procesos');
const memoriaUI = document.getElementById('memoria');
const tablaPaginacion = document.getElementById('tabla-paginacion');
const btnCrearProceso = document.getElementById('crear-proceso');

// Clase para representar un proceso
class Process {
    constructor(pid, memoryNeeded) {
        this.pid = pid;
        this.memoryNeeded = memoryNeeded;
        this.inMemory = false;
        this.duration = Math.random() * 3000 + 1000; // Simula duración entre 1s y 4s
        this.state = 'Listo'; // Estado inicial
        this.pages = []; // Páginas asignadas al proceso
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

// Función para actualizar la memoria libre en el DOM
function actualizarMemoriaLibre() {
    memoriaLibre.textContent = `Memoria Libre: ${freeMemory} MB`;
}

// Función para actualizar los estados de los procesos en la tabla
function actualizarEstadosProcesos() {
    tablaProcesos.innerHTML = colaListos.map(proceso => `
        <tr>
            <td class="border px-4 py-2">Proceso ${proceso.pid}</td>
            <td class="border px-4 py-2">${proceso.memoryNeeded} MB</td>
            <td class="border px-4 py-2">${proceso.state}</td>
            <td class="border px-4 py-2">
                <div class="w-full bg-gray-200 rounded-full h-4">
                    <div id="progress-${proceso.pid}" class="bg-blue-500 h-4 rounded-full" style="width: 0%;"></div>
                </div>
            </td>
        </tr>
    `).join('');
}

// Función para asignar memoria a un proceso
function asignarMemoria(proceso) {
    const blocksNeeded = Math.ceil(proceso.memoryNeeded / BLOCK_SIZE);

    if (blocksNeeded <= getFreeBlocks()) {
        for (let i = 0; i < TOTAL_BLOCKS && proceso.pages.length < blocksNeeded; i++) {
            if (memoryBlocks[i] === null) {
                memoryBlocks[i] = proceso.pid;
                proceso.pages.push(i); // Asignar página
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

// Función para liberar memoria
function liberarMemoria(proceso) {
    proceso.pages.forEach(page => {
        memoryBlocks[page] = null;
    });
    freeMemory += proceso.pages.length * BLOCK_SIZE;
    colaListos = colaListos.filter(p => p.pid !== proceso.pid);
    colaTerminados.push(proceso);
    actualizarMemoriaLibre();
    actualizarMemoria();
    actualizarTablaTerminados();
}

// Función para verificar los bloques de memoria libre
function getFreeBlocks() {
    return memoryBlocks.filter(block => block === null).length;
}

// Función para visualizar la memoria en el DOM
function actualizarMemoria() {
    memoriaUI.innerHTML = memoryBlocks.map((block, index) => `
        <div class="h-16 w-16 border flex items-center justify-center text-sm ${block !== null ? 'bg-green-500 text-white' : 'bg-gray-200'}">
            ${block !== null ? `P${block}` : 'Libre'}
        </div>
    `).join('');
}

// Función para visualizar la tabla de paginación
function actualizarTablaPaginacion(proceso) {
    tablaPaginacion.innerHTML += proceso.pages.map((page, index) => `
        <tr>
            <td class="border px-4 py-2">Proceso ${proceso.pid}</td>
            <td class="border px-4 py-2">Página ${index + 1}</td>
            <td class="border px-4 py-2">Bloque ${page}</td>
        </tr>
    `).join('');
}

// Función para visualizar la cola de nuevos
function actualizarColaNuevos() {
    document.getElementById('cola-nuevos').innerHTML = colaNuevos.map(proceso => `
        <li>Proceso ${proceso.pid} (${proceso.memoryNeeded} MB)</li>
    `).join('');
}

// Función para intentar mover procesos de la cola de nuevos a la cola de listos
function verificarColaNuevos() {
    if (colaNuevos.length > 0) {
        const proceso = colaNuevos[0];
        if (proceso.memoryNeeded <= freeMemory) {
            colaNuevos.shift(); // Elimina el proceso de la cola de nuevos
            asignarMemoria(proceso);
            actualizarColaNuevos();
        }
    }
}

// Función para actualizar la tabla de procesos terminados
function actualizarTablaTerminados() {
    // Puedes agregar aquí la lógica para mostrar procesos terminados si es necesario
}

// Función para crear un nuevo proceso
function crearProceso() {
    const pid = colaNuevos.length + colaListos.length + colaTerminados.length + 1;
    const memoryNeeded = Math.floor(Math.random() * 256) + 64; // Necesidades de memoria entre 64 y 320 MB
    const proceso = new Process(pid, memoryNeeded);
    asignarMemoria(proceso);
}

// Evento para crear procesos
btnCrearProceso.addEventListener('click', crearProceso);
