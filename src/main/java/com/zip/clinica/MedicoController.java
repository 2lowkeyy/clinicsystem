package com.zip.clinica;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/medicos")
public class MedicoController {

    JdbcTemplate db;

    public MedicoController(JdbcTemplate db) {
        this.db = db;
    }

    Medico row(ResultSet rs, int n) throws SQLException {
        Medico m = new Medico();
        m.id = rs.getInt("id");
        m.nombre = rs.getString("nombre");
        m.especialidad = rs.getString("especialidad");
        m.exequatur = rs.getString("exequatur");
        m.telefono = rs.getString("telefono");
        return m;
    }

    Medico find(int id) {
        List<Medico> res = db.query("SELECT * FROM medicos WHERE id = ?", this::row, id);
        if (res.size() == 0) return null;
        return res.get(0);
    }

    boolean validate(Medico m) {
        if (m == null) return false;
        if (Util.vacio(m.nombre) || m.nombre.length() > 64) return false;
        if (Util.vacio(m.especialidad) || m.especialidad.length() > 64) return false;
        if (Util.vacio(m.exequatur) || m.exequatur.length() > 16) return false;
        if (m.telefono == null) m.telefono = "";
        return true;
    }

    @GetMapping
    public List<Medico> medicos_list() {
        return db.query("SELECT * FROM medicos ORDER BY nombre", this::row);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> medicos_get(@PathVariable int id) {
        Medico m = find(id);
        if (m == null) return Util.err(404, "ENOENT: no existe ese medico");
        return ResponseEntity.ok(m);
    }

    @PostMapping
    public ResponseEntity<Object> medicos_create(@RequestBody Medico m) {
        if (!validate(m)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            m.id = db.queryForObject("INSERT INTO medicos (nombre, especialidad, exequatur, telefono) "
                    + "VALUES (?, ?, ?, ?) RETURNING id",
                    Integer.class, m.nombre, m.especialidad, m.exequatur, m.telefono);
        } catch (DataAccessException e) {
            return Util.err(409, "EEXIST: ya hay un medico con ese exequatur");
        }
        return ResponseEntity.status(201).body(m);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> medicos_update(@PathVariable int id, @RequestBody Medico m) {
        if (find(id) == null) return Util.err(404, "ENOENT: no existe ese medico");
        if (!validate(m)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            db.update("UPDATE medicos SET nombre = ?, especialidad = ?, exequatur = ?, telefono = ? WHERE id = ?",
                    m.nombre, m.especialidad, m.exequatur, m.telefono, id);
        } catch (DataAccessException e) {
            return Util.err(409, "EEXIST: ya hay un medico con ese exequatur");
        }
        return ResponseEntity.ok(find(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> medicos_delete(@PathVariable int id) {
        int n;
        try {
            n = db.update("DELETE FROM medicos WHERE id = ?", id);
        } catch (DataAccessException e) {
            return Util.err(409, "EBUSY: ese medico tiene citas, consultas o recetas");
        }
        if (n == 0) return Util.err(404, "ENOENT: no existe ese medico");
        return ResponseEntity.noContent().build();
    }
}
