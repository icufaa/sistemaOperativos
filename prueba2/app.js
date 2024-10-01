// Parámetros iniciales
const LIMITE_MEMORIA = 1000;
let memoriaLibre = LIMITE_MEMORIA;
let procesos = [];
let tablaPaginas = [];
let tipoGestion = 'paginacion';
let enEjecucion = false;
const PROBABILIDAD_BLOQUEO = 30; // 30% de probabilidad de bloqueo

// Función para elegir el tipo de gestión de memoria
document.getElementById('paginacion').addEventListener('click', () => {
  tipoGestion = 'paginacion';
  alert('Modo de gestión: Paginación');
});

document.getElementById('compactacion').addEventListener('click', () => {
  tipoGestion = 'compactacion';
  alert('Modo de gestión: Compactación');
});

// Función para generar un tamaño de proceso aleatorio
function solicitarMemoria() {
  const tamañoProceso = Math.floor(Math.random() * 200) + 50; // Tamaño entre 50 y 250
  return tamañoProceso;
}

// Función para actualizar la visualización de la memoria
function actualizarMemoria() {
  const porcentajeUso = ((LIMITE_MEMORIA - memoriaLibre) / LIMITE_MEMORIA) * 100;
  document.getElementById('memoria-principal').style.width = `${porcentajeUso}%`;
  document.getElementById('memoria-principal').innerText = `Memoria usada: ${LIMITE_MEMORIA - memoriaLibre}/${LIMITE_MEMORIA}`;
}

// Función para agregar un nuevo proceso a la simulación
function agregarProceso() {
  const tamaño = solicitarMemoria();
  const proceso = {
    id: `Proceso ${procesos.length + 1}`,
    estado: 'Nuevo',
    tamaño,
    pagina: Math.floor(Math.random() * 10) + 1 // Asignar una página aleatoria
  };

  if (memoriaLibre >= tamaño) {
    proceso.estado = 'Listo';
    memoriaLibre -= tamaño;
    document.getElementById('cola-listos').innerHTML += `<li>${proceso.id} - ${tamaño} KB</li>`;
    tablaPaginas.push({ proceso: proceso.id, pagina: proceso.pagina, frame: 'Frame 1' });
  } else {
    proceso.estado = 'Nuevo';
    document.getElementById('cola-nuevos').innerHTML += `<li>${proceso.id} - ${tamaño} KB</li>`;
  }

  procesos.push(proceso);
  actualizarMemoria();
  actualizarTablaPaginas();
}

// Función para actualizar la tabla de páginas
function actualizarTablaPaginas() {
  const tabla = document.getElementById('tabla-paginas');
  tabla.innerHTML = ''; // Limpiar tabla existente
  tablaPaginas.forEach(({ proceso, pagina, frame }) => {
    tabla.innerHTML += `<tr><td class="px-4 py-2">${proceso}</td><td class="px-4 py-2">${pagina}</td><td class="px-4 py-2">${frame}</td></tr>`;
  });
}

// Función para ejecutar el proceso, simula que un proceso entra en ejecución y termina
function ejecutarProceso() {
  if (procesos.length > 0) {
    const procesoListo = procesos.find(p => p.estado === 'Listo');
    if (procesoListo) {
      procesoListo.estado = 'Ejecutando';
      actualizarColas();
      
      // Simula que hay un 30% de probabilidad de que el proceso se bloquee
      const probabilidades = Math.random() * 100; // Genera un número entre 0 y 100
      if (probabilidades < PROBABILIDAD_BLOQUEO) {
        // Proceso se bloquea
        procesoListo.estado = 'Bloqueado';
        document.getElementById('cola-bloqueados').innerHTML += `<li>${procesoListo.id} - ${procesoListo.tamaño} KB</li>`;
      } else {
        // Proceso no se bloquea, se completa la ejecución
        setTimeout(() => {
          liberarMemoria(procesoListo);
        }, 3000); // Simula 3 segundos de ejecución
      }
      
      actualizarColas();
    }
  }
}

// Función para liberar memoria cuando un proceso termina
function liberarMemoria(proceso) {
  proceso.estado = 'Terminado';
  memoriaLibre += proceso.tamaño;
  document.getElementById('cola-terminados').innerHTML += `<li>${proceso.id} - ${proceso.tamaño} KB</li>`;
  actualizarMemoria();
  actualizarColas();

  // Reubicar procesos de la cola de nuevos a la cola de listos
  reubicarProcesos();

  // Continuar ejecutando otros procesos si existen
  ejecutarProceso();
}

// Función para reubicar procesos de la cola de nuevos a la cola de listos
function reubicarProcesos() {
  procesos.forEach(proceso => {
    if (proceso.estado === 'Nuevo' && memoriaLibre >= proceso.tamaño) {
      proceso.estado = 'Listo';
      memoriaLibre -= proceso.tamaño;
      document.getElementById('cola-listos').innerHTML += `<li>${proceso.id} - ${proceso.tamaño} KB</li>`;
      tablaPaginas.push({ proceso: proceso.id, pagina: proceso.pagina, frame: 'Frame 1' });
      actualizarTablaPaginas();
    }
  });
}

// Actualizar las colas visualmente
function actualizarColas() {
  document.getElementById('cola-listos').innerHTML = '';
  document.getElementById('cola-nuevos').innerHTML = '';
  document.getElementById('cola-terminados').innerHTML = '';
  document.getElementById('cola-bloqueados').innerHTML = '';
  
  procesos.forEach(proceso => {
    if (proceso.estado === 'Listo') {
      document.getElementById('cola-listos').innerHTML += `<li>${proceso.id} - ${proceso.tamaño} KB</li>`;
    } else if (proceso.estado === 'Nuevo') {
      document.getElementById('cola-nuevos').innerHTML += `<li>${proceso.id} - ${proceso.tamaño} KB</li>`;
    } else if (proceso.estado === 'Terminado') {
      document.getElementById('cola-terminados').innerHTML += `<li>${proceso.id} - ${proceso.tamaño} KB</li>`;
    } else if (proceso.estado === 'Bloqueado') {
      document.getElementById('cola-bloqueados').innerHTML += `<li>${proceso.id} - ${proceso.tamaño} KB</li>`;
    }
  });
}

// Función para reiniciar el simulador
function reiniciarSimulador() {
  memoriaLibre = LIMITE_MEMORIA;
  procesos = [];
  tablaPaginas = [];
  enEjecucion = false;
  actualizarMemoria();
  actualizarColas();
  actualizarTablaPaginas();
}

// Inicializar eventos de botones
document.getElementById('agregar-proceso').addEventListener('click', agregarProceso);
document.getElementById('iniciar-ejecucion').addEventListener('click', () => {
  enEjecucion = true;
  ejecutarProceso();
});
document.getElementById('reiniciar-simulador').addEventListener('click', reiniciarSimulador);
