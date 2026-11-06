var MEDICO_VACIO = { nombre: "", especialidad: "", exequatur: "", telefono: "" };

function Medicos() {
  var s1 = React.useState([]);           var list = s1[0];    var set_list = s1[1];
  var s2 = React.useState(MEDICO_VACIO); var f = s2[0];       var set_f = s2[1];
  var s3 = React.useState(0);            var edit_id = s3[0]; var set_edit_id = s3[1];
  var s4 = React.useState({ code: OK, text: "OK" }); var st = s4[0]; var set_st = s4[1];
  var s5 = React.useState(true);         var busy = s5[0];    var set_busy = s5[1];

  function refresh() {
    return api_list("medicos", "").then(function (r) {
      if (r.code == OK) {
        set_list(r.data);
      } else {
        set_st({ code: r.code, text: msg_of(r) });
      }
      set_busy(false);
    });
  }

  React.useEffect(function () { refresh(); }, []);

  function clear_form() {
    set_f(MEDICO_VACIO);
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

  function on_submit() {
    if (busy) return;
    set_busy(true);
    if (edit_id == 0) {
      api_create("medicos", f).then(finish);
    } else {
      api_update("medicos", edit_id, f).then(finish);
    }
  }

  function on_edit(m) {
    set_f({ nombre: m.nombre, especialidad: m.especialidad, exequatur: m.exequatur, telefono: m.telefono });
    set_edit_id(m.id);
  }

  function on_delete(m) {
    if (busy) return;
    if (!confirm("borrar al Dr. " + m.nombre + "?")) return;
    set_busy(true);
    api_delete("medicos", m.id).then(function (r) {
      set_st({ code: r.code, text: msg_of(r) });
      if (r.code == OK && edit_id == m.id) clear_form();
      return refresh();
    });
  }

  function make_row(m) {
    return h("tr", { key: m.id },
      h("td", { className: "id" }, "#" + m.id),
      h("td", null, h("strong", null, "Dr(a). " + m.nombre)),
      h("td", null, m.especialidad),
      h("td", null, m.exequatur),
      h("td", null, m.telefono),
      h("td", null,
        h("button", { disabled: busy, onClick: function () { on_edit(m); } }, "editar"),
        h("button", { disabled: busy, className: "bad", onClick: function () { on_delete(m); } }, "borrar")
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
      h("h2", null, edit_id == 0 ? "Nuevo Médico" : "Modificar Médico", h("small", null, edit_id == 0 ? "registro" : "#" + edit_id)),
      h("form", { onSubmit: function (e) { e.preventDefault(); on_submit(); } },
        field("Nombre Completo", f.nombre, setter(f, set_f, "nombre"), "text"),
        field("Especialidad", f.especialidad, setter(f, set_f, "especialidad"), "text"),
        field("Número Exequátur", f.exequatur, setter(f, set_f, "exequatur"), "text"),
        field("Teléfono de Contacto", f.telefono, setter(f, set_f, "telefono"), "text"),
        h("div", { className: "row btns" },
          h("button", { type: "submit", disabled: busy }, edit_id == 0 ? "Registrar" : "Guardar"),
          edit_id != 0 ? h("button", { type: "button", className: "alt", onClick: clear_form }, "Cancelar") : null
        )
      ),
      errno_line(st, busy)
    ),

    h("div", { className: "card" },
      h("h2", null, "Cuerpo Médico", h("small", null, "Total: " + list.length)),
      table(["id", "médico", "especialidad", "exequátur", "teléfono", "acciones"], rows)
    )
  );
}
