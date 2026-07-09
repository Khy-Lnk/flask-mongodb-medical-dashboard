from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import re

app = Flask(__name__)
CORS(app)  

# Conexión a MongoDB
try:
    cliente = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    db = cliente['HealthClinic']
    cliente.server_info()  
    print("¡Servidor Flask conectado exitosamente a MongoDB!")
except Exception as e:
    print(f"Error crítico: No se pudo conectar a MongoDB -> {e}")

# Login medico
@app.route('/api/login', methods=['POST'])
def login_medico():
    datos = request.json
    correo_web = datos.get('correo', '').strip().lower()
    rut_web = "".join(re.findall(r'\d+', datos.get('rut', '')))

    print("\n" + "="*40)
    print("--- CONTROL DE CREDENCIALES ---")
    print(f"Buscando Correo: '{correo_web}'")
    print(f"Buscando RUT:    '{rut_web}'")
    print("="*40 + "\n")

    medico = db.medicos.find_one({
        "correo": {"$regex": f"^\s*{correo_web}\s*$", "$options": "i"},
        "rut": {"$regex": f"^\s*{rut_web}\s*$"}
    })

    if medico:
        medico['_id'] = str(medico['_id'])
        print(f"¡ÉXITO! Se encontró al médico: {medico['nombre']}")
        return jsonify({"status": "success", "medico": medico}), 200
    else:
        print("ERROR: MongoDB devolvió None (No se encontró coincidencia).")
        return jsonify({"status": "error", "message": "Médico no encontrado. Verifique correo y RUT."}), 401

# kpis y citas
@app.route('/api/dashboard', methods=['GET'])
def obtener_dashboard():
    medico_id_raw = request.args.get('medico_id')
    if not medico_id_raw:
        return jsonify({"error": "Falta medico_id"}), 400
    
    # Intentamos convertir a int para buscar en ambos formatos (int y string)
    try:
        medico_id_int = int(medico_id_raw)
    except ValueError:
        medico_id_int = None

    filtro_medico = {"$or": [{"medico_id": medico_id_raw}]}
    if medico_id_int is not None:
        filtro_medico["$or"].append({"medico_id": medico_id_int})

    todas_mis_citas = list(db.citas.find(filtro_medico))

    hoy_simulado = "2025-01-17"
    citas_hoy = []
    citas_atendidas = []
    citas_pendientes = []

    for cita in todas_mis_citas:
        pid = cita.get("paciente_id")
        try:
            pid_int = int(pid)
        except (ValueError, TypeError):
            pid_int = None

        # Buscamos al paciente de forma segura
        filtro_paciente = {"$or": [{"_id": str(pid)}]}
        if pid_int is not None:
            filtro_paciente["$or"].append({"_id": pid_int})

        paciente = db.pacientes.find_one(filtro_paciente)
        nombre_paciente = paciente["nombre"] if paciente else "Desconocido"
        rut_paciente = paciente["rut"] if paciente else "" 

        cita_limpia = {
            "_id": str(cita["_id"]),
            "fecha_hora": cita["fecha_hora"],
            "estado": cita["estado"],
            "paciente_id": str(cita["paciente_id"]),
            "paciente_nombre": nombre_paciente,
            "paciente_rut": rut_paciente 
        }

        # Clasificación rigurosa
        if cita["fecha_hora"].startswith(hoy_simulado):
            citas_hoy.append(cita_limpia)
        
        if cita["estado"] == "completada":
            citas_atendidas.append(cita_limpia)
        elif cita["estado"] == "programada":
            citas_pendientes.append(cita_limpia)

    return jsonify({
        "kpis": {"hoy": len(citas_hoy), "atendidos": len(citas_atendidas), "pendientes": len(citas_pendientes)},
        "citas": {"hoy": citas_hoy, "atendidos": citas_atendidas, "pendientes": citas_pendientes}
    }), 200

# Ficha clinica del paciente
@app.route('/api/paciente/<id_paciente>', methods=['GET'])
def obtener_ficha_paciente(id_paciente):
    try:
        id_paciente = int(id_paciente)
    except ValueError:
        pass

    paciente = db.pacientes.find_one({"_id": id_paciente})
    if not paciente:
        return jsonify({"message": "Paciente no encontrado"}), 404

    paciente['_id'] = str(paciente['_id'])

    citas_paciente = list(db.citas.find({"paciente_id": id_paciente}))
    historial_citas = []

    for cita in citas_paciente:
        medico = db.medicos.find_one({"_id": cita.get("medico_id")})
        
        item = {
            "fecha_hora": cita["fecha_hora"],
            "estado": cita["estado"],
            "medico_nombre": medico["nombre"] if medico else "Desconocido",
            "diagnostico": cita.get("diagnostico")
        }
        historial_citas.append(item)

    return jsonify({"paciente": paciente, "historial_citas": historial_citas}), 200

# Buscador de pacientes
@app.route('/api/buscar-pacientes', methods=['GET'])
def buscar_pacientes():
    query = request.args.get('query', '').strip()
    
    filtro = {
        "$or": [
            {"nombre": {"$regex": query, "$options": "i"}},
            {"rut": {"$regex": query, "$options": "i"}}
        ]
    }
    
    resultados = list(db.pacientes.find(filtro))
    for r in resultados:
        r['_id'] = str(r['_id'])
        
    return jsonify(resultados), 200

# Cargar selects de pacientes y medicamentos
@app.route('/api/formulario-datos', methods=['GET'])
def datos_formulario():
    pacientes = list(db.pacientes.find({}, {"nombre": 1, "rut": 1}))
    medicamentos = list(db.medicamentos.find({}, {"nombre": 1, "dosis": 1}))

    for p in pacientes: p['_id'] = str(p['_id'])
    for m in medicamentos: m['_id'] = str(m['_id'])

    return jsonify({"pacientes": pacientes, "medicamentos": medicamentos}), 200

# Guardar diagnostico o actualizar cita
@app.route('/api/guardar-diagnostico', methods=['POST'])
def guardar_diagnostico():
    datos = request.json
    medico_id = datos.get('medico_id')
    paciente_string = datos.get('paciente_string', '') 

    try:
        medico_id = int(medico_id)
    except ValueError:
        pass

    try:
        rut_extraido = paciente_string.split("RUT: ")[1].replace(")", "").strip()
        paciente = db.pacientes.find_one({"rut": rut_extraido})
        if not paciente:
            return jsonify({"status": "error", "message": "El paciente no está registrado."}), 400
        paciente_id = paciente["_id"]
    except Exception:
        return jsonify({"status": "error", "message": "Formato de paciente inválido."}), 400

    cita_id = datos.get('cita_id')

    if cita_id:
        try: 
            cita_id = int(cita_id)
        except ValueError: 
            pass

        db.citas.update_one(
            {"_id": cita_id},
            {
                "$set": {
                    "estado": "completada",
                    "fecha_hora": datos.get('fecha_hora', '').replace(' ', 'T'),
                    "diagnostico": {
                        "codigo_cie10": datos.get('codigo_cie10') or "N/A",
                        "descripcion": datos.get('descripcion'),
                        "tratamiento": "Seguir indicaciones de receta adjunta." if len(datos.get('receta', [])) > 0 else "Reposo clínico.",
                        "receta": datos.get('receta', [])
                    }
                }
            }
        )
        return jsonify({"status": "success", "message": "Cita actualizada e historial guardado."}), 200
    else:
        ultimo_id = db.citas.find_one(sort=[("_id", -1)])
        nuevo_id = (ultimo_id["_id"] + 1) if ultimo_id else 1
        
        nuevo_documento_cita = {
            "_id": nuevo_id,
            "paciente_id": paciente_id,
            "medico_id": medico_id,
            "fecha_hora": datos.get('fecha_hora', '').replace(' ', 'T'),
            "consultorio": "Cons-101",
            "estado": "completada",
            "diagnostico": {
                "codigo_cie10": datos.get('codigo_cie10') or "N/A",
                "descripcion": datos.get('descripcion'),
                "tratamiento": "Reposo clínico.",
                "receta": datos.get('receta', [])
            }
        }
        db.citas.insert_one(nuevo_documento_cita)
        return jsonify({"status": "success", "message": "Nuevo registro clínico creado."}), 201

if __name__ == '__main__':
    app.run(port=5000, debug=True)