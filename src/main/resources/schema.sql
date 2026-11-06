CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    cedula TEXT NOT NULL UNIQUE,
    nacimiento TEXT NOT NULL,
    telefono TEXT NOT NULL,
    sangre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    especialidad TEXT NOT NULL,
    exequatur TEXT NOT NULL UNIQUE,
    telefono TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    motivo TEXT NOT NULL,
    estado TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    fecha TEXT NOT NULL,
    diagnostico TEXT NOT NULL,
    notas TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    fecha TEXT NOT NULL,
    medicamentos TEXT NOT NULL,
    indicaciones TEXT NOT NULL
);
