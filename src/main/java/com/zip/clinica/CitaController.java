package com.zip.clinica;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/citas")
public class CitaController {

    static final String SELECT = "SELECT c.*, p.nombre AS paciente, m.nombre AS medico FROM citas c "
            + "JOIN pacientes p ON p.id = c.paciente_id "
            + "JOIN medicos m ON m.id = c.medico_id ";

    JdbcTemplate db;

    public CitaController(JdbcTemplate db) {
        this.db = db;
    }

    Cita row(ResultSet rs, int n) throws SQLException {
        Cita c = new Cita();
        c.id = rs.getInt("id");
        c.paciente_id = rs.getInt("paciente_id");
        c.medico_id = rs.getInt("medico_id");
        c.fecha = rs.getString("fecha");
        c.hora = rs.getString("hora");
        c.motivo = rs.getString("motivo");
        c.estado = rs.getString("estado");
        c.paciente = rs.getString("paciente");
        c.medico = rs.getString("medico");
        return c;
    }

    Cita find(int id) {
        List<Cita> res = db.query(SELECT + "WHERE c.id = ?", this::row, id);
        if (res.size() == 0) return null;
        return res.get(0);
    }

    boolean validate(Cita c) {
        if (c == null) return false;
        if (c.paciente_id == null || c.medico_id == null) return false;
        if (!Util.es_fecha(c.fecha) || !Util.es_hora(c.hora)) return false;
        if (c.motivo == null) c.motivo = "";
        if (c.estado == null) c.estado = "pendiente";
        if (!c.estado.equals("pendiente") && !c.estado.equals("atendida") && !c.estado.equals("cancelada")) return false;
        return true;
    }

    boolean ocupado(Cita c, int id) {
        if (c.estado.equals("cancelada")) return false;
        int n = db.queryForObject("SELECT COUNT(*) FROM citas WHERE medico_id = ? AND fecha = ? AND hora = ? "
                + "AND estado != 'cancelada' AND id != ?", Integer.class, c.medico_id, c.fecha, c.hora, id);
        return n > 0;
    }

    @GetMapping
    public List<Cita> citas_list(@RequestParam(required = false) Integer paciente) {
        if (paciente == null) return db.query(SELECT + "ORDER BY c.fecha, c.hora", this::row);
        return db.query(SELECT + "WHERE c.paciente_id = ? ORDER BY c.fecha DESC, c.hora DESC", this::row, paciente);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> citas_get(@PathVariable int id) {
        Cita c = find(id);
        if (c == null) return Util.err(404, "ENOENT: no existe esa cita");
        return ResponseEntity.ok(c);
    }

    @PostMapping
    public synchronized ResponseEntity<Object> citas_create(@RequestBody Cita c) {
        int id;
        if (!validate(c)) return Util.err(400, "EINVAL: datos invalidos");
        if (ocupado(c, 0)) return Util.err(409, "EBUSY: el medico ya tiene una cita a esa hora");
        try {
            id = db.queryForObject("INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo, estado) "
                    + "VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
                    Integer.class, c.paciente_id, c.medico_id, c.fecha, c.hora, c.motivo, c.estado);
        } catch (DataAccessException e) {
            return Util.err(400, "EINVAL: ese paciente o medico no existe");
        }
        return ResponseEntity.status(201).body(find(id));
    }

    @PutMapping("/{id}")
    public synchronized ResponseEntity<Object> citas_update(@PathVariable int id, @RequestBody Cita c) {
        if (find(id) == null) return Util.err(404, "ENOENT: no existe esa cita");
        if (!validate(c)) return Util.err(400, "EINVAL: datos invalidos");
        if (ocupado(c, id)) return Util.err(409, "EBUSY: el medico ya tiene una cita a esa hora");
        try {
            db.update("UPDATE citas SET paciente_id = ?, medico_id = ?, fecha = ?, hora = ?, motivo = ?, estado = ? WHERE id = ?",
                    c.paciente_id, c.medico_id, c.fecha, c.hora, c.motivo, c.estado, id);
        } catch (DataAccessException e) {
            return Util.err(400, "EINVAL: ese paciente o medico no existe");
        }
        return ResponseEntity.ok(find(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> citas_delete(@PathVariable int id) {
        int n = db.update("DELETE FROM citas WHERE id = ?", id);
        if (n == 0) return Util.err(404, "ENOENT: no existe esa cita");
        return ResponseEntity.noContent().build();
    }
}
