// Cálculo de la tabla de información nutricional colombiana (Res. 810 de 2021, arts. 9 y 11).

// Nutrientes de entrada, todos por 100 g/mL. unidad: "g", "mg" o "ug".
const PARAMS = [
  { k: "prot", nombre: "Proteína", unidad: "g" },
  { k: "grasa", nombre: "Grasa total", unidad: "g" },
  { k: "sat", nombre: "Grasa saturada", unidad: "g" },
  { k: "trans", nombre: "Grasa trans", unidad: "mg" },
  { k: "cho", nombre: "Carbohidratos totales", unidad: "g" },
  { k: "azt", nombre: "Azúcares totales", unidad: "g" },
  { k: "aza", nombre: "Azúcares añadidos", unidad: "g" },
  { k: "fib", nombre: "Fibra dietaria", unidad: "g" },
  { k: "na", nombre: "Sodio", unidad: "mg" },
  // Declaración voluntaria (art. 10.8.1); si se declara, va inmediatamente
  // debajo de sodio (art. 28.4) y no se separa de él con línea (art. 28.3).
  { k: "pot", nombre: "Potasio", unidad: "mg" },
  { k: "vita", nombre: "Vitamina A", unidad: "µg ER" },
  { k: "vitd", nombre: "Vitamina D", unidad: "µg" },
  { k: "fe", nombre: "Hierro", unidad: "mg" },
  { k: "zn", nombre: "Zinc", unidad: "mg" },
  { k: "ca", nombre: "Calcio", unidad: "mg" },
];

// Tabla 2 (art. 9, parágrafo 2): declarar "0" si el valor no supera el umbral.
// Los umbrales de energía y colesterol se manejan aparte porque no son PARAMS.
const UMBRAL_CERO = {
  energia: 4, // kcal
  prot: 0.5,
  grasa: 0.5,
  sat: 0.1,
  trans: 100, // mg
  cho: 0.5,
  azt: 0.5,
  aza: 0.5,
  fib: 0.5,
  na: 5, // mg
};

function esNumero(v) {
  return typeof v === "number" && Number.isFinite(v);
}

// Redondeo "half-up" por escalado a entero. toPrecision(15) limpia el ruido de
// punto flotante (35.855*100 da 3585.4999999999995, no 3585.5) antes de redondear.
function redondearDecimales(valor, decimales) {
  const factor = Math.pow(10, decimales);
  return Math.round(Number((valor * factor).toPrecision(15))) / factor;
}

// Tabla 1 (art. 9): cifras significativas por magnitud.
// unidad "ug"/"mg" de vitaminas/minerales usa 2 decimales bajo 1; el resto usa 1.
function decimalesTabla1(valor, esVitaminaOMineral) {
  const abs = Math.abs(valor);
  if (abs >= 10) return 0;
  if (abs >= 1) return 1;
  return esVitaminaOMineral ? 2 : 1;
}

function redondearTabla1(valor, unidad, esVitaminaOMineral) {
  return redondearDecimales(valor, decimalesTabla1(valor, esVitaminaOMineral));
}

const VITAMINAS_MINERALES = new Set(["vita", "vitd", "fe", "zn", "ca", "pot"]);

// Aplica Tabla 2 (cero) y luego Tabla 1 (redondeo) a un nutriente declarado.
function formatearNutriente(k, valor) {
  const umbral = UMBRAL_CERO[k];
  if (umbral !== undefined && valor <= umbral) return 0;
  return redondearTabla1(valor, null, VITAMINAS_MINERALES.has(k));
}

// Decimales a mostrar para ese mismo nutriente: 0 si cayó en el umbral de
// Tabla 2, o los que Tabla 1 exige para SU magnitud (no la de otra columna).
function decimalesParaNutriente(k, valor) {
  const umbral = UMBRAL_CERO[k];
  if (umbral !== undefined && valor <= umbral) return 0;
  return decimalesTabla1(valor, VITAMINAS_MINERALES.has(k));
}

function formatearEnergia(kcal) {
  if (kcal <= UMBRAL_CERO.energia) return 0;
  return redondearTabla1(kcal, null, false);
}

function decimalesParaEnergia(kcal) {
  if (kcal <= UMBRAL_CERO.energia) return 0;
  return decimalesTabla1(kcal, false);
}

// 2 % de la Tabla 9 (VRN-N, adultos): vitamina A 800 ug ER, vitamina D 15 ug,
// hierro 20 mg, zinc 11 mg. Bajo esto, la Tabla 3 permite omitir esa fila.
const VRN_2PCT = { vita: 16, vitd: 0.3, fe: 0.4, zn: 0.22 };

// Nutrientes cuya fila la Tabla 3 (art. 10.7, "Requisitos adicionales") permite
// omitir por umbral, con el nombre para la leyenda. Grasa trans y calcio NO
// están en esta lista aunque tengan umbral en la Tabla 2 (grasa trans) o
// pudieran parecer candidatos (calcio): su columna de requisitos no da esa
// excepción.
const NOMBRE_OMISION = {
  sat: "grasa saturada",
  azt: "azúcares",
  fib: "fibra dietaria",
  vita: "vitamina A",
  vitd: "vitamina D",
  fe: "hierro",
  zn: "zinc",
  // Solo se usa desde el formato simplificado (art. 30.2): en el vertical
  // estándar (Tabla 3) el calcio nunca entra al Set de omisión.
  ca: "calcio",
};

// modo: "todo" (declarar siempre todo) o "norma" (omitir cuando el art. 10.7 lo permite).
// declaraciones.grasa: hay declaración de propiedades sobre grasa/ácidos grasos/colesterol
//   -> grasa saturada nunca se omite (Tabla 3, excepción de esa fila).
// declaraciones.azucares: hay declaración o referencia a edulcorantes/azúcares/polialcoholes
//   en la etiqueta -> azúcares totales nunca se omite, se declara "0" (ya lo hace Tabla 2).
function nutrientesAOmitir(valores100, modo, declaraciones = {}) {
  const omitidos = new Set();
  if (modo !== "norma") return omitidos;
  for (const k of ["sat", "azt", "fib"]) {
    if ((valores100[k] || 0) <= UMBRAL_CERO[k]) omitidos.add(k);
  }
  for (const k of ["vita", "vitd", "fe", "zn"]) {
    if ((valores100[k] || 0) < VRN_2PCT[k]) omitidos.add(k);
  }
  if (declaraciones.grasa) omitidos.delete("sat");
  if (declaraciones.azucares) omitidos.delete("azt");
  return omitidos;
}

// Formato simplificado (art. 30.2): a diferencia del vertical estándar,
// calorías, grasa total, grasa saturada, grasa trans, carbohidratos totales,
// proteína, sodio, azúcares totales y azúcares añadidos son SIEMPRE
// obligatorios (letra a) -- nunca se omiten aunque caigan bajo el umbral. Los
// únicos nutrientes que esa misma norma permite omitir son fibra dietaria,
// vitamina A, vitamina D, hierro, zinc y calcio (este último NUNCA se omite
// en el formato vertical estándar, ver comentario de NOMBRE_OMISION).
const OMITIBLES_SIMPLIFICADO = new Set([
  "fib",
  "vita",
  "vitd",
  "fe",
  "zn",
  "ca",
]);

// Orden de declaración del art. 28.4 (aplica también al simplificado, art.
// 30.2: "misma presentación gráfica... del formato vertical estándar"), más
// el orden de vitaminas/minerales del propio 28.4.
const ORDEN_SIMPLIFICADO = [
  "grasa",
  "sat",
  "trans",
  "cho",
  "fib",
  "azt",
  "aza",
  "prot",
  "na",
  "vita",
  "vitd",
  "fe",
  "ca",
  "zn",
];

// Tabla 9 (VRN-N, adultos): calcio 1 000 mg; 2 % = 20 mg. El art. 10.7 no da
// esta excepción al calcio para el formato vertical estándar, pero el art.
// 30.2 sí lo cuenta entre los nutrientes "no significativos" elegibles para
// decidir si el formato simplificado puede usarse.
const VRN_2PCT_SIMPLIFICADO = { ...VRN_2PCT, ca: 20 };

// Los 15 nutrientes del art. 30.2 (calorías + 14 más) que son "no
// significativos" con estos valores. Sirve tanto para contar la condición de
// elegibilidad del formato (6 o más) como para decidir cuáles de los
// omitibles se ocultan de la tabla.
function noSignificativosSimplificado(valores100, energia100) {
  const n = new Set();
  if ((energia100 || 0) <= UMBRAL_CERO.energia) n.add("energia");
  for (const k of [
    "grasa",
    "sat",
    "trans",
    "na",
    "cho",
    "fib",
    "azt",
    "aza",
    "prot",
  ]) {
    if ((valores100[k] || 0) <= UMBRAL_CERO[k]) n.add(k);
  }
  for (const k of ["vita", "vitd", "fe", "zn", "ca"]) {
    if ((valores100[k] || 0) < VRN_2PCT_SIMPLIFICADO[k]) n.add(k);
  }
  return n;
}

// art. 30.2: el formato simplificado solo puede usarse si 6 o más de esos 15
// nutrientes son "no significativos".
function puedeUsarSimplificado(valores100, energia100) {
  return noSignificativosSimplificado(valores100, energia100).size >= 6;
}

function nutrientesAOmitirSimplificado(valores100, energia100, modo) {
  if (modo !== "norma") return new Set();
  const n = noSignificativosSimplificado(valores100, energia100);
  return new Set([...n].filter((k) => OMITIBLES_SIMPLIFICADO.has(k)));
}

function textoLeyendaOmision(omitidos) {
  if (omitidos.size === 0) return "";
  const nombres = [...omitidos].map((k) => NOMBRE_OMISION[k]);
  const ultimo = nombres.pop();
  const lista = nombres.length ? `${nombres.join(", ")} y ${ultimo}` : ultimo;
  return `No es una fuente significativa de ${lista}.`;
}

// Umbrales de la Tabla 17 (art. 32): porcentaje de energía, o cantidad absoluta.
// transIndustrialMg: grasa trans INDUSTRIAL en mg/100g, para el sello (art. 32.2.d,
// modificado por la Res. 2066/2024) — excluye la de origen natural (lácteos,
// rumiantes). La tabla nutricional sigue declarando el total (valores100.trans);
// si no se especifica, se asume que todo lo declarado es industrial.
function calcularSellos(
  valores100,
  energia100,
  edulcorantes,
  transIndustrialMg,
) {
  const kcal = energia100 > 0 ? energia100 : 0;
  const pctEnergia = (gramos, factorKcal) =>
    kcal > 0 ? ((gramos * factorKcal) / kcal) * 100 : 0;

  const na = valores100.na || 0;
  const ratioSodio = kcal > 0 ? na / kcal : 0;
  const sodio = { ratioSodio, na, activo: ratioSodio >= 1 || na >= 300 };

  const pctAzt = pctEnergia(valores100.azt || 0, 4);
  const pctAza = pctEnergia(valores100.aza || 0, 4);
  const azucares = {
    pctAnadidos: pctAza,
    pctTotales: pctAzt,
    activo: pctAza >= 10 || pctAzt >= 10,
  };

  const pctSat = pctEnergia(valores100.sat || 0, 9);
  const grasaSaturada = { pct: pctSat, activo: pctSat >= 10 };

  const transTotal = valores100.trans || 0;
  const transMg = esNumero(transIndustrialMg) ? transIndustrialMg : transTotal;
  const pctTrans = pctEnergia(transMg / 1000, 9);
  const grasaTrans = {
    pct: pctTrans,
    activo: pctTrans >= 1,
    transMg,
    transTotal,
  };

  return {
    sodio,
    azucares,
    grasaSaturada,
    grasaTrans,
    edulcorantes: { activo: !!edulcorantes },
  };
}

// factorFibra: kcal/g de fibra dietaria. El art. 11.1 (Tabla 4) no fija este
// valor -- "el fabricante utilizará los factores de conversión calórica
// contemplados en documentos de referencia científica" -- así que 2 kcal/g es
// solo el valor por defecto, no una obligación legal.
function calcular(valores100, porcionG, factorFibra) {
  const cho = valores100.cho || 0;
  const fib = valores100.fib || 0;
  const grasa = valores100.grasa || 0;
  const prot = valores100.prot || 0;
  const fFibra = esNumero(factorFibra) ? factorFibra : 2;

  const disponibles100 = cho - fib;
  const energia100 = disponibles100 * 4 + grasa * 9 + prot * 4 + fib * fFibra;

  const factor = esNumero(porcionG) && porcionG > 0 ? porcionG / 100 : 0;

  const valoresPorcion = {};
  for (const { k } of PARAMS) {
    valoresPorcion[k] = (valores100[k] || 0) * factor;
  }
  const energiaPorcion = energia100 * factor;

  return { valores100, valoresPorcion, energia100, energiaPorcion };
}

const api = {
  PARAMS,
  UMBRAL_CERO,
  VITAMINAS_MINERALES,
  esNumero,
  redondearDecimales,
  decimalesTabla1,
  redondearTabla1,
  formatearNutriente,
  decimalesParaNutriente,
  formatearEnergia,
  decimalesParaEnergia,
  VRN_2PCT,
  NOMBRE_OMISION,
  nutrientesAOmitir,
  OMITIBLES_SIMPLIFICADO,
  ORDEN_SIMPLIFICADO,
  noSignificativosSimplificado,
  puedeUsarSimplificado,
  nutrientesAOmitirSimplificado,
  textoLeyendaOmision,
  calcularSellos,
  calcular,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
} else {
  window.C = api;
}
