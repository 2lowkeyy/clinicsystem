var h = React.createElement;

function errno_line(st, busy) {
  var err = st.code != OK;
  return h("div", { className: "errno" + (err ? " err" : "") },
    h("b", null, "errno = " + st.code + "  (" + st.text + ")"),
    h("span", null, busy ? "comunicando con el servidor..." : "sistema listo.")
  );
}

function setter(f, set_f, key) {
  return function (v) {
    var c = Object.assign({}, f);
    c[key] = v;
    set_f(c);
  };
}

function field(label, value, on_change, type) {
  return h("div", { className: "row" },
    h("label", null, label),
    h("input", {
      type: type,
      value: value,
      onChange: function (e) { on_change(e.target.value); }
    })
  );
}

function area(label, value, on_change) {
  return h("div", { className: "row" },
    h("label", null, label),
    h("textarea", {
      rows: 4,
      value: value,
      onChange: function (e) { on_change(e.target.value); }
    })
  );
}

function pick(label, value, on_change, list) {
  var opts = [h("option", { key: 0, value: "" }, "-- seleccionar --")];
  var i;
  for (i = 0; i < list.length; i++) {
    opts[opts.length] = h("option", { key: list[i].id, value: list[i].id }, list[i].nombre);
  }
  return h("div", { className: "row" },
    h("label", null, label),
    h("select", { value: value, onChange: function (e) { on_change(e.target.value); } }, opts)
  );
}

function table(heads, rows) {
  var th = [];
  var i;
  for (i = 0; i < heads.length; i++) {
    th[i] = h("th", { key: i }, heads[i]);
  }
  if (!rows || rows.length == 0) {
    return h("div", { className: "tbl" },
      h("table", null,
        h("thead", null, h("tr", null, th)),
        h("tbody", null,
          h("tr", null,
            h("td", { colSpan: heads.length, className: "vacio" }, "sin registros en este archivo.")
          )
        )
      )
    );
  }
  return h("div", { className: "tbl" },
    h("table", null,
      h("thead", null, h("tr", null, th)),
      h("tbody", null, rows)
    )
  );
}

function imprimir_receta(id) {
  window.open("receta.html?id=" + id, "_blank");
}
