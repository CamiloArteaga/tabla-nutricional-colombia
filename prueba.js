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

if (fallos > 0) {
  console.error(`\n${fallos} prueba(s) fallida(s)`);
  process.exit(1);
}
console.log("\nTodas las pruebas pasaron");
