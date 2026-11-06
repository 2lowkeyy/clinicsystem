package com.zip.clinica;

import java.util.Map;

import org.springframework.http.ResponseEntity;

public class Util {

    public static ResponseEntity<Object> err(int status, String msg) {
        return ResponseEntity.status(status).body(Map.of("error", msg));
    }

    public static boolean vacio(String s) {
        return s == null || s.trim().length() == 0;
    }

    public static boolean es_fecha(String s) {
        return s != null && s.matches("\\d{4}-\\d{2}-\\d{2}");
    }

    public static boolean es_hora(String s) {
        return s != null && s.matches("\\d{2}:\\d{2}");
    }
}
