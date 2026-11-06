var PACIENTE_VACIO = { nombre: "", cedula: "", nacimiento: "", telefono: "", sangre: "" };

function Pacientes(props) {
  var s1 = React.useState([]);             var list = s1[0];    var set_list = s1[1];
  var s2 = React.useState(PACIENTE_VACIO); var f = s2[0];       var set_f = s2[1];
  var s3 = React.useState(0);              var edit_id = s3[0]; var set_edit_id = s3[1];
  var s4 = React.useState({ code: OK, text: "OK" }); var st = s4[0]; var set_st = s4[1];
  var s5 = React.useState(true);           var busy = s5[0];    var set_busy = s5[1];
  var s6 = React.useState("");             var q = s6[0];       var set_q = s6[1];

  function refresh() {
    return api_list("pacientes", q ? "q=" + encodeURIComponent(q) : "").then(function (r) {
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
    set_f(PACIENTE_VACIO);
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
      api_create("pacientes", f).then(finish);
    } else {
      api_update("pacientes", edit_id, f).then(finish);
    }
  }

  function on_buscar() {
    if (busy) return;
    set_busy(true);
    refresh();
  }

  function on_edit(p) {
    set_f({ nombre: p.nombre, cedula: p.cedula, nacimiento: p.nacimiento, telefono: p.telefono, sangre: p.sangre });
    set_edit_id(p.id);
  }

  function on_delete(p) {
    if (busy) return;
    if (!confirm("borrar a " + p.nombre + " con todo su historial, citas y recetas?")) return;
    set_busy(true);
    api_delete("pacientes", p.id).then(function (r) {
      set_st({ code: r.code, text: msg_of(r) });
      if (edit_id == p.id) clear_form();
      return refresh();
    });
  }

  function make_row(p) {
    return h("tr", { key: p.id },
      h("td", { className: "id" }, "#" + p.id),
      h("td", null, h("strong", null, p.nombre)),
      h("td", null, p.cedula),
      h("td", null, p.nacimiento + " (" + edad(p.nacimiento) + " a.)"),
      h("td", null, p.telefono),
      h("td", { className: "sangre" }, p.sangre),
      h("td", null,
        h("button", { onClick: function () { props.on_historial(p.id); } }, "historial"),
        h("button", { disabled: busy, onClick: function () { on_edit(p); } }, "editar"),
        h("button", { disabled: busy, className: "bad", onClick: function () { on_delete(p); } }, "borrar")
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
      h("h2", null, edit_id == 0 ? "Nuevo Paciente" : "Modificar Ficha", h("small", null, edit_id == 0 ? "alta" : "#" + edit_id)),
      h("form", { onSubmit: function (e) { e.preventDefault(); on_submit(); } },
        field("Nombre Completo", f.nombre, setter(f, set_f, "nombre"), "text"),
        field("Cédula / Documento", f.cedula, setter(f, set_f, "cedula"), "text"),
        field("Fecha Nacimiento", f.nacimiento, setter(f, set_f, "nacimiento"), "date"),
        field("Teléfono", f.telefono, setter(f, set_f, "telefono"), "text"),
        field("Tipo de Sangre", f.sangre, setter(f, set_f, "sangre"), "text"),
        h("div", { className: "row btns" },
          h("button", { type: "submit", disabled: busy }, edit_id == 0 ? "Registrar" : "Guardar"),
          edit_id != 0 ? h("button", { type: "button", className: "alt", onClick: clear_form }, "Cancelar") : null
        )
      ),
      errno_line(st, busy)
    ),

    h("div", { className: "card" },
      h("h2", null, "Padrón de Pacientes", h("small", null, "Total: " + list.length)),
      h("form", { className: "buscar", onSubmit: function (e) { e.preventDefault(); on_buscar(); } },
        h("input", { value: q, placeholder: "Filtrar por nombre o cédula...", onChange: function (e) { set_q(e.target.value); } }),
        h("button", { type: "submit", disabled: busy }, "Buscar")
      ),
      table(["id", "nombre", "cédula", "nacimiento", "teléfono", "sangre", "acciones"], rows)
    )
  );
}
