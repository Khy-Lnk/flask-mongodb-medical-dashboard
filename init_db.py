from pymongo import MongoClient

def inicializar_base_de_datos():
    try:
        cliente = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)

        db = cliente['HealthClinic']
        db.especialidades.drop()
        db.medicos.drop()
        db.pacientes.drop()
        db.citas.drop()
        db.medicamentos.drop()
        
        print("Creando base de datos 'HealthClinic' y cargando datos...")

        db.especialidades.insert_many([
            { "_id": 1, "nombre": "Cardiología", "descripcion": "Enfermedades del corazón" },
            { "_id": 2, "nombre": "Neurología", "descripcion": "Enfermedades del sistema nervioso" },
            { "_id": 3, "nombre": "Dermatología", "descripcion": "Enfermedades de la piel" },
            { "_id": 4, "nombre": "Pediatría", "descripcion": "Medicina infantil" },
            { "_id": 5, "nombre": "Oftalmología", "descripcion": "Enfermedades de los ojos" }
        ])

        db.medicos.insert_many([
            { "_id": 1, "rut": "195991634", "nombre": "Dr. Ricardo Flores", "especialidad_id": 1, "correo": "ricardo@clinic.com", "licencia": "LIC-2010-001" },
            { "_id": 2, "rut": "222222222", "nombre": "Dra. Patricia Silva", "especialidad_id": 2, "correo": "patricia@clinic.com", "licencia": "LIC-2011-002" },
            { "_id": 3, "rut": "333333332", "nombre": "Dr. Fernando Torres", "especialidad_id": 3, "correo": "fernando@clinic.com", "licencia": "LIC-2012-003" },
            { "_id": 4, "rut": "444444442", "nombre": "Dra. Marta Gómez", "especialidad_id": 4, "correo": "marta@clinic.com", "licencia": "LIC-2013-004" },
            { "_id": 5, "rut": "555555552", "nombre": "Dr. Jorge Herrera", "especialidad_id": 5, "correo": "jorge@clinic.com", "licencia": "LIC-2014-005" }
        ])

        db.pacientes.insert_many([
            { "_id": 1, "rut": "123456784", "nombre": "José González", "fecha_nacimiento": "1980-05-15", "direccion": "Calle A 100", "telefono": "9111111111", "email": "jose@example.com" },
            { "_id": 2, "rut": "234567894", "nombre": "Rosa López", "fecha_nacimiento": "1990-08-22", "direccion": "Calle B 200", "telefono": "9122222222", "email": "rosa@example.com" },
            { "_id": 3, "rut": "345678904", "nombre": "Pedro Martínez", "fecha_nacimiento": "1975-03-10", "direccion": "Calle C 300", "telefono": "9133333333", "email": "pedro@example.com" },
            { "_id": 4, "rut": "456789014", "nombre": "Carla Rodríguez", "fecha_nacimiento": "1995-11-30", "direccion": "Calle D 400", "telefono": "9144444444", "email": "carla@example.com" },
            { "_id": 5, "rut": "567890124", "nombre": "Miguel Sánchez", "fecha_nacimiento": "1985-07-05", "direccion": "Calle E 500", "telefono":"9155555555", "email": "miguel@example.com" }
        ])

        db.medicamentos.insert_many([
            { "_id": 1, "nombre": "Atorvastatina", "dosis": "20mg", "presentacion": "Tabletas", "precio": 15.50 },
            { "_id": 2, "nombre": "Ibuprofeno", "dosis": "400mg", "presentacion": "Tabletas", "precio": 5.00 },
            { "_id": 3, "nombre": "Amoxicilina", "dosis": "500mg", "presentacion": "Cápsulas", "precio": 8.75 },
            { "_id": 4, "nombre": "Omeprazol", "dosis": "20mg", "presentacion": "Cápsulas", "precio": 12.25 },
            { "_id": 5, "nombre": "Loratadina", "dosis": "10mg", "presentacion": "Tabletas", "precio": 6.50 }
        ])

        db.citas.insert_many([
            {
                "_id": 1,
                "paciente_id": 1,
                "medico_id": 1,
                "fecha_hora": "2025-01-15T10:00:00",
                "consultorio": "Cons-101",
                "estado": "completada",
                "diagnostico": {
                    "codigo_cie10": "I10",
                    "descripcion": "Hipertensión esencial",
                    "tratamiento": "Control de presión arterial, dieta baja en sal",
                    "receta": [
                        { "medicamento_id": 1, "nombre_med": "Atorvastatina", "cantidad": 30, "duracion_dias": 90, "frecuencia": "1 tableta diaria" }
                    ]
                }
            },
            {
                "_id": 2,
                "paciente_id": 2,
                "medico_id": 2,
                "fecha_hora": "2025-01-16T14:30:00",
                "consultorio": "Cons-102",
                "estado": "completada",
                "diagnostico": {
                    "codigo_cie10": "M79.3",
                    "descripcion": "Mialgia y miositis",
                    "tratamiento": "Reposo, antiinflamatorios",
                    "receta": [
                        { "medicamento_id": 2, "nombre_med": "Ibuprofeno", "cantidad": 20, "duracion_dias": 10, "frecuencia": "1 tableta cada 6 horas" }
                    ]
                }
            },
            {
                "_id": 3,
                "paciente_id": 1,
                "medico_id": 1,
                "fecha_hora": "2025-01-17T09:00:00",
                "consultorio": "Cons-101",
                "estado": "programada"
            },
            {
                "_id": 4,
                "paciente_id": 3,
                "medico_id": 3,
                "fecha_hora": "2025-01-18T11:00:00",
                "consultorio": "Cons-103",
                "estado": "programada"
            },
            {
                "_id": 5,
                "paciente_id": 4,
                "medico_id": 4,
                "fecha_hora": "2025-01-19T15:00:00",
                "consultorio": "Cons-104",
                "estado": "completada",
                "diagnostico": {
                    "codigo_cie10": "J06.9",
                    "descripcion": "Infección respiratoria",
                    "tratamiento": "Antibióticos, reposo",
                    "receta": [
                        { "medicamento_id": 3, "nombre_med": "Amoxicilina", "cantidad": 21, "duracion_dias": 7, "frecuencia": "1 cápsula cada 8 horas" }
                    ]
                }
            }
        ])
        print("¡Base de datos MongoDB real creada y poblada con éxito!")

    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
        print("Asegúrate de tener el programa de MongoDB ejecutándose de fondo.")

if __name__ == '__main__':
    inicializar_base_de_datos()