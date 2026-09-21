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
  { k: "vita", nombre: "Vitamina A", unidad: "ug" },
  { k: "vitd", nombre: "Vitamina D", unidad: "ug" },
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

const VITAMINAS_MINERALES = new Set(["vita", "vitd", "fe", "zn", "ca"]);

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

function calcular(valores100, porcionG) {
  const cho = valores100.cho || 0;
  const fib = valores100.fib || 0;
  const grasa = valores100.grasa || 0;
  const prot = valores100.prot || 0;

  const disponibles100 = cho - fib;
  const energia100 = disponibles100 * 4 + grasa * 9 + prot * 4 + fib * 2;

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
  calcular,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
} else {
  window.C = api;
}
