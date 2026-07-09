let medicoActual = null;
let filtroActual = 'hoy'; 
let citaCargadaId = null; 
document.addEventListener('DOMContentLoaded', () => {
    obtenerClima();

    const inputBusqueda = document.getElementById('input-busqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keypress', (evento) => {
            if (evento.key === 'Enter') {
                evento.preventDefault(); 
                buscarPaciente();
            }
        });
    }
});

// Vista 1: LOGIN
async function iniciarSesion() {
    const correoEscrito = document.getElementById('input-login-correo').value.trim().toLowerCase();
    const rutInput = document.getElementById('input-login-rut').value;
    const rutEscritoLimpio = rutInput.replace(/[\.-]/g, "").replace(/\s/g, "").toLowerCase();

    if (!correoEscrito || !rutEscritoLimpio) {
        alert("Por favor, complete ambos campos para ingresar.");
        return;
    }

    try {
        const respuesta = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: correoEscrito, rut: rutEscritoLimpio })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.status === "success") {
            medicoActual = resultado.medico;

            // Intercambio de pantallas virtuales
            document.getElementById('pantalla-login').style.display = 'none';
            document.getElementById('panel-principal').style.display = 'block';

            // Cargar datos del panel
            cargarDatosPanelMedico();
        } else {
            alert(resultado.message || "Credenciales incorrectas.");
        }
    } catch (error) {
        console.error("Error al conectar con Flask:", error);
        alert("No se pudo conectar con el servidor Python. Asegúrate de que app.py esté corriendo.");
    }
}

// Vista 2: DASHBOARD INTERACTIVO (CON API)
async function cargarDatosPanelMedico() {
    if (!medicoActual) return;

    // Actualizar texto del saludo arriba
    const tituloSaludo = document.getElementById('saludo-medico');
    tituloSaludo.textContent = 'Bienvenido, ' + medicoActual.nombre;

    await actualizarKPIsYTabla();
    cargarListasFormulario();
}

async function actualizarKPIsYTabla() {
    const medId = medicoActual._id;

    try {
        const respuesta = await fetch('http://localhost:5000/api/dashboard?medico_id=' + medId);
        const datos = await respuesta.json();

        if (respuesta.ok) {
            document.getElementById('kpi-citas-hoy').textContent = datos.kpis.hoy;
            document.getElementById('kpi-pacientes-total').textContent = datos.kpis.atendidos;
            document.getElementById('kpi-citas-semana').textContent = datos.kpis.pendientes;

            renderizarTablaDinamica(datos.citas[filtroActual]);
        }
    } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
    }
}

// Escucha los clics de las tarjetas KPIs
function filtrarTablaCitas(tipo) {
    filtroActual = tipo;
    actualizarKPIsYTabla(); 
}

function renderizarTablaDinamica(citasFiltradas) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-citas');
    const tituloTabla = document.querySelector('.tabla-citas h2');
    cuerpoTabla.innerHTML = '';

    if (filtroActual === 'hoy') tituloTabla.textContent = "Próximas citas de hoy";
    if (filtroActual === 'atendidos') tituloTabla.textContent = "Historial de pacientes atendidos (Completadas)";
    if (filtroActual === 'pendientes') tituloTabla.textContent = "Citas pendientes de la semana";

    if (!citasFiltradas || citasFiltradas.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay registros para mostrar en esta categoría.</td></tr>';
        return; 
    }

    citasFiltradas.forEach(cita => {
        const horaCita = cita.fecha_hora.includes('T') ? cita.fecha_hora.split('T')[1].substring(0, 5) : cita.fecha_hora.substring(11,16);
        const fechaCita = cita.fecha_hora.split('T')[0];

        const badgeClass = cita.estado === 'completada' ? '' : 'programada';
        const badgeStyle = cita.estado === 'completada' ? 'background-color: #28a745; color: white;' : '';
        
        let botonAccion = '<button onclick="verFichaPaciente(\'' + cita.paciente_id + '\')">Ver Ficha</button>';
    
        if (cita.estado === 'programada') {
            botonAccion = '<button onclick="prepararAtencion(\'' + cita.paciente_nombre + '\', \'' + cita.paciente_rut + '\', \'' + cita._id + '\')" style="background-color: #007bff; color: white; margin-right: 5px;">Atender</button>' +
                          '<button onclick="verFichaPaciente(\'' + cita.paciente_id + '\')">Ficha</button>';
        }

        const fila = document.createElement('tr');
        fila.innerHTML = '<td>' + (filtroActual === 'atendidos' ? fechaCita + ' ' + horaCita : horaCita) + '</td>' +
                         '<td>' + cita.paciente_nombre + '</td>' +
                         '<td><span class="badge ' + badgeClass + '" style="' + badgeStyle + '">' + cita.estado + '</span></td>' +
                         '<td>' + botonAccion + '</td>';
        cuerpoTabla.appendChild(fila);
    });
}

// Vista 4: FICHA CLÍNICA DEL PACIENTE 
async function verFichaPaciente(idPaciente) {
    try {
        const respuesta = await fetch('http://localhost:5000/api/paciente/' + idPaciente);
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            alert("No se pudo cargar la ficha clínica.");
            return;
        }

        const paciente = datos.paciente;
        const historial = datos.historial_citas;

        // Cargar Datos Personales
        document.getElementById('ficha-cedula').textContent = paciente.rut;
        document.getElementById('ficha-nombre').textContent = paciente.nombre;
        document.getElementById('ficha-nacimiento').textContent = paciente.fecha_nacimiento;
        document.getElementById('ficha-telefono').textContent = paciente.telefono;
        document.getElementById('ficha-direccion').textContent = paciente.direccion;

        const cuerpoHistorial = document.getElementById('ficha-historial-citas');
        const listaDiagnosticos = document.getElementById('ficha-diagnosticos');
        const listaMedicamentos = document.getElementById('ficha-medicamentos');
        
        cuerpoHistorial.innerHTML = '';
        listaDiagnosticos.innerHTML = '';
        listaMedicamentos.innerHTML = '';

        if (historial.length === 0) {
            cuerpoHistorial.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay citas registradas</td></tr>';
            listaDiagnosticos.innerHTML = '<li>Sin registros de diagnóstico.</li>';
            listaMedicamentos.innerHTML = '<li>Sin medicamentos activos.</li>';
        } else {
            let tieneDiagnosticos = false;

            historial.forEach(cita => {
                const fila = document.createElement('tr');
                fila.innerHTML = '<td>' + cita.fecha_hora.replace('T', ' ') + '</td>' +
                                 '<td>' + cita.medico_nombre + '</td>' +
                                 '<td><span class="badge ' + (cita.estado === 'programada' ? 'programada' : '') + '" style="' + (cita.estado === 'completada' ? 'background-color: #28a745; color: white;' : '') + '">' + cita.estado + '</span></td>';
                cuerpoHistorial.appendChild(fila);

                if (cita.diagnostico) {
                    tieneDiagnosticos = true;
                
                    const fechaSolo = cita.fecha_hora.split('T')[0];

                    listaDiagnosticos.innerHTML += '<li style="margin-bottom: 12px;">' +
                                                   '<span style="font-size: 0.85em; color: #666; font-weight: bold;">[' + fechaSolo + ']</span> ' +
                                                   '<strong>' + cita.diagnostico.descripcion + '</strong>' +
                                                   '<br><small style="color: #555;">Tratamiento: ' + cita.diagnostico.tratamiento + '</small>' +
                                                   '</li>';

                    if (cita.diagnostico.receta) {
                        cita.diagnostico.receta.forEach(med => {
                            listaMedicamentos.innerHTML += '<li>' +
                                                           '<span style="font-size: 0.85em; color: #666;">[' + fechaSolo + ']</span> ' +
                                                           '<strong>' + med.nombre_med + '</strong> - ' + med.frecuencia +
                                                           '</li>';
                        });
                    }
                }
            });

            if (!tieneDiagnosticos) {
                listaDiagnosticos.innerHTML = '<li>No registra diagnósticos previos.</li>';
                listaMedicamentos.innerHTML = '<li>No registra medicamentos activos.</li>';
            }
        }

        const seccionFicha = document.getElementById('vista-ficha-medica');
        seccionFicha.style.display = 'block';
        seccionFicha.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error al obtener la ficha clínica:", error);
    }
}

function cerrarFicha() {
    document.getElementById('vista-ficha-medica').style.display = 'none';
}

// Vista 3: BÚSQUEDA DE PACIENTES
async function buscarPaciente() {
    const textoBusqueda = document.getElementById('input-busqueda').value.toLowerCase().trim();
    const cuerpoTablaBusqueda = document.getElementById('cuerpo-tabla-busqueda');
    cuerpoTablaBusqueda.innerHTML = '';

    if (textoBusqueda === '') {
        cuerpoTablaBusqueda.innerHTML = '<tr><td colspan="4" style="text-align:center;">Por favor ingrese un término de búsqueda</td></tr>';
        return;
    }

    try {
        const respuesta = await fetch('http://localhost:5000/api/buscar-pacientes?query=' + textoBusqueda);
        const pacientes = await respuesta.json();

        if (pacientes.length === 0) {
            cuerpoTablaBusqueda.innerHTML = '<tr><td colspan="4" style="text-align:center;">No se encontraron pacientes</td></tr>';
            return;
        }

        pacientes.forEach(p => {
            const fila = document.createElement('tr');
            fila.innerHTML = '<td>' + p.rut + '</td>' +
                             '<td>' + p.nombre + '</td>' +
                             '<td>' + p.telefono + '</td>' +
                             '<td><button onclick="verFichaPaciente(\'' + p._id + '\')">Ver Ficha Completa</button></td>';
            cuerpoTablaBusqueda.appendChild(fila);
        });
    } catch (error) {
        console.error("Error en la búsqueda:", error);
    }
}

// Vista 5: FORMULARIO DE REGISTRO DE DIAGNÓSTICO Y RECETA
async function cargarListasFormulario() {
    try {
        const respuesta = await fetch('http://localhost:5000/api/formulario-datos');
        const datos = await respuesta.json();

        // Cargar autocompletado de pacientes
        const listaPacientes = document.getElementById('lista-pacientes');
        listaPacientes.innerHTML = '';
        datos.pacientes.forEach(p => {
            listaPacientes.innerHTML += '<option value="' + p.nombre + ' (RUT: ' + p.rut + ')" data-id="' + p._id + '"></option>';
        });

        // Cargar select de medicamentos
        const selectMedicamento = document.getElementById('select-medicamento');
        selectMedicamento.innerHTML = '<option value="">Seleccione un medicamento...</option>';
        datos.medicamentos.forEach(med => {
            selectMedicamento.innerHTML += '<option value="' + med.nombre + '">' + med.nombre + ' - ' + med.dosis + '</option>';
        });
    } catch (error) {
        console.error("Error al cargar los selects del formulario:", error);
    }
}

function agregarMedicamento() {
    const select = document.getElementById('select-medicamento');
    const inputIndicaciones = document.getElementById('input-indicaciones');
    const cuerpoTabla = document.getElementById('cuerpo-tabla-prescripcion');
    const filaVacia = document.getElementById('fila-vacia-meds');

    if (select.value === '' || inputIndicaciones.value.trim() === '') {
        alert('Complete el medicamento y las indicaciones.');
        return;
    }

    if (filaVacia) filaVacia.remove();

    const fila = document.createElement('tr');
    fila.innerHTML = '<td class="med-nombre">' + select.value + '</td>' +
                     '<td class="med-indicacion">' + inputIndicaciones.value + '</td>' +
                     '<td><button type="button" onclick="eliminarMedicamento(this)" class="btn-eliminar">Quitar</button></td>';
    cuerpoTabla.appendChild(fila);

    select.value = '';
    inputIndicaciones.value = '';
}

function eliminarMedicamento(boton) {
    boton.parentElement.parentElement.remove();
    const cuerpoTabla = document.getElementById('cuerpo-tabla-prescripcion');
    if (cuerpoTabla.children.length === 0) {
        cuerpoTabla.innerHTML = '<tr id="fila-vacia-meds"><td colspan="3" style="text-align:center;">No hay medicamentos en la receta</td></tr>';
    }
}

async function guardarRegistro(evento) {
    evento.preventDefault();

    const pacienteTexto = document.getElementById('input-paciente').value;
    const fecha = document.getElementById('input-fecha').value;
    const diagnostico = document.getElementById('input-diagnostico').value;
    const cie10 = document.getElementById('input-cie10').value;

    const filasMeds = document.querySelectorAll('#cuerpo-tabla-prescripcion tr:not(#fila-vacia-meds)');
    const receta = [];
    filasMeds.forEach(fila => {
        receta.push({
            nombre_med: fila.querySelector('.med-nombre').textContent,
            frecuencia: fila.querySelector('.med-indicacion').textContent
        });
    });

    const payload = {
        cita_id: citaCargadaId, 
        medico_id: medicoActual._id,
        paciente_string: pacienteTexto, 
        fecha_hora: fecha,
        descripcion: diagnostico,
        codigo_cie10: cie10,
        receta: receta
    };

    try {
        const respuesta = await fetch('http://localhost:5000/api/guardar-diagnostico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert("¡Registro clínico guardado de forma permanente en MongoDB!");
            document.getElementById('form-registro').reset();
            document.getElementById('cuerpo-tabla-prescripcion').innerHTML = '<tr id="fila-vacia-meds"><td colspan="3" style="text-align:center;">No hay medicamentos en la receta</td></tr>';
            
            citaCargadaId = null; 
            actualizarKPIsYTabla(); 
        } else {
            alert(resultado.message);
        }
    } catch (error) {
        console.error("Error al guardar diagnóstico:", error);
    }
}

async function obtenerClima() {
    const apiKey = 'c58cbada027a8154d0c7ee673c65622a'; 
    const ciudad = 'Concepcion,CL'; 
    const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + ciudad + '&units=metric&lang=es&appid=' + apiKey;

    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        if (datos.main && datos.main.temp) {
            document.getElementById('temp-valor').textContent = Math.round(datos.main.temp);
        }
    } catch (error) {
        document.getElementById('temp-valor').textContent = "??";
    }
}

function cerrarSesion() {
    medicoActual = null;
    document.getElementById('panel-principal').style.display = 'none';
    document.getElementById('pantalla-login').style.display = 'flex';
    cerrarFicha(); 
}

function prepararAtencion(nombre, rut, citaId) {
    citaCargadaId = citaId;

    const inputPaciente = document.getElementById('input-paciente');
    if (inputPaciente) {
        inputPaciente.value = nombre + ' (RUT: ' + rut + ')';
    }

    const inputFecha = document.getElementById('input-fecha');
    if (inputFecha) {
        const ahora = new Date();
        const tzoffset = ahora.getTimezoneOffset() * 60000; 
        const localISOTime = (new Date(ahora - tzoffset)).toISOString().slice(0, 16);
        inputFecha.value = localISOTime;
    }

    document.getElementById('form-registro').scrollIntoView({ behavior: 'smooth' });
}