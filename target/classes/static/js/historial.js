function consulta_vacia() {
  return { medico_id: "", fecha: hoy(), diagnostico: "", notas: "" };
}

function Historial(props) {
  var sel = props.sel;
  var s1 = React.useState([]);             var pacientes = s1[0]; var set_pacientes = s1[1];
  var s2 = React.useState([]);             var medicos = s2[0];   var set_medicos = s2[1];
  var s3 = React.useState(null);           var pac = s3[0];       var set_pac = s3[1];
  var s4 = React.useState([]);             var consultas = s4[0]; var set_consultas = s4[1];
  var s5 = React.useState([]);             var citas = s5[0];     var set_citas = s5[1];
  var s6 = React.useState([]);             var recetas = s6[0];   var set_recetas = s6[1];
  var s7 = React.useState(consulta_vacia); var f = s7[0];         var set_f = s7[1];
  var s8 = React.useState(0);              var edit_id = s8[0];   var set_edit_id = s8[1];
  var s9 = React.useState({ code: OK, text: "OK" }); var st = s9[0]; var set_st = s9[1];
  var s10 = React.useState(false);         var busy = s10[0];     var set_busy = s10[1];

  React.useEffect(function () {
    Promise.all([api_list("pacientes", ""), api_list("medicos", "")]).then(function (r) {
      if (r[0].code == OK) set_pacientes(r[0].data);
      if (r[1].code == OK) set_medicos(r[1].data);
      if (r[0].code != OK) set_st({ code: r[0].code, text: msg_of(r[0]) });
    });
  }, []);

  function load() {
    var q = "paciente=" + sel;
    if (sel == "") {
      set_pac(null);
      return;
    }
    set_busy(true);
    return Promise.all([
      api_get("pacientes", sel),
      api_list("historial", q),
      api_list("citas", q),
      api_list("recetas", q)
    ]).then(function (r) {
      if (r[0].code != OK) {
        set_st({ code: r[0].code, text: msg_of(r[0]) });
        set_pac(null);
      } else {
        set_pac(r[0].data);
        set_consultas(r[1].data || []);
        set_citas(r[2].data || []);
        set_recetas(r[3].data || []);
      }
      set_busy(false);
    });
  }

  React.useEffect(function () {
    clear_form();
    load();
  }, [sel]);

  function clear_form() {
    set_f(consulta_vacia());
    set_edit_id(0);
  }

  function finish(r) {
    set_st({ code: r.code, text: msg_of(r) });
    if (r.code == OK) {
      clear_form();
      return load();
    }
    set_busy(false);
  }

  function to_obj(c) {
    return {
      paciente_id: parseInt(sel, 10),
      medico_id: parseInt(c.medico_id, 10),
      fecha: c.fecha,
      diagnostico: c.diagnostico,
      notas: c.notas
    };
  }

  function on_submit() {
    if (busy) return;
    set_busy(true);
    if (edit_id == 0) {
      api_create("historial", to_obj(f)).then(finish);
    } else {
      api_update("historial", edit_id, to_obj(f)).then(finish);
    }
  }

  function on_edit(c) {
    set_f({ medico_id: String(c.medico_id), fecha: c.fecha, diagnostico: c.diagnostico, notas: c.notas });
    set_edit_id(c.id);
  }

  function on_delete(c) {
    if (busy) return;
    if (!confirm("borrar la consulta del " + c.fecha + "?")) return;
    set_busy(true);
    api_delete("historial", c.id).then(function (r) {
      set_st({ code: r.code, text: msg_of(r) });
      if (edit_id == c.id) clear_form();
      return load();
    });
  }

  if (pac == null) {
    return h("div", { className: "panel" },
      h("div", { className: "card form" },
        h("h2", null, "Expediente Clínico", h("small", null, "búsqueda")),
        pick("Seleccionar Paciente", sel, props.set_sel, pacientes),
        errno_line(st, busy)
      ),
      h("div", { className: "card" },
        h("h2", null, "Historial Médico Central"),
        h("div", { className: "vacio" }, "Seleccione un paciente en la lista para desplegar su ficha médica, consultas, recetas y citas agendadas.")
      )
    );
  }

  var rows_c = [];
  var rows_ci = [];
  var rows_r = [];
  var i;

  for (i = 0; i < consultas.length; i++) {
    (function (c) {
      rows_c[rows_c.length] = h("tr", { key: c.id },
        h("td", null, c.fecha),
        h("td", null, "Dr(a). " + c.medico),
        h("td", null, h("strong", null, c.diagnostico)),
        h("td", { className: "wrap" }, c.notas),
        h("td", null,
          h("button", { disabled: busy, onClick: function () { on_edit(c); } }, "editar"),
          h("button", { disabled: busy, className: "bad", onClick: function () { on_delete(c); } }, "borrar")
        )
      );
    })(consultas[i]);
  }

  for (i = 0; i < citas.length; i++) {
    rows_ci[i] = h("tr", { key: citas[i].id },
      h("td", null, citas[i].fecha),
      h("td", null, citas[i].hora),
      h("td", null, "Dr(a). " + citas[i].medico),
      h("td", null, citas[i].motivo),
      h("td", null, h("span", { className: "stamp " + citas[i].estado }, citas[i].estado))
    );
  }

  for (i = 0; i < recetas.length; i++) {
    (function (x) {
      rows_r[rows_r.length] = h("tr", { key: x.id },
        h("td", { className: "id" }, "#" + x.id),
        h("td", null, x.fecha),
        h("td", null, "Dr(a). " + x.medico),
        h("td", { className: "wrap" }, x.medicamentos.split("\n")[0]),
        h("td", null, h("button", { onClick: function () { imprimir_receta(x.id); } }, "Imprimir Rx"))
      );
    })(recetas[i]);
  }

  return h("div", { className: "panel" },
    h("div", { className: "col" },
      h("div", { className: "card" },
        h("h2", null, "Expediente Activo", h("small", null, "#" + pac.id)),
        pick("Cambiar Paciente", sel, props.set_sel, pacientes),
        h("dl", { className: "ficha" },
          h("div", { className: "grande" }, pac.nombre),
          h("dt", null, "Cédula"),
          h("dd", null, pac.cedula),
          h("dt", null, "Nacimiento"),
          h("dd", null, pac.nacimiento + " (" + edad(pac.nacimiento) + " años)"),
          h("dt", null, "Teléfono"),
          h("dd", null, pac.telefono || "--"),
          h("dt", null, "Grupo Sangre"),
          h("dd", { className: "sangre" }, pac.sangre || "--")
        )
      ),
      h("div", { className: "card form" },
        h("h2", null, edit_id == 0 ? "Nueva Nota de Consulta" : "Modificar Nota", h("small", null, edit_id == 0 ? "clínica" : "#" + edit_id)),
        h("form", { onSubmit: function (e) { e.preventDefault(); on_submit(); } },
          pick("Médico que Atiende", f.medico_id, setter(f, set_f, "medico_id"), medicos),
          field("Fecha Consulta", f.fecha, setter(f, set_f, "fecha"), "date"),
          field("Diagnóstico / Juicio Clínico", f.diagnostico, setter(f, set_f, "diagnostico"), "text"),
          area("Notas de Evolución y Observaciones", f.notas, setter(f, set_f, "notas")),
          h("div", { className: "row btns" },
            h("button", { type: "submit", disabled: busy }, edit_id == 0 ? "Asentar Nota" : "Guardar"),
            edit_id != 0 ? h("button", { type: "button", className: "alt", onClick: clear_form }, "Cancelar") : null
          )
        ),
        errno_line(st, busy)
      )
    ),

    h("div", { className: "col" },
      h("div", { className: "card" },
        h("h2", null, "Consultas y Evolución Clínica", h("small", null, "Total: " + consultas.length)),
        table(["fecha", "médico", "diagnóstico", "notas", "acciones"], rows_c)
      ),
      h("div", { className: "card" },
        h("h2", null, "Recetas Emitidas", h("small", null, "Total: " + recetas.length)),
        table(["id", "fecha", "médico", "medicamento", "acciones"], rows_r)
      ),
      h("div", { className: "card" },
        h("h2", null, "Historial de Citas", h("small", null, "Total: " + citas.length)),
        table(["fecha", "hora", "médico", "motivo", "estado"], rows_ci)
      )
    )
  );
}
