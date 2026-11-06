package com.zip.clinica;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/historial")
public class HistorialController {

    static final String SELECT = "SELECT h.*, p.nombre AS paciente, m.nombre AS medico FROM historial h "
            + "JOIN pacientes p ON p.id = h.paciente_id "
            + "JOIN medicos m ON m.id = h.medico_id ";

    JdbcTemplate db;

    public HistorialController(JdbcTemplate db) {
        this.db = db;
    }

    Consulta row(ResultSet rs, int n) throws SQLException {
        Consulta c = new Consulta();
        c.id = rs.getInt("id");
        c.paciente_id = rs.getInt("paciente_id");
        c.medico_id = rs.getInt("medico_id");
        c.fecha = rs.getString("fecha");
        c.diagnostico = rs.getString("diagnostico");
        c.notas = rs.getString("notas");
        c.paciente = rs.getString("paciente");
        c.medico = rs.getString("medico");
        return c;
    }

    Consulta find(int id) {
        List<Consulta> res = db.query(SELECT + "WHERE h.id = ?", this::row, id);
        if (res.size() == 0) return null;
        return res.get(0);
    }

    boolean validate(Consulta c) {
        if (c == null) return false;
        if (c.paciente_id == null || c.medico_id == null) return false;
        if (!Util.es_fecha(c.fecha)) return false;
        if (Util.vacio(c.diagnostico)) return false;
        if (c.notas == null) c.notas = "";
        return true;
    }

    @GetMapping
    public List<Consulta> historial_list(@RequestParam(required = false) Integer paciente) {
        if (paciente == null) return db.query(SELECT + "ORDER BY h.fecha DESC, h.id DESC", this::row);
        return db.query(SELECT + "WHERE h.paciente_id = ? ORDER BY h.fecha DESC, h.id DESC", this::row, paciente);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> historial_get(@PathVariable int id) {
        Consulta c = find(id);
        if (c == null) return Util.err(404, "ENOENT: no existe esa consulta");
        return ResponseEntity.ok(c);
    }

    @PostMapping
    public ResponseEntity<Object> historial_create(@RequestBody Consulta c) {
        int id;
        if (!validate(c)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            id = db.queryForObject("INSERT INTO historial (paciente_id, medico_id, fecha, diagnostico, notas) "
                    + "VALUES (?, ?, ?, ?, ?) RETURNING id",
                    Integer.class, c.paciente_id, c.medico_id, c.fecha, c.diagnostico, c.notas);
        } catch (DataAccessException e) {
            return Util.err(400, "EINVAL: ese paciente o medico no existe");
        }
        return ResponseEntity.status(201).body(find(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> historial_update(@PathVariable int id, @RequestBody Consulta c) {
        if (find(id) == null) return Util.err(404, "ENOENT: no existe esa consulta");
        if (!validate(c)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            db.update("UPDATE historial SET paciente_id = ?, medico_id = ?, fecha = ?, diagnostico = ?, notas = ? WHERE id = ?",
                    c.paciente_id, c.medico_id, c.fecha, c.diagnostico, c.notas, id);
        } catch (DataAccessException e) {
            return Util.err(400, "EINVAL: ese paciente o medico no existe");
        }
        return ResponseEntity.ok(find(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> historial_delete(@PathVariable int id) {
        int n = db.update("DELETE FROM historial WHERE id = ?", id);
        if (n == 0) return Util.err(404, "ENOENT: no existe esa consulta");
        return ResponseEntity.noContent().build();
    }
}
