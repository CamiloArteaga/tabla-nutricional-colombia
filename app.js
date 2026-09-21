const CLAVE_GUARDADO = "tabla-nutricional-colombia:formulario";

const guardado = {
  leer() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || "{}");
    } catch {
      return {};
    }
  },
  escribir(datos) {
    try {
      localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
    } catch {
      // localStorage no disponible: no persiste, la página sigue funcionando.
    }
  },
};

function num(v, decimales = 1) {
  return v.toLocaleString("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function unirConY(lista) {
  if (lista.length === 0) return "";
  const copia = [...lista];
  const ultimo = copia.pop();
  return copia.length ? `${copia.join(", ")} y ${ultimo}` : ultimo;
}

function construirCampos() {
  const contenedor = document.getElementById("campos-nutrientes");
  for (const p of C.PARAMS) {
    const label = document.createElement("label");
    label.textContent = `${p.nombre} (${p.unidad})`;
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.id = `n-${p.k}`;
    label.appendChild(input);
    contenedor.appendChild(label);
  }
}

function leerFormulario() {
  const valores100 = {};
  for (const p of C.PARAMS) {
    const v = parseFloat(document.getElementById(`n-${p.k}`).value);
    valores100[p.k] = C.esNumero(v) ? v : 0;
  }
  const porcionG = parseFloat(document.getElementById("porcion-valor").value);
  return {
    producto: document.getElementById("producto").value,
    porcionTexto: document.getElementById("porcion-texto").value,
    porcionesEnvase: document.getElementById("porciones-envase").value,
    porcionG: C.esNumero(porcionG) ? porcionG : 0,
    edulcorantes: document.getElementById("edulcorantes").checked,
    formato: document.querySelector('input[name="formato"]:checked').value,
    modo: document.querySelector('input[name="modo"]:checked').value,
    valores100,
  };
}

// Valor formateado de un nutriente (Tabla 1/2 aplicadas) como texto "5,0 g".
function valorTexto(p, valorCrudo) {
  const v = C.formatearNutriente(p.k, valorCrudo);
  const decimales = C.decimalesParaNutriente(p.k, valorCrudo);
  return `${num(v, decimales)} ${p.unidad}`;
}

function filasVisibles(omitidos) {
  return C.PARAMS.filter((p) => !omitidos.has(p.k));
}

function pintarVertical(datos, res, omitidos, leyenda) {
  const el = document.getElementById("tabla-nutricional");
  el.className = "etiqueta";

  const e100 = C.formatearEnergia(res.energia100);
  const ePorcion = C.formatearEnergia(res.energiaPorcion);

  const filas = filasVisibles(omitidos)
    .map(
      (p) =>
        `<tr><td>${p.nombre} (${p.unidad})</td><td>${num(C.formatearNutriente(p.k, res.valores100[p.k]), C.decimalesParaNutriente(p.k, res.valores100[p.k]))}</td><td>${num(C.formatearNutriente(p.k, res.valoresPorcion[p.k]), C.decimalesParaNutriente(p.k, res.valoresPorcion[p.k]))}</td></tr>`,
    )
    .join("");

  el.innerHTML = `
    <div class="titulo">Información Nutricional</div>
    <div class="linea-porcion">Tamaño de la porción: ${datos.porcionTexto || "—"}</div>
    <div class="linea-porciones">${datos.porcionesEnvase ? `Porciones por envase: ${datos.porcionesEnvase}` : ""}</div>
    <div class="linea-gruesa"></div>
    <table>
      <thead><tr><th>Nutriente</th><th>Por 100 g/mL</th><th>Por porción</th></tr></thead>
      <tbody>
        <tr class="energia"><td>Energía (kcal)</td><td>${num(e100, C.decimalesParaEnergia(res.energia100))}</td><td>${num(ePorcion, C.decimalesParaEnergia(res.energiaPorcion))}</td></tr>
        ${filas}
      </tbody>
    </table>
    ${leyenda ? `<div class="leyenda-omision">${leyenda}</div>` : ""}
  `;
}

function pintarTabular(datos, res, omitidos, leyenda) {
  const el = document.getElementById("tabla-nutricional");
  el.className = "tabular";

  const e100 = C.formatearEnergia(res.energia100);
  const ePorcion = C.formatearEnergia(res.energiaPorcion);

  const filas = filasVisibles(omitidos)
    .map(
      (p) =>
        `<tr><td>${p.nombre} (${p.unidad})</td><td>${num(C.formatearNutriente(p.k, res.valores100[p.k]), C.decimalesParaNutriente(p.k, res.valores100[p.k]))}</td><td>${num(C.formatearNutriente(p.k, res.valoresPorcion[p.k]), C.decimalesParaNutriente(p.k, res.valoresPorcion[p.k]))}</td></tr>`,
    )
    .join("");

  el.innerHTML = `
    <div class="tab-izq">
      <div class="titulo">Información Nutricional</div>
      <div class="linea-porcion">Tamaño de la porción: ${datos.porcionTexto || "—"}</div>
      <div class="linea-porciones">${datos.porcionesEnvase ? `Porciones por envase: ${datos.porcionesEnvase}` : ""}</div>
    </div>
    <div class="tab-der">
      <table>
        <thead><tr><th>Nutriente</th><th>Por 100 g/mL</th><th>Por porción</th></tr></thead>
        <tbody>
          <tr class="energia"><td>Energía (kcal)</td><td>${num(e100, C.decimalesParaEnergia(res.energia100))}</td><td>${num(ePorcion, C.decimalesParaEnergia(res.energiaPorcion))}</td></tr>
          ${filas}
        </tbody>
      </table>
      ${leyenda ? `<div class="leyenda-omision">${leyenda}</div>` : ""}
    </div>
  `;
}

const NEGRILLA_LINEAL = new Set(["sat", "trans", "na", "aza"]);

function fraseLineal(datos, res, base, omitidos) {
  const esPorcion = base === "porcion";
  const valores = esPorcion ? res.valoresPorcion : res.valores100;
  const energia = esPorcion ? res.energiaPorcion : res.energia100;
  const eTxt = num(
    C.formatearEnergia(energia),
    C.decimalesParaEnergia(energia),
  );

  const partes = [`<strong>Calorías</strong> ${eTxt}`];
  for (const p of filasVisibles(omitidos)) {
    const txt = `${p.nombre} ${valorTexto(p, valores[p.k])}`;
    partes.push(NEGRILLA_LINEAL.has(p.k) ? `<strong>${txt}</strong>` : txt);
  }
  return unirConY(partes);
}

function pintarLineal(datos, res, omitidos, leyenda) {
  const el = document.getElementById("tabla-nutricional");
  el.className = "lineal";

  const infoPorcion = [
    datos.porcionTexto ? `Tamaño de porción: ${datos.porcionTexto}.` : "",
    datos.porcionesEnvase
      ? `Número de porciones por envase: ${datos.porcionesEnvase}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  el.innerHTML = `
    <p><strong>Información nutricional (100 g o 100 mL):</strong> ${fraseLineal(datos, res, "cien", omitidos)}.</p>
    <p><strong>Información nutricional (porción):</strong> ${infoPorcion} ${fraseLineal(datos, res, "porcion", omitidos)}.${leyenda ? ` ${leyenda}` : ""}</p>
  `;
}

const NOMBRE_SELLO = {
  sodio: "SODIO",
  azucares: "AZÚCARES",
  grasaSaturada: "GRASAS SATURADAS",
  grasaTrans: "GRASAS TRANS",
};

function octagono(texto) {
  return `
    <div class="sello">
      <div class="sello-borde">
        <div class="sello-interior">
          <div class="sello-texto">${texto}</div>
          <div class="sello-minsalud">MINSALUD</div>
        </div>
      </div>
    </div>
  `;
}

function pintarSellos(sellos) {
  const octagonos = document.getElementById("sellos-octagonos");
  const piezas = [];
  if (sellos.sodio.activo) piezas.push(octagono("EXCESO EN<br>SODIO"));
  if (sellos.azucares.activo) piezas.push(octagono("EXCESO EN<br>AZÚCARES"));
  if (sellos.grasaSaturada.activo)
    piezas.push(octagono("EXCESO EN<br>GRASAS SATURADAS"));
  if (sellos.grasaTrans.activo)
    piezas.push(octagono("EXCESO EN<br>GRASAS TRANS"));
  if (sellos.edulcorantes.activo)
    piezas.push(octagono("CONTIENE<br>EDULCORANTES"));
  octagonos.innerHTML = piezas.length
    ? piezas.join("")
    : '<p class="sin-sellos">Sin sellos de advertencia con estos valores.</p>';

  const detalle = document.getElementById("sellos-detalle");
  detalle.innerHTML = `
    <p>Sodio: ${num(sellos.sodio.ratioSodio, 2)} mg/kcal · ${num(sellos.sodio.na, 0)} mg/100g (umbral: ≥1 mg/kcal o ≥300 mg)</p>
    <p>Azúcares: ${num(sellos.azucares.pctAnadidos, 1)} % (añadidos) · ${num(sellos.azucares.pctTotales, 1)} % (totales) — libres real está entre ambos (umbral: ≥10 %)</p>
    <p>Grasa saturada: ${num(sellos.grasaSaturada.pct, 1)} % de la energía (umbral: ≥10 %)</p>
    <p>Grasa trans: ${num(sellos.grasaTrans.pct, 1)} % de la energía (umbral: ≥1 %)</p>
    <p>Edulcorantes: ${sellos.edulcorantes.activo ? "declarados" : "no declarados"}</p>
  `;
}

function recalcular() {
  const datos = leerFormulario();
  guardado.escribir(datos);

  const res = C.calcular(datos.valores100, datos.porcionG);
  const omitidos = C.nutrientesAOmitir(datos.valores100, datos.modo);
  const leyenda = C.textoLeyendaOmision(omitidos);

  if (datos.formato === "tabular") pintarTabular(datos, res, omitidos, leyenda);
  else if (datos.formato === "lineal")
    pintarLineal(datos, res, omitidos, leyenda);
  else pintarVertical(datos, res, omitidos, leyenda);

  const sellos = C.calcularSellos(
    datos.valores100,
    res.energia100,
    datos.edulcorantes,
  );
  pintarSellos(sellos);
}

function restaurar() {
  const datos = guardado.leer();
  if (datos.producto)
    document.getElementById("producto").value = datos.producto;
  if (datos.porcionTexto)
    document.getElementById("porcion-texto").value = datos.porcionTexto;
  if (datos.porcionesEnvase)
    document.getElementById("porciones-envase").value = datos.porcionesEnvase;
  if (C.esNumero(datos.porcionG))
    document.getElementById("porcion-valor").value = datos.porcionG;
  if (datos.edulcorantes)
    document.getElementById("edulcorantes").checked = true;
  if (datos.formato) {
    const input = document.querySelector(
      `input[name="formato"][value="${datos.formato}"]`,
    );
    if (input) input.checked = true;
  }
  if (datos.modo) {
    const input = document.querySelector(
      `input[name="modo"][value="${datos.modo}"]`,
    );
    if (input) input.checked = true;
  }
  if (datos.valores100) {
    for (const p of C.PARAMS) {
      const v = datos.valores100[p.k];
      if (C.esNumero(v)) document.getElementById(`n-${p.k}`).value = v;
    }
  }
}

function descargarPng(idElemento, nombreArchivo) {
  const el = document.getElementById(idElemento);
  html2canvas(el, { backgroundColor: "#ffffff", scale: 3 }).then((canvas) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}

construirCampos();
restaurar();
recalcular();
document
  .getElementById("form-nutrientes")
  .addEventListener("input", recalcular);
document
  .getElementById("btn-descargar")
  .addEventListener("click", () =>
    descargarPng("tabla-nutricional", "tabla-nutricional.png"),
  );
document
  .getElementById("btn-descargar-sellos")
  .addEventListener("click", () =>
    descargarPng("sellos-panel", "sellos-advertencia.png"),
  );
