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
    valores100,
  };
}

function pintarTabla(datos) {
  const res = C.calcular(datos.valores100, datos.porcionG);

  document.getElementById("et-porcion").textContent =
    `Tamaño de la porción: ${datos.porcionTexto || "—"}`;
  document.getElementById("et-porciones-envase").textContent =
    datos.porcionesEnvase
      ? `Porciones por envase: ${datos.porcionesEnvase}`
      : "";

  const filas = document.getElementById("et-filas");
  filas.innerHTML = "";

  const filaEnergia = document.createElement("tr");
  filaEnergia.className = "energia";
  const e100 = C.formatearEnergia(res.energia100);
  const ePorcion = C.formatearEnergia(res.energiaPorcion);
  filaEnergia.innerHTML = `<td>Energía (kcal)</td><td>${num(e100, C.decimalesParaEnergia(res.energia100))}</td><td>${num(ePorcion, C.decimalesParaEnergia(res.energiaPorcion))}</td>`;
  filas.appendChild(filaEnergia);

  for (const p of C.PARAMS) {
    const v100 = C.formatearNutriente(p.k, res.valores100[p.k]);
    const vPorcion = C.formatearNutriente(p.k, res.valoresPorcion[p.k]);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.nombre} (${p.unidad})</td><td>${num(v100, C.decimalesParaNutriente(p.k, res.valores100[p.k]))}</td><td>${num(vPorcion, C.decimalesParaNutriente(p.k, res.valoresPorcion[p.k]))}</td>`;
    filas.appendChild(tr);
  }
}

function recalcular() {
  const datos = leerFormulario();
  guardado.escribir(datos);
  pintarTabla(datos);
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
  if (datos.valores100) {
    for (const p of C.PARAMS) {
      const v = datos.valores100[p.k];
      if (C.esNumero(v)) document.getElementById(`n-${p.k}`).value = v;
    }
  }
}

function descargarImagen() {
  const el = document.getElementById("tabla-nutricional");
  html2canvas(el, { backgroundColor: "#ffffff", scale: 3 }).then((canvas) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tabla-nutricional.png";
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
  .addEventListener("click", descargarImagen);
