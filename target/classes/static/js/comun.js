var CLINICA = "CLINICA ALL IN 1";

var OK = 0;
var ERR_INVALID = -1;
var ERR_NOT_FOUND = -2;
var ERR_BUSY = -3;
var ERR_NET = -4;

function strerror(code) {
  switch (code) {
    case OK: return "OK";
    case ERR_INVALID: return "EINVAL: datos invalidos";
    case ERR_NOT_FOUND: return "ENOENT: no existe";
    case ERR_BUSY: return "EBUSY: conflicto";
    case ERR_NET: return "ECONNREFUSED: corriste mvnw spring-boot:run?";
  }
  return "SEGFAULT (core dumped)";
}

function status_to_rc(status) {
  if (status >= 200 && status < 300) return OK;
  switch (status) {
    case 400: return ERR_INVALID;
    case 404: return ERR_NOT_FOUND;
    case 409: return ERR_BUSY;
  }
  return -99;
}

function http_call(method, url, body) {
  var opts = { method: method, headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  return fetch(url, opts).then(function (res) {
    var rc = status_to_rc(res.status);
    if (res.status == 204) return { code: rc, data: null };
    return res.json().then(function (data) {
      return { code: rc, data: data };
    });
  }).catch(function () {
    return { code: ERR_NET, data: null };
  });
}

function api_list(what, query) { return http_call("GET", "/" + what + (query ? "?" + query : ""), null); }
function api_get(what, id)      { return http_call("GET", "/" + what + "/" + id, null); }
function api_create(what, obj)  { return http_call("POST", "/" + what, obj); }
function api_update(what, id, obj) { return http_call("PUT", "/" + what + "/" + id, obj); }
function api_delete(what, id)   { return http_call("DELETE", "/" + what + "/" + id, null); }

function msg_of(r) {
  if (r.code != OK && r.data && r.data.error) return r.data.error;
  return strerror(r.code);
}

function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

function hoy() {
  var d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function edad(nacimiento) {
  var d = new Date();
  var y = parseInt(nacimiento.substring(0, 4), 10);
  var m = parseInt(nacimiento.substring(5, 7), 10);
  var dd = parseInt(nacimiento.substring(8, 10), 10);
  var e = d.getFullYear() - y;
  if (d.getMonth() + 1 < m || (d.getMonth() + 1 == m && d.getDate() < dd)) e--;
  return e;
}
