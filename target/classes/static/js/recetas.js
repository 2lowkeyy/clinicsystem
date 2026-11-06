function receta_vacia() {
  return { paciente_id: "", medico_id: "", fecha: hoy(), medicamentos: "", indicaciones: "" };
}

function Recetas() {
  var s1 = React.useState([]);           var list = s1[0];      var set_list = s1[1];
  var s2 = React.useState(receta_vacia); var f = s2[0];         var set_f = s2[1];
  var s3 = React.useState(0);            var edit_id = s3[0];   var set_edit_id = s3[1];
  var s4 = React.useState({ code: OK, text: "OK" }); var st = s4[0]; var set_st = s4[1];
  var s5 = React.useState(true);         var busy = s5[0];      var set_busy = s5[1];
  var s6 = React.useState([]);           var pacientes = s6[0]; var set_pacientes = s6[1];
  var s7 = React.useState([]);           var medicos = s7[0];   var set_medicos = s7[1];

  function refresh() {
    return Promise.all([api_list("recetas", ""), api_list("pacientes", ""), api_list("medicos", "")]).then(function (r) {
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
    set_f(receta_vacia());
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

  function to_obj(x) {
    return {
      paciente_id: parseInt(x.paciente_id, 10),
      medico_id: parseInt(x.medico_id, 10),
      fecha: x.fecha,
      medicamentos: x.medicamentos,
      indicaciones: x.indicaciones
    };
  }

  function on_submit() {
    if (busy) return;
    set_busy(true);
    if (edit_id == 0) {
      api_create("recetas", to_obj(f)).then(finish);
    } else {
      api_update("recetas", edit_id, to_obj(f)).then(finish);
    }
  }

  function on_edit(x) {
    set_f({
      paciente_id: String(x.paciente_id),
      medico_id: String(x.medico_id),
      fecha: x.fecha,
      medicamentos: x.medicamentos,
      indicaciones: x.indicaciones
    });
    set_edit_id(x.id);
  }

  function on_delete(x) {
    if (busy) return;
    if (!confirm("borrar la receta " + x.id + "?")) return;
    set_busy(true);
    api_delete("recetas", x.id).then(function (r) {
      set_st({ code: r.code, text: msg_of(r) });
      if (edit_id == x.id) clear_form();
      return refresh();
    });
  }

  function make_row(x) {
    return h("tr", { key: x.id },
      h("td", { className: "id" }, "#" + x.id),
      h("td", null, x.fecha),
      h("td", null, h("strong", null, x.paciente)),
      h("td", null, "Dr(a). " + x.medico),
      h("td", { className: "wrap" }, x.medicamentos.split("\n")[0]),
      h("td", null,
        h("button", { onClick: function () { imprimir_receta(x.id); } }, "Imprimir Rx"),
        h("button", { disabled: busy, onClick: function () { on_edit(x); } }, "editar"),
        h("button", { disabled: busy, className: "bad", onClick: function () { on_delete(x); } }, "borrar")
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
      h("h2", null, edit_id == 0 ? "Prescribir Receta" : "Modificar Receta", h("small", null, edit_id == 0 ? "Rx" : "#" + edit_id)),
      h("form", { onSubmit: function (e) { e.preventDefault(); on_submit(); } },
        pick("Paciente", f.paciente_id, setter(f, set_f, "paciente_id"), pacientes),
        pick("Médico Emisor", f.medico_id, setter(f, set_f, "medico_id"), medicos),
        field("Fecha Emisión", f.fecha, setter(f, set_f, "fecha"), "date"),
        area("Medicamentos / Dosis", f.medicamentos, setter(f, set_f, "medicamentos")),
        area("Indicaciones / Pauta", f.indicaciones, setter(f, set_f, "indicaciones")),
        h("div", { className: "row btns" },
          h("button", { type: "submit", disabled: busy }, edit_id == 0 ? "Emitir Receta" : "Guardar"),
          edit_id != 0 ? h("button", { type: "button", className: "alt", onClick: clear_form }, "Cancelar") : null
        )
      ),
      errno_line(st, busy)
    ),

    h("div", { className: "card" },
      h("h2", null, "Libro de Recetas", h("small", null, "Total: " + list.length)),
      table(["id", "fecha", "paciente", "médico", "medicamento", "acciones"], rows)
    )
  );
}
