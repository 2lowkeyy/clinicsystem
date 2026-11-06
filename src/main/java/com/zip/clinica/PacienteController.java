package com.zip.clinica;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pacientes")
public class PacienteController {

    JdbcTemplate db;

    public PacienteController(JdbcTemplate db) {
        this.db = db;
    }

    Paciente row(ResultSet rs, int n) throws SQLException {
        Paciente p = new Paciente();
        p.id = rs.getInt("id");
        p.nombre = rs.getString("nombre");
        p.cedula = rs.getString("cedula");
        p.nacimiento = rs.getString("nacimiento");
        p.telefono = rs.getString("telefono");
        p.sangre = rs.getString("sangre");
        return p;
    }

    Paciente find(int id) {
        List<Paciente> res = db.query("SELECT * FROM pacientes WHERE id = ?", this::row, id);
        if (res.size() == 0) return null;
        return res.get(0);
    }

    boolean validate(Paciente p) {
        if (p == null) return false;
        if (Util.vacio(p.nombre) || p.nombre.length() > 64) return false;
        if (Util.vacio(p.cedula) || p.cedula.length() > 13) return false;
        if (!Util.es_fecha(p.nacimiento)) return false;
        if (p.telefono == null) p.telefono = "";
        if (p.sangre == null) p.sangre = "";
        return true;
    }

    @GetMapping
    public List<Paciente> pacientes_list(@RequestParam(required = false) String q) {
        if (Util.vacio(q)) return db.query("SELECT * FROM pacientes ORDER BY nombre", this::row);
        return db.query("SELECT * FROM pacientes WHERE nombre LIKE ? OR cedula LIKE ? ORDER BY nombre",
                this::row, "%" + q + "%", "%" + q + "%");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> pacientes_get(@PathVariable int id) {
        Paciente p = find(id);
        if (p == null) return Util.err(404, "ENOENT: no existe ese paciente");
        return ResponseEntity.ok(p);
    }

    @PostMapping
    public ResponseEntity<Object> pacientes_create(@RequestBody Paciente p) {
        if (!validate(p)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            p.id = db.queryForObject("INSERT INTO pacientes (nombre, cedula, nacimiento, telefono, sangre) "
                    + "VALUES (?, ?, ?, ?, ?) RETURNING id",
                    Integer.class, p.nombre, p.cedula, p.nacimiento, p.telefono, p.sangre);
        } catch (DataAccessException e) {
            return Util.err(409, "EEXIST: ya hay un paciente con esa cedula");
        }
        return ResponseEntity.status(201).body(p);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> pacientes_update(@PathVariable int id, @RequestBody Paciente p) {
        if (find(id) == null) return Util.err(404, "ENOENT: no existe ese paciente");
        if (!validate(p)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            db.update("UPDATE pacientes SET nombre = ?, cedula = ?, nacimiento = ?, telefono = ?, sangre = ? WHERE id = ?",
                    p.nombre, p.cedula, p.nacimiento, p.telefono, p.sangre, id);
        } catch (DataAccessException e) {
            return Util.err(409, "EEXIST: ya hay un paciente con esa cedula");
        }
        return ResponseEntity.ok(find(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> pacientes_delete(@PathVariable int id) {
        int n = db.update("DELETE FROM pacientes WHERE id = ?", id);
        if (n == 0) return Util.err(404, "ENOENT: no existe ese paciente");
        return ResponseEntity.noContent().build();
    }
}
