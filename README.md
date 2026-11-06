# clinica

Clinic services management system with Spring Boot + SQLite + React.

Handles patients, medical history, doctors, appointments and printable prescriptions.

Requires Java 21.

On Linux / macOS:

```
./mvnw spring-boot:run
```

On Windows:

```
mvnw.cmd spring-boot:run
```

Open http://localhost:3000

## API

| route | |
|---|---|
| /pacientes | patients (`?q=` search by name or id card) |
| /medicos | doctors |
| /citas | appointments (`?paciente=ID`) |
| /historial | medical history entries (`?paciente=ID`) |
| /recetas | prescriptions (`?paciente=ID`) |

Every route supports `GET`, `POST`, `GET /{id}`, `PUT /{id}` and `DELETE /{id}`.

Print a prescription: http://localhost:3000/receta.html?id=1
