function cita_vacia() {
  return { paciente_id: "", medico_id: "", fecha: hoy(), hora: "08:00", motivo: "", estado: "pendiente" };
}

function Citas() {
  var s1 = React.useState([]);           var list = s1[0];      var set_list = s1[1];
  var s2 = React.useState(cita_vacia);   var f = s2[0];         var set_f = s2[1];
  var s3 = React.useState(0);            var edit_id = s3[0];   var set_edit_id = s3[1];
  var s4 = React.useState({ code: OK, text: "OK" }); var st = s4[0]; var set_st = s4[1];
  var s5 = React.useState(true);         var busy = s5[0];      var set_busy = s5[1];
  var s6 = React.useState([]);           var pacientes = s6[0]; var set_pacientes = s6[1];
  var s7 = React.useState([]);           var medicos = s7[0];   var set_medicos = s7[1];

  function refresh() {
    return Promise.all([api_list("citas", ""), api_list("pacientes", ""), api_list("medicos", "")]).then(function (r) {
      if (r[0].code == OK) {
        set_list(r[0].data);
      } else {
        set_st({ code: r[0].code, text: msg_of(r[0]) });
      }
      if (r[1].code == OK) set_pacientes(r[1].data);
      if (r[2].code == OK) set_medicos(r[2].data);
      set_busy(false);
    });
  }

  React.useEffect(function () { refresh(); }, []);

  function clear_form() {
    set_f(cita_vacia());
    set_edit_id(0);
  }

  function finish(r) {
    set_st({ code: r.code, text: msg_of(r) });
    if (r.code == OK) {
      clear_form();
      return refresh();
    }
    set_busy(false);
  }

  function to_obj(c) {
    return {
      paciente_id: parseInt(c.paciente_id, 10),
      medico_id: parseInt(c.medico_id, 10),
      fecha: c.fecha,
      hora: c.hora,
      motivo: c.motivo,
      estado: c.estado
    };
  }

  function on_submit() {
    if (busy) return;
    set_busy(true);
    if (edit_id == 0) {
      api_create("citas", to_obj(f)).then(finish);
    } else {
      api_update("citas", edit_id, to_obj(f)).then(finish);
    }
  }

  function on_edit(c) {
    set_f({
      paciente_id: String(c.paciente_id),
      medico_id: String(c.medico_id),
      fecha: c.fecha,
      hora: c.hora,
      motivo: c.motivo,
      estado: c.estado
    });
    set_edit_id(c.id);
  }

  function on_estado(c, estado) {
    if (busy) return;
    var obj = to_obj(c);
    obj.estado = estado;
    set_busy(true);
    api_update("citas", c.id, obj).then(function (r) {
      set_st({ code: r.code, text: msg_of(r) });
      return refresh();
    });
  }

  function on_delete(c) {
    if (busy) return;
    if (!confirm("borrar la cita " + c.id + "?")) return;
    set_busy(true);
    api_delete("citas", c.id).then(function (r) {
      set_st({ code: r.code, text: msg_of(r) });
      if (edit_id == c.id) clear_form();
      return refresh();
    });
  }

  function make_row(c) {
    var pendiente = c.estado == "pendiente";
    return h("tr", { key: c.id },
      h("td", { className: "id" }, "#" + c.id),
      h("td", null, c.fecha),
      h("td", null, c.hora),
      h("td", null, h("strong", null, c.paciente)),
      h("td", null, c.medico),
      h("td", null, c.motivo),
      h("td", null, h("span", { className: "stamp " + c.estado }, c.estado)),
      h("td", null,
        pendiente ? h("button", { disabled: busy, onClick: function () { on_estado(c, "atendida"); } }, "atender") : null,
        pendiente ? h("button", { disabled: busy, className: "bad", onClick: function () { on_estado(c, "cancelada"); } }, "anular") : null,
        h("button", { disabled: busy, onClick: function () { on_edit(c); } }, "editar"),
        h("button", { disabled: busy, className: "bad", onClick: function () { on_delete(c); } }, "borrar")
      )
    );
  }

  var rows = [];
  var i;
  for (i = 0; i < list.length; i++) {
    rows[i] = make_row(list[i]);
  }

  return h("div", { className: "panel" },
    h("div", { className: "card form" },
      h("h2", null, edit_id == 0 ? "Nueva Cita" : "Modificar Cita", h("small", null, edit_id == 0 ? "agenda" : "#" + edit_id)),
      h("form", { onSubmit: function (e) { e.preventDefault(); on_submit(); } },
        pick("Paciente", f.paciente_id, setter(f, set_f, "paciente_id"), pacientes),
        pick("Médico Especialista", f.medico_id, setter(f, set_f, "medico_id"), medicos),
        field("Fecha", f.fecha, setter(f, set_f, "fecha"), "date"),
        field("Hora", f.hora, setter(f, set_f, "hora"), "time"),
        field("Motivo de Consulta", f.motivo, setter(f, set_f, "motivo"), "text"),
        h("div", { className: "row btns" },
          h("button", { type: "submit", disabled: busy }, edit_id == 0 ? "Agendar Cita" : "Guardar"),
          edit_id != 0 ? h("button", { type: "button", className: "alt", onClick: clear_form }, "Cancelar") : null
        )
      ),
      errno_line(st, busy)
    ),

    h("div", { className: "card" },
      h("h2", null, "Agenda de Citas", h("small", null, "Total: " + list.length)),
      table(["id", "fecha", "hora", "paciente", "médico", "motivo", "estado", "acciones"], rows)
    )
  );
}
