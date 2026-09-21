const C = require("./calculo.js");

let fallos = 0;
function verificar(nombre, obtenido, esperado) {
  if (obtenido !== esperado) {
    console.error(
      `FALLA ${nombre}: esperado ${esperado}, obtenido ${obtenido}`,
    );
    fallos++;
  } else {
    console.log(`ok ${nombre}`);
  }
}

// Caso de mano: energía = disponibles*4 + grasa*9 + proteína*4 + fibra*2
const valores100 = {
  prot: 5,
  grasa: 10,
  sat: 3,
  trans: 0,
  cho: 60,
  azt: 20,
  aza: 15,
  fib: 5,
  na: 200,
  vita: 100,
  vitd: 1,
  fe: 2,
  zn: 1,
  ca: 100,
};
const res = C.calcular(valores100, 30);
// disponibles = 60-5=55; energia100 = 55*4+10*9+5*4+5*2 = 220+90+20+10 = 340
verificar("energia100", res.energia100, 340);
verificar("energiaPorcion (factor 0.3)", res.energiaPorcion, 102);
verificar("grasa por porción", res.valoresPorcion.grasa, 3);

// Tabla 2: declarar "0" bajo el umbral, aunque el valor real no sea cero
verificar(
  "grasa saturada 0.05 -> 0 (umbral 0.1)",
  C.formatearNutriente("sat", 0.05),
  0,
);
verificar("energía 4 kcal exactas -> 0", C.formatearEnergia(4), 0);
verificar("energía 4.01 kcal -> no es cero", C.formatearEnergia(4.01), 4);

// Tabla 1: redondeo por magnitud, sin el error clásico de toFixed con punto flotante
verificar(
  "redondearDecimales(35.855, 2)",
  C.redondearDecimales(35.855, 2),
  35.86,
);
verificar(
  "redondearTabla1 en rango >=10 <100",
  C.redondearTabla1(15.5, null, false),
  16,
);
verificar(
  "redondearTabla1 vitamina <1, 2 decimales",
  C.redondearTabla1(0.123, null, true),
  0.12,
);
verificar(
  "redondearTabla1 no-vitamina <1, 1 decimal",
  C.redondearTabla1(0.123, null, false),
  0.1,
);

// Cada columna redondea según SU propia magnitud, no la de la otra columna
// (grasa total 10 g/100g -> 3 g/porción; 3 cae en el bracket [1,10) -> 1 decimal)
verificar(
  "decimalesParaNutriente grasa 100g (10 -> 0 dec.)",
  C.decimalesParaNutriente("grasa", 10),
  0,
);
verificar(
  "decimalesParaNutriente grasa porción (3 -> 1 dec.)",
  C.decimalesParaNutriente("grasa", 3),
  1,
);

// Modo "norma": omisión de filas según la Tabla 3 (art. 10.7)
verificar(
  "grasa saturada 0.1 exacto -> se omite",
  C.nutrientesAOmitir({ sat: 0.1 }, "norma").has("sat"),
  true,
);
verificar(
  "grasa saturada 0.11 -> NO se omite",
  C.nutrientesAOmitir({ sat: 0.11 }, "norma").has("sat"),
  false,
);
verificar(
  "vitamina A exactamente 2% (16 ug) -> NO se omite (no es 'inferior')",
  C.nutrientesAOmitir({ vita: 16 }, "norma").has("vita"),
  false,
);
verificar(
  "vitamina A 15.9 ug (<2%) -> se omite",
  C.nutrientesAOmitir({ vita: 15.9 }, "norma").has("vita"),
  true,
);
verificar(
  "grasa trans nunca se omite, aunque sea 0 mg",
  C.nutrientesAOmitir({ trans: 0 }, "norma").has("trans"),
  false,
);
verificar(
  "calcio nunca está en NOMBRE_OMISION",
  "ca" in C.NOMBRE_OMISION,
  false,
);
verificar(
  "modo 'todo' -> nunca omite nada",
  C.nutrientesAOmitir({ sat: 0, azt: 0, vita: 0 }, "todo").size,
  0,
);

// Excepciones de la Tabla 3: declaraciones en la etiqueta anulan la omisión
verificar(
  "grasa saturada 0.05 se omite sin declaración de grasa",
  C.nutrientesAOmitir({ sat: 0.05 }, "norma").has("sat"),
  true,
);
verificar(
  "grasa saturada 0.05 NO se omite con declaración de grasa/ácidos grasos/colesterol",
  C.nutrientesAOmitir({ sat: 0.05 }, "norma", { grasa: true }).has("sat"),
  false,
);
verificar(
  "azúcares 0.3 se omite sin declaración de edulcorantes/azúcares/polialcoholes",
  C.nutrientesAOmitir({ azt: 0.3 }, "norma").has("azt"),
  true,
);
verificar(
  "azúcares 0.3 NO se omite con esa declaración (se muestra como 0)",
  C.nutrientesAOmitir({ azt: 0.3 }, "norma", { azucares: true }).has("azt"),
  false,
);
verificar(
  "azúcares 0.3 con declaración sigue formateando a 0 (Tabla 2)",
  C.formatearNutriente("azt", 0.3),
  0,
);

verificar(
  "leyenda con 2 nutrientes",
  C.textoLeyendaOmision(new Set(["sat", "fib"])),
  "No es una fuente significativa de grasa saturada y fibra dietaria.",
);
verificar(
  "leyenda con 3 nutrientes",
  C.textoLeyendaOmision(new Set(["sat", "azt", "fib"])),
  "No es una fuente significativa de grasa saturada, azúcares y fibra dietaria.",
);
verificar("leyenda vacía", C.textoLeyendaOmision(new Set()), "");

// Sellos de advertencia (art. 32, Tabla 17)
verificar(
  "sodio activo por relación mg/kcal >= 1",
  C.calcularSellos({ na: 50 }, 40, false).sodio.activo,
  true,
);
verificar(
  "sodio activo por umbral absoluto >= 300 mg",
  C.calcularSellos({ na: 300 }, 5000, false).sodio.activo,
  true,
);
verificar(
  "sodio inactivo bajo ambos umbrales",
  C.calcularSellos({ na: 50 }, 200, false).sodio.activo,
  false,
);

verificar(
  "azúcares activo solo por añadidos (12%), no por totales (8%)",
  C.calcularSellos({ azt: 2, aza: 3 }, 100, false).azucares.activo,
  true,
);
verificar(
  "azúcares activo solo por totales (12%), no por añadidos (4%)",
  C.calcularSellos({ azt: 3, aza: 1 }, 100, false).azucares.activo,
  true,
);
verificar(
  "azúcares inactivo por ambas bases",
  C.calcularSellos({ azt: 1, aza: 0.5 }, 100, false).azucares.activo,
  false,
);

verificar(
  "grasa saturada activa exactamente en 10%",
  C.calcularSellos({ sat: 1 }, 90, false).grasaSaturada.activo,
  true,
);
verificar(
  "grasa saturada inactiva justo bajo 10%",
  C.calcularSellos({ sat: 0.99 }, 90, false).grasaSaturada.activo,
  false,
);

verificar(
  "grasa trans activa exactamente en 1% (convierte mg a g)",
  C.calcularSellos({ trans: 1000 }, 900, false).grasaTrans.activo,
  true,
);
verificar(
  "grasa trans inactiva justo bajo 1%",
  C.calcularSellos({ trans: 999 }, 900, false).grasaTrans.activo,
  false,
);

// Separación industrial/natural (art. 32.2.d, mod. Res. 2066/2024): el sello
// solo cuenta la grasa trans industrial, aunque la tabla declare el total.
verificar(
  "grasa trans: sin transIndustrial, usa el total declarado (comportamiento actual)",
  C.calcularSellos({ trans: 1000 }, 900, false).grasaTrans.activo,
  true,
);
verificar(
  "grasa trans: con transIndustrial bajo el umbral, sello NO activo aunque el total sea alto",
  C.calcularSellos({ trans: 1000 }, 900, false, 5).grasaTrans.activo,
  false,
);
verificar(
  "grasa trans: transIndustrial en cero -> sello inactivo (toda natural)",
  C.calcularSellos({ trans: 1000 }, 900, false, 0).grasaTrans.activo,
  false,
);

verificar(
  "edulcorantes: activo cuando se marca la casilla",
  C.calcularSellos({}, 100, true).edulcorantes.activo,
  true,
);
verificar(
  "edulcorantes: inactivo por defecto",
  C.calcularSellos({}, 100, false).edulcorantes.activo,
  false,
);

if (fallos > 0) {
  console.error(`\n${fallos} prueba(s) fallida(s)`);
  process.exit(1);
}
console.log("\nTodas las pruebas pasaron");
