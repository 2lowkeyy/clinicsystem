var TABS = ["pacientes", "medicos", "citas", "historial", "recetas"];

function App() {
  var q = new URLSearchParams(window.location.search);
  var s1 = React.useState(q.get("tab") || "pacientes"); var tab = s1[0]; var set_tab = s1[1];
  var s2 = React.useState(q.get("sel") || "");          var sel = s2[0]; var set_sel = s2[1];

  function ver_historial(id) {
    set_sel(String(id));
    set_tab("historial");
  }

  function make_tab(t, idx) {
    return h("button", { key: t, className: tab == t ? "on" : "", onClick: function () { set_tab(t); } },
      h("span", { className: "n" }, "0" + (idx + 1)),
      t
    );
  }

  var tabs = [];
  var i;
  for (i = 0; i < TABS.length; i++) {
    tabs[i] = make_tab(TABS[i], i);
  }

  var panel = null;
  switch (tab) {
    case "pacientes": panel = h(Pacientes, { on_historial: ver_historial }); break;
    case "medicos":   panel = h(Medicos); break;
    case "citas":     panel = h(Citas); break;
    case "historial": panel = h(Historial, { sel: sel, set_sel: set_sel }); break;
    case "recetas":   panel = h(Recetas); break;
  }

  return h("div", null,
    h("header", { className: "top" },
      h("div", { className: "cruz" }),
      h("div", null,
        h("h1", null, "Clínica ", h("em", null, "All in 1")),
        h("div", { className: "sub" }, "Archivo General y Registro Médico Central")
      ),
      h("div", { className: "sello" },
        h("b", null, hoy()),
        "EXPEDIENTES"
      )
    ),
    h("nav", { className: "tabs" }, tabs),
    h("main", { className: "folder" }, panel),
    h("footer", { className: "pie" }, "Sistema de gestión clínica // Spring Boot + SQLite // return 0;")
  );
}

function main() {
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(h(App));
  return 0;
}

main();
