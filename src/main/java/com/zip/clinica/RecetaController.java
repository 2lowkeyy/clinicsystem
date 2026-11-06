package com.zip.clinica;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/recetas")
public class RecetaController {

    static final String SELECT = "SELECT r.*, p.nombre AS paciente, p.cedula, p.nacimiento, "
            + "m.nombre AS medico, m.especialidad, m.exequatur FROM recetas r "
            + "JOIN pacientes p ON p.id = r.paciente_id "
            + "JOIN medicos m ON m.id = r.medico_id ";

    JdbcTemplate db;

    public RecetaController(JdbcTemplate db) {
        this.db = db;
    }

    Receta row(ResultSet rs, int n) throws SQLException {
        Receta r = new Receta();
        r.id = rs.getInt("id");
        r.paciente_id = rs.getInt("paciente_id");
        r.medico_id = rs.getInt("medico_id");
        r.fecha = rs.getString("fecha");
        r.medicamentos = rs.getString("medicamentos");
        r.indicaciones = rs.getString("indicaciones");
        r.paciente = rs.getString("paciente");
        r.cedula = rs.getString("cedula");
        r.nacimiento = rs.getString("nacimiento");
        r.medico = rs.getString("medico");
        r.especialidad = rs.getString("especialidad");
        r.exequatur = rs.getString("exequatur");
        return r;
    }

    Receta find(int id) {
        List<Receta> res = db.query(SELECT + "WHERE r.id = ?", this::row, id);
        if (res.size() == 0) return null;
        return res.get(0);
    }

    boolean validate(Receta r) {
        if (r == null) return false;
        if (r.paciente_id == null || r.medico_id == null) return false;
        if (!Util.es_fecha(r.fecha)) return false;
        if (Util.vacio(r.medicamentos)) return false;
        if (r.indicaciones == null) r.indicaciones = "";
        return true;
    }

    @GetMapping
    public List<Receta> recetas_list(@RequestParam(required = false) Integer paciente) {
        if (paciente == null) return db.query(SELECT + "ORDER BY r.fecha DESC, r.id DESC", this::row);
        return db.query(SELECT + "WHERE r.paciente_id = ? ORDER BY r.fecha DESC, r.id DESC", this::row, paciente);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> recetas_get(@PathVariable int id) {
        Receta r = find(id);
        if (r == null) return Util.err(404, "ENOENT: no existe esa receta");
        return ResponseEntity.ok(r);
    }

    @PostMapping
    public ResponseEntity<Object> recetas_create(@RequestBody Receta r) {
        int id;
        if (!validate(r)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            id = db.queryForObject("INSERT INTO recetas (paciente_id, medico_id, fecha, medicamentos, indicaciones) "
                    + "VALUES (?, ?, ?, ?, ?) RETURNING id",
                    Integer.class, r.paciente_id, r.medico_id, r.fecha, r.medicamentos, r.indicaciones);
        } catch (DataAccessException e) {
            return Util.err(400, "EINVAL: ese paciente o medico no existe");
        }
        return ResponseEntity.status(201).body(find(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> recetas_update(@PathVariable int id, @RequestBody Receta r) {
        if (find(id) == null) return Util.err(404, "ENOENT: no existe esa receta");
        if (!validate(r)) return Util.err(400, "EINVAL: datos invalidos");
        try {
            db.update("UPDATE recetas SET paciente_id = ?, medico_id = ?, fecha = ?, medicamentos = ?, indicaciones = ? WHERE id = ?",
                    r.paciente_id, r.medico_id, r.fecha, r.medicamentos, r.indicaciones, id);
        } catch (DataAccessException e) {
            return Util.err(400, "EINVAL: ese paciente o medico no existe");
        }
        return ResponseEntity.ok(find(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> recetas_delete(@PathVariable int id) {
        int n = db.update("DELETE FROM recetas WHERE id = ?", id);
        if (n == 0) return Util.err(404, "ENOENT: no existe esa receta");
        return ResponseEntity.noContent().build();
    }
}
