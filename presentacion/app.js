const textoDatos = document.getElementById("data").textContent;
const datos = JSON.parse(textoDatos);
const opciones = datos.options;

function buscarElemento(identificador) {
  return document.getElementById(identificador);
}

const formatoEntero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const formatoDecimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatoR2 = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

function formatearEntero(valor) {
  return formatoEntero.format(valor);
}

function formatearDecimal(valor) {
  return formatoDecimal.format(valor);
}

function dolares(valor) {
  return "USD " + formatearEntero(valor);
}

function dolaresConCentavos(valor) {
  return "USD " + formatearDecimal(valor);
}

function dolaresConSigno(valor) {
  let signo = "+";
  if (valor < 0) {
    signo = "−";
  }
  return signo + dolares(Math.abs(valor));
}

function escaparTexto(valor) {
  // Escapamos el texto que se incluye en una etiqueta de HTML
  let texto = String(valor);
  texto = texto.replaceAll("&", "&amp;");
  texto = texto.replaceAll("<", "&lt;");
  texto = texto.replaceAll(">", "&gt;");
  texto = texto.replaceAll('"', "&quot;");
  texto = texto.replaceAll("'", "&#39;");
  return texto;
}

function porcentaje(valor) {
  return formatearDecimal(valor * 100) + " %";
}

function nombreDelPeso(peso) {
  if (peso === "distance") {
    return "por distancia";
  }
  if (peso === "uniform") {
    return "uniforme";
  }
}

function cargarOpciones(elemento, entradas) {
  elemento.replaceChildren();
  for (const [valor, etiqueta] of entradas) {
    elemento.append(new Option(etiqueta, valor));
  }
}

function armarTabla(etiquetas, filas) {
  const descripcion = escaparTexto(etiquetas.join(", "));
  let tabla = '<div class="table-wrap" tabindex="0" role="region" aria-label="Tabla: ';
  tabla += descripcion + '. Desplazamiento horizontal disponible.">';
  tabla += "<table><thead><tr>";
  for (const etiqueta of etiquetas) {
    tabla += '<th scope="col">' + escaparTexto(etiqueta) + "</th>";
  }
  tabla += "</tr></thead><tbody>";
  for (const fila of filas) {
    tabla += "<tr>";
    for (const valor of fila) {
      tabla += "<td>" + escaparTexto(valor) + "</td>";
    }
    tabla += "</tr>";
  }
  tabla += "</tbody></table></div>";
  return tabla;
}

function armarResumen(entradas) {
  let resumen = "";
  for (const [valor, etiqueta] of entradas) {
    resumen += "<div><dt>" + escaparTexto(valor) + "</dt>";
    resumen += "<dd>" + escaparTexto(etiqueta) + "</dd></div>";
  }
  return resumen;
}

const avisosAuditados = datos.auditExamples;
const contarRegla = (inicio) => datos.audit.find((fila) => fila.motivo.startsWith(inicio)).cantidad;
const idsRepetidos = contarRegla("ID de publicación repetido");
buscarElemento("duplicate-count").textContent =
  formatearEntero(idsRepetidos) + (idsRepetidos === 1 ? " fila repetida" : " filas repetidas");
buscarElemento("funnel").innerHTML = armarResumen([
  [formatearEntero(datos.raw.rows), "avisos originales · " + datos.raw.cols + " columnas"],
  [formatearEntero(datos.selected), "usados publicados en USD"],
  [formatearEntero(datos.clean), "avisos después de la limpieza"],
]);
buscarElemento("audit-summary").innerHTML = [
  "<p><strong>ID repetido.</strong> " +
    escaparTexto(avisosAuditados[0].id) +
    " figura como Ford Ka en el modelo y Focus III en el título. Conservamos la primera aparición.</p>",
  "<p><strong>Año imposible.</strong> Un Chevrolet Corsa figura con año " +
    escaparTexto(avisosAuditados[1].car_year) +
    ". Quitamos el aviso.</p>",
  "<p><strong>Anticipo.</strong> Excluimos el Fiat Uno cuyo título identifica " +
    dolares(avisosAuditados[2].price) +
    " como anticipo. Conservamos los otros " +
    formatearEntero(contarRegla("Títulos que ofrecen")) +
    " avisos que ofrecen financiación.</p>",
].join("");
buscarElemento("audit-table").innerHTML =
  armarTabla(
    ["Acción", "Regla", "Cantidad"],
    datos.audit.map((fila) => [fila.accion, fila.motivo, formatearEntero(fila.cantidad)]),
  ) +
  armarTabla(
    ["ID de publicación", "Título original"],
    avisosAuditados.map((fila) => [fila.id, fila.title]),
  );
function mostrarTransformacion() {
  const pasos = {
    engine: [
      ["Texto original", "1.6 110CV"],
      ["Cilindrada", "1,6 L"],
      ["Dato numérico", "1,6"],
    ],
    km: [
      ["Texto original", "119000 km"],
      ["Unidad", "km"],
      ["Dato numérico", "119.000"],
    ],
    doors: [
      ["Texto original", formatearEntero(avisosAuditados[1].doors)],
      ["Control", "Fuera de 2 a 6"],
      ["Resultado", "Faltante"],
    ],
  }[buscarElemento("transform-choice").value];
  buscarElemento("transform-demo").innerHTML = pasos
    .map(
      ([etiqueta, valor], posicion) =>
        '<div class="animate" style="animation-delay:' +
        posicion * 65 +
        'ms"><span class="note">' +
        escaparTexto(etiqueta) +
        "</span><b>" +
        escaparTexto(valor) +
        "</b></div>",
    )
    .join("");
}
buscarElemento("transform-choice").addEventListener("change", mostrarTransformacion);
mostrarTransformacion();
const precios = datos.price;
buscarElemento("price-copy").textContent =
  "La mitad central va de " +
  dolares(precios.q1) +
  " a " +
  dolares(precios.q3) +
  ". Los precios altos alargan la cola y elevan la media.";
buscarElemento("price-stats").innerHTML = armarResumen([
  [dolares(precios.median), "Mediana"],
  [dolares(precios.mean), "Media"],
  [dolares(precios.max), "Máximo observado"],
]);
const formatoEscala = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

function abreviarEscala(valor) {
  if (Math.abs(valor) >= 1000000) {
    return formatoEscala.format(valor / 1000000) + " M";
  }
  if (Math.abs(valor) >= 1000) {
    return formatoEscala.format(valor / 1000) + " mil";
  }
  return formatearEntero(valor);
}

function marcasDeEscala(inicio, fin, cantidad) {
  const marcas = [];
  for (let posicion = 0; posicion < cantidad; posicion++) {
    const valor = inicio + ((fin - inicio) * posicion) / (cantidad - 1);
    marcas.push(valor);
  }
  return marcas;
}

function dibujarGrafico(elemento, configuracion) {
  const ancho = elemento.clientWidth;
  const alto = ancho < 440 ? 304 : 330;
  const izquierda = 57;
  const derecha = ancho - 30;
  const arriba = 22;
  const abajo = alto - 54;
  const [minimoX, maximoX] = configuracion.limitesX;
  const [minimoY, maximoY] = configuracion.limitesY;

  // Convertimos las unidades del dato a posiciones del dibujo
  function ubicarX(valor) {
    const proporcion = (valor - minimoX) / (maximoX - minimoX);
    return izquierda + proporcion * (derecha - izquierda);
  }

  function ubicarY(valor) {
    const proporcion = (valor - minimoY) / (maximoY - minimoY);
    return abajo - proporcion * (abajo - arriba);
  }

  function dibujarPunto(datoX, datoY, radio, clase) {
    const centroX = ubicarX(datoX).toFixed(2);
    const centroY = ubicarY(datoY).toFixed(2);
    return (
      '<circle class="' + clase + '" cx="' + centroX + '" cy="' + centroY + '" r="' + radio + '"/>'
    );
  }

  function dibujarLinea(inicioX, inicioY, finX, finY, clase) {
    return (
      '<line class="' +
      clase +
      '" x1="' +
      inicioX +
      '" y1="' +
      inicioY +
      '" x2="' +
      finX +
      '" y2="' +
      finY +
      '"/>'
    );
  }

  function dibujarEtiqueta(valor, posicionX, posicionY, alineacion, clase = "tick") {
    return (
      '<text class="' +
      clase +
      '" x="' +
      posicionX +
      '" y="' +
      posicionY +
      '" text-anchor="' +
      alineacion +
      '">' +
      escaparTexto(valor) +
      "</text>"
    );
  }

  let marcasX = configuracion.marcasX ?? marcasDeEscala(minimoX, maximoX, 5);
  if (ancho < 360 && marcasX.length > 4) {
    const posicionCentral = Math.floor(marcasX.length / 2);
    marcasX = [marcasX[0], marcasX[posicionCentral], marcasX.at(-1)];
  }

  const marcasY = configuracion.marcasY ?? marcasDeEscala(minimoY, maximoY, 5);
  const formatearMarcaX = configuracion.formatearX ?? abreviarEscala;
  let escalaX = "";
  for (const valor of marcasX) {
    escalaX += dibujarEtiqueta(formatearMarcaX(valor), ubicarX(valor), abajo + 19, "middle");
  }
  let escalaY = "";
  for (const valor of marcasY) {
    const posicion = ubicarY(valor);
    escalaY += dibujarLinea(izquierda, posicion, derecha, posicion, "gridline");
    escalaY += dibujarEtiqueta(abreviarEscala(valor), izquierda - 8, posicion + 4, "end");
  }

  let figuras = "";
  if (configuracion.barras) {
    for (const [inicio, fin, cantidad] of configuracion.barras) {
      const posicionX = ubicarX(inicio) + 1;
      const posicionY = ubicarY(cantidad);
      const anchoBarra = ubicarX(fin) - ubicarX(inicio) - 2;
      const altoBarra = abajo - posicionY;
      const titulo =
        dolares(inicio) + " a " + dolares(fin) + " · " + formatearEntero(cantidad) + " avisos";
      figuras +=
        '<rect class="hist-bar" x="' +
        posicionX +
        '" y="' +
        posicionY +
        '" width="' +
        anchoBarra +
        '" height="' +
        altoBarra +
        '"><title>' +
        titulo +
        "</title></rect>";
    }
  }

  if (configuracion.puntos) {
    if (configuracion.diagonal) {
      figuras += dibujarLinea(
        ubicarX(0),
        ubicarY(0),
        ubicarX(maximoX),
        ubicarY(maximoY),
        "axis reference",
      );
    }
    const radio = ancho < 440 ? 1.6 : 2;
    for (const [datoX, datoY] of configuracion.puntos) {
      figuras += dibujarPunto(datoX, datoY, radio, "data-point");
    }
    if (configuracion.destacado) {
      const publicado = configuracion.destacado.price;
      const estimado = configuracion.destacado.precio_estimado;
      const posicionX = ubicarX(publicado);
      figuras += dibujarLinea(posicionX, ubicarY(publicado), posicionX, ubicarY(estimado), "axis");
      figuras += dibujarPunto(publicado, estimado, 5, "highlight animate");
    }
  }

  let dibujo =
    '<svg viewBox="0 0 ' +
    ancho +
    " " +
    alto +
    '" role="img" aria-label="' +
    escaparTexto(configuracion.nombre) +
    '">';
  dibujo += escalaY + figuras;
  dibujo += dibujarLinea(izquierda, abajo, derecha, abajo, "axis") + escalaX;
  dibujo += dibujarEtiqueta(
    configuracion.tituloX,
    (izquierda + derecha) / 2,
    alto - 8,
    "middle",
    "axis-title",
  );
  dibujo += dibujarEtiqueta(configuracion.tituloY, izquierda, 13, "start", "axis-title");
  elemento.innerHTML = dibujo + "</svg>";
}

const barrasHistograma = [];
for (let posicion = 0; posicion < precios.histogram.length; posicion++) {
  const inicio = precios.edges[posicion];
  const fin = precios.edges[posicion + 1];
  const cantidad = precios.histogram[posicion];
  barrasHistograma.push([inicio, fin, cantidad]);
}

function mostrarHistograma() {
  const arriba = Math.ceil(Math.max(...precios.histogram) / 500) * 500;
  dibujarGrafico(buscarElemento("histogram"), {
    limitesX: [0, precios.edges.at(-1)],
    limitesY: [0, arriba],
    barras: barrasHistograma,
    nombre: "Histograma de precios en USD",
    tituloX: "Precio publicado (USD)",
    tituloY: "Avisos",
    marcasX: [0, 20000, 40000, 60000, 80000],
    marcasY: marcasDeEscala(0, arriba, 5),
  });
}
function mostrarRelacion() {
  const campo = buscarElemento("relation-choice").value;
  const { points: puntos, r: correlacion } = datos.relations[campo];
  const ajustes = {
    car_year: {
      limitesX: [1989, 2025],
      marcasX: [1990, 2000, 2010, 2024],
      formatearX: String,
      tituloX: "Año de fabricación",
    },
    km: {
      limitesX: [0, 1020000],
      marcasX: [0, 250000, 500000, 750000, 1000000],
      tituloX: "Kilometraje (km)",
    },
    power_hp: {
      limitesX: [0, 280],
      marcasX: [0, 70, 140, 210, 280],
      tituloX: "Potencia (hp)",
    },
  }[campo];
  const grafico = buscarElemento("relation-chart");
  if (campo === "km" && grafico.clientWidth < 430) ajustes.marcasX = [0, 250000, 500000, 1000000];
  dibujarGrafico(grafico, {
    ...ajustes,
    limitesY: [0, 85000],
    marcasY: [0, 20000, 40000, 60000, 80000],
    puntos,
    nombre: "Dispersión de precio según " + ajustes.tituloX.toLowerCase(),
    tituloY: "Precio publicado (USD)",
  });
  buscarElemento("relation-copy").textContent =
    "r de Pearson = " +
    formatearDecimal(correlacion) +
    " · " +
    formatearEntero(puntos.length) +
    " avisos.";
}
buscarElemento("relation-choice").addEventListener("change", mostrarRelacion);
const particion = datos.partition;
const ganador = datos.metrics.find((fila) => fila.elegido_por_CV);
const referencia = datos.metrics.find((fila) => fila.modelo === "Baseline mediana");
const modeloVecinos = datos.knn ?? datos.model;
buscarElemento("selection-copy").textContent =
  ganador.modelo +
  (datos.model.kind === "knn"
    ? " con " +
      formatearEntero(modeloVecinos.k) +
      " vecinos y peso " +
      nombreDelPeso(modeloVecinos.weights)
    : "") +
  " obtuvo el menor MAE de validación, " +
  dolaresConCentavos(ganador.MAE_CV) +
  ".";
buscarElemento("cv-table").innerHTML = armarTabla(
  ["Modelo", "Vecinos", "Pesos", "MAE de validación"],
  datos.cv.map((fila) => [
    fila.modelo,
    fila.vecinos ?? "·",
    nombreDelPeso(fila.pesos) ?? "·",
    dolaresConCentavos(fila.MAE_CV),
  ]),
);
buscarElemento("partition-copy").textContent =
  formatearEntero(particion.grupos_train) +
  " grupos de entrenamiento y " +
  formatearEntero(particion.grupos_test) +
  " de prueba. Grupos compartidos: " +
  formatearEntero(particion.grupos_compartidos) +
  ". Semilla " +
  particion.semilla +
  ".";
function barraParticion(cantidades, etiquetas) {
  return (
    '<div class="partition-track animate" aria-hidden="true">' +
    cantidades.map((cantidad) => '<span style="flex:' + cantidad + '"></span>').join("") +
    '</div><div class="partition-legend">' +
    cantidades
      .map(
        (cantidad, posicion) =>
          "<span><b>" +
          formatearEntero(cantidad) +
          "</b> " +
          escaparTexto(etiquetas[posicion]) +
          "</span>",
      )
      .join("") +
    "</div>"
  );
}
buscarElemento("holdout").innerHTML = barraParticion(
  [particion.train, particion.test],
  ["entrenamiento", "prueba"],
);
cargarOpciones(
  buscarElemento("fold-choice"),
  particion.folds.map((fila) => [fila.fold, "Fold " + fila.fold + " de " + particion.folds.length]),
);
function mostrarRonda() {
  const rondaElegida = Number(buscarElemento("fold-choice").value);
  const ronda = particion.folds[rondaElegida - 1];
  const bloques = particion.folds
    .map(
      (fila) =>
        '<span class="' +
        (fila.fold === rondaElegida ? "current animate" : "") +
        '" style="flex:' +
        fila.validacion +
        '">' +
        fila.fold +
        "</span>",
    )
    .join("");
  buscarElemento("fold-demo").innerHTML =
    '<div class="fold-track" aria-hidden="true">' +
    bloques +
    '</div><div class="partition-legend"><span><b>' +
    formatearEntero(ronda.ajuste) +
    "</b> ajuste</span><span><b>" +
    formatearEntero(ronda.validacion) +
    "</b> validación (bloque " +
    rondaElegida +
    ")</span></div>" +
    '<p class="note">' +
    ronda.grupos_compartidos +
    " grupos compartidos en este fold.</p>";
}
buscarElemento("fold-choice").addEventListener("change", mostrarRonda);
mostrarRonda();
const nombreVehiculo = (fila) => fila.brand + " " + fila.model + " " + fila.car_year;
const columnasVecinos = ["Vehículo", "Distancia", "Peso", "Precio (USD)", "Aporte (USD)"];
function filaVecino(fila) {
  const auto = datos.neighbors[fila.index];
  return [
    nombreVehiculo(auto) + " · " + formatearEntero(auto.km) + " km",
    formatearDecimal(fila.distance),
    porcentaje(fila.weight),
    formatearEntero(fila.price),
    formatearEntero(fila.contribution),
  ];
}
const vehiculoEjemplo = (
  datos.examples.find(({ vehiculo }) => opcionalesVacios(vehiculo).length) ?? datos.examples[0]
).vehiculo;
const ejemploVecinos = predecir(vehiculoEjemplo, modeloVecinos);
buscarElemento("neighbor-intro").textContent =
  nombreVehiculo(vehiculoEjemplo) +
  " · " +
  formatearEntero(vehiculoEjemplo.km) +
  " km. Usamos una ficha de entrenamiento con especificaciones opcionales faltantes para ver la búsqueda." +
  (datos.model.kind === "knn" ? "" : " Esta animación corresponde al modelo de comparación.");
buscarElemento("neighbor-weight-rule").textContent =
  modeloVecinos.weights === "distance"
    ? "El peso parte de 1 ÷ distancia y se normaliza para que los pesos sumen 100 %. Si hay coincidencias exactas, solo ellas reciben peso."
    : "Con pesos uniformes, todos los vecinos aportan la misma proporción de su precio.";
let vecinosVisibles = 0;
function mostrarVecinos() {
  const vecinosMostrados = ejemploVecinos.neighbors.slice(0, vecinosVisibles);
  buscarElemento("neighbor-demo").innerHTML = armarTabla(
    columnasVecinos,
    vecinosMostrados.map(filaVecino),
  );
  buscarElemento("neighbor-demo").querySelector("tbody tr:last-child")?.classList.add("animate");
  const aporteAcumulado = vecinosMostrados.reduce((suma, fila) => suma + fila.contribution, 0);
  buscarElemento("neighbor-status").textContent =
    vecinosVisibles === modeloVecinos.k
      ? "Estimación de k-NN: " + dolares(ejemploVecinos.price)
      : vecinosVisibles +
        " de " +
        modeloVecinos.k +
        " vecinos visibles" +
        (vecinosVisibles ? " · aporte acumulado " + dolares(aporteAcumulado) : ".");
  buscarElemento("reveal-neighbor").disabled = vecinosVisibles === modeloVecinos.k;
  buscarElemento("reset-neighbors").disabled = vecinosVisibles === 0;
}
buscarElemento("reveal-neighbor").addEventListener("click", () => {
  vecinosVisibles++;
  mostrarVecinos();
});
buscarElemento("reset-neighbors").addEventListener("click", () => {
  vecinosVisibles = 0;
  mostrarVecinos();
});
mostrarVecinos();
function mostrarMetrica() {
  const campo = buscarElemento("metric-choice").value;
  const explicaciones = {
    MAE_test: "El MAE mide cuánto se desvía, en promedio, la estimación del precio publicado.",
    RMSE_test: "El RMSE da más peso a las diferencias grandes y se expresa en USD.",
    R2_test:
      "R² compara el error cuadrático con el de usar la media observada de prueba: 1 sería ajuste perfecto, 0 equivale a esa referencia y puede ser negativo. No es un porcentaje de aciertos.",
  };
  buscarElemento("metric-copy").textContent = explicaciones[campo];
  const valores = datos.metrics.map((fila) => fila[campo]);
  const minimo = Math.min(0, ...valores);
  const maximo = Math.max(0, ...valores);
  const ubicarBarra = (valor) => ((valor - minimo) / (maximo - minimo)) * 100;
  const posicionCero = ubicarBarra(0);
  buscarElemento("metric-chart").innerHTML = datos.metrics
    .map((fila) => {
      const posicionBarra = ubicarBarra(fila[campo]);
      const etiqueta = campo === "R2_test" ? formatoR2.format(fila[campo]) : dolares(fila[campo]);
      return (
        '<div class="bar-row animate"><div class="bar-label"><span>' +
        escaparTexto(fila.modelo) +
        (fila.elegido_por_CV ? " · elegido" : "") +
        '</span><span class="number">' +
        etiqueta +
        '</span></div><div class="bar-track" aria-hidden="true"><i class="' +
        (fila.elegido_por_CV ? "" : "secondary-bar") +
        '" style="left:' +
        Math.min(posicionBarra, posicionCero) +
        "%;width:" +
        Math.abs(posicionBarra - posicionCero) +
        '%"></i><span class="zero" style="left:' +
        posicionCero +
        '%"></span></div></div>'
      );
    })
    .join("");
}
buscarElemento("metric-choice").addEventListener("change", mostrarMetrica);
buscarElemento("metric-table").innerHTML = armarTabla(
  ["Modelo", "MAE CV", "MAE prueba", "RMSE prueba", "R²"],
  datos.metrics.map((fila) => [
    fila.modelo,
    dolaresConCentavos(fila.MAE_CV),
    dolaresConCentavos(fila.MAE_test),
    dolaresConCentavos(fila.RMSE_test),
    formatoR2.format(fila.R2_test),
  ]),
);
mostrarMetrica();
cargarOpciones(
  buscarElemento("case-choice"),
  datos.cases.map((fila, posicion) => [
    posicion,
    nombreVehiculo(fila) + (posicion === 0 ? " · error típico" : " · error alto"),
  ]),
);
function mostrarCaso() {
  const fila = datos.cases[Number(buscarElemento("case-choice").value)];
  buscarElemento("case-copy").innerHTML =
    "<strong>" +
    escaparTexto(fila.id) +
    "</strong><br>Publicado " +
    dolares(fila.price) +
    "<br>Estimado " +
    dolares(fila.precio_estimado) +
    "<br>Diferencia " +
    dolaresConSigno(fila.error);
  dibujarGrafico(buscarElemento("error-chart"), {
    limitesX: [0, 85000],
    limitesY: [0, 85000],
    marcasX: [0, 20000, 40000, 60000, 80000],
    marcasY: [0, 20000, 40000, 60000, 80000],
    puntos: datos.testPoints,
    diagonal: true,
    destacado: fila,
    nombre: "Precios estimados frente a los publicados, con el aviso elegido resaltado",
    tituloX: "Precio publicado (USD)",
    tituloY: "Precio estimado (USD)",
  });
}
buscarElemento("case-choice").addEventListener("change", mostrarCaso);
function mostrarSegmentos() {
  const campo = buscarElemento("segment-choice").value;
  const [minimo, maximo] = particion.cortes_precio_USD;
  const explicaciones = {
    nivel_precio: "Terciles de entrenamiento en " + dolares(minimo) + " y " + dolares(maximo) + ".",
    antiguedad: "Antigüedad medida con referencia a 2024.",
    brand: "Cada fila reúne los avisos de la marca que quedaron en prueba.",
  };
  buscarElemento("segment-copy").textContent =
    explicaciones[campo] + " El sesgo es la diferencia promedio entre estimado y publicado.";
  buscarElemento("segment-table").innerHTML = armarTabla(
    ["Segmento", "Avisos", "MAE", "Sesgo"],
    datos.errors
      .filter((fila) => fila.variable === campo)
      .map((fila) => [
        fila.segmento,
        formatearEntero(fila.n),
        dolares(fila.MAE),
        dolaresConSigno(fila.sesgo),
      ]),
  );
}
buscarElemento("segment-choice").addEventListener("change", mostrarSegmentos);
mostrarSegmentos();
const camposFicha = [
  "brand",
  "model",
  "car_year",
  "km",
  "fuel_type",
  "transmission",
  "engine_l",
  "power_hp",
  "doors",
  "passenger_capacity",
  "traction_control",
];
function opcionalesVacios(vehiculo) {
  const faltantes = [];
  for (const campo of Object.keys(opciones.etiquetas)) {
    if (!opciones.obligatorios.includes(campo) && vehiculo[campo] == null) {
      faltantes.push(campo);
    }
  }
  return faltantes;
}

function armarCampo(campo) {
  const obligatorio = opciones.obligatorios.includes(campo);
  let atributos =
    ' id="' +
    campo +
    '" name="' +
    campo +
    '" aria-describedby="hint-' +
    campo +
    " error-" +
    campo +
    '"';
  if (obligatorio) {
    atributos += " required";
  }
  const rango = opciones.rangos[campo];
  let ayuda = "";
  let control = "<select" + atributos + "></select>";

  if (rango) {
    let minimo = formatoEscala.format(rango[0]);
    let maximo = formatearEntero(rango[1]);
    if (campo === "car_year") {
      minimo = String(rango[0]);
      maximo = String(rango[1]);
    }
    ayuda = minimo + " a " + maximo;
    let paso = "any";
    let teclado = "decimal";
    if (opciones.enteros.includes(campo)) {
      paso = "1";
      teclado = "numeric";
      ayuda += ". Entero, sin separadores de miles.";
    } else {
      ayuda += ". Solo el número, sin unidades.";
    }
    control =
      '<input type="number" min="' +
      rango[0] +
      '" max="' +
      rango[1] +
      '" step="' +
      paso +
      '" inputmode="' +
      teclado +
      '"' +
      atributos +
      ">";
  } else if (campo === "model") {
    ayuda = "Opciones de la marca elegida en entrenamiento.";
  } else if (!obligatorio) {
    ayuda = "Sin dato: se completa con la moda de entrenamiento.";
  }

  const etiqueta = escaparTexto(opciones.etiquetas[campo]);
  return (
    '<div><label for="' +
    campo +
    '">' +
    etiqueta +
    "</label>" +
    control +
    '<span class="field-hint" id="hint-' +
    campo +
    '">' +
    escaparTexto(ayuda) +
    "</span>" +
    '<span class="field-error" id="error-' +
    campo +
    '"></span></div>'
  );
}

let camposObligatorios = "";
let camposOpcionales = "";
for (const campo of camposFicha) {
  if (opciones.obligatorios.includes(campo)) {
    camposObligatorios += armarCampo(campo);
  } else {
    camposOpcionales += armarCampo(campo);
  }
}
buscarElemento("required-fields").innerHTML = camposObligatorios;
buscarElemento("optional-fields").innerHTML = camposOpcionales;

buscarElemento("form-scope").textContent =
  "Catálogo del entrenamiento: años " +
  opciones.rangos.car_year.join("–") +
  ", hasta " +
  formatearEntero(opciones.rangos.km[1]) +
  " km. Son límites de entrada, no garantía de que cada combinación esté bien representada.";
function cargarOpcionesCampo(campo, valores, opcionVacia) {
  cargarOpciones(buscarElemento(campo), [
    ["", opcionVacia],
    ...valores.map((valor) => [valor, valor]),
  ]);
}
let marcaElegida;
function cargarModelos() {
  const marca = buscarElemento("brand").value;
  cargarOpcionesCampo(
    "model",
    opciones.modelos[marca] ?? [],
    marca ? "Elegí el modelo" : "Elegí primero la marca",
  );
  buscarElemento("model").disabled = !marca;
  marcaElegida = marca;
}
cargarOpcionesCampo("brand", Object.keys(opciones.modelos), "Elegí la marca");
for (const [campo, valores] of Object.entries(opciones.categorias)) {
  cargarOpcionesCampo(
    campo,
    valores,
    opciones.obligatorios.includes(campo) ? "Elegí una opción" : "Sin dato",
  );
}
cargarOpciones(buscarElemento("example-choice"), [
  ["", "Completar una ficha"],
  ...datos.examples.map(({ vehiculo }, posicion) => [
    posicion,
    nombreVehiculo(vehiculo) +
      (opcionalesVacios(vehiculo).length ? " · sin opcionales" : " · completa"),
  ]),
]);
cargarModelos();
function mostrarErrorCampo(campo, mensaje = "") {
  buscarElemento("error-" + campo).textContent = mensaje;
  const control = buscarElemento(campo);
  if (mensaje) {
    control.setAttribute("aria-invalid", "true");
  } else {
    control.removeAttribute("aria-invalid");
  }
}

let hayEstimacion = false;
let fichaCambio = false;

function borrarEstimacion(cambio = false) {
  buscarElemento("estimate").textContent = "USD ·";
  fichaCambio = cambio && (hayEstimacion || fichaCambio);
  let mensaje = "Completá la ficha y pulsá «Estimar precio».";
  if (fichaCambio) {
    mensaje = "La ficha cambió. Pulsá «Estimar precio» para actualizar.";
  }
  buscarElemento("estimate-caption").textContent = mensaje;
  const detalle = buscarElemento("estimate-explanation");
  detalle.hidden = true;
  detalle.open = false;
  buscarElemento("explanation").replaceChildren();
  hayEstimacion = false;
}

function leerFicha() {
  const valores = {};
  for (const campo of camposFicha) {
    valores[campo] = buscarElemento(campo).value;
  }
  return valores;
}

function validarFormulario() {
  const resultado = validarVehiculo(leerFicha(), opciones);
  for (const campo of camposFicha) {
    if (buscarElemento(campo).validity.badInput)
      resultado.errors[campo] = opciones.etiquetas[campo] + " debe ser un número.";
  }
  return resultado;
}
function limpiarFormulario() {
  buscarElemento("form-status").textContent = "";
  camposFicha.forEach((campo) => mostrarErrorCampo(campo));
  borrarEstimacion();
}
function alCambiarFicha(evento) {
  const campo = evento.target.id;
  if (!camposFicha.includes(campo)) return;
  if (campo === "brand" && buscarElemento("brand").value !== marcaElegida) {
    cargarModelos();
    mostrarErrorCampo("model");
  }
  buscarElemento("example-choice").value = "";
  buscarElemento("form-status").textContent = "";
  mostrarErrorCampo(campo);
  borrarEstimacion(true);
}
// Escuchamos los dos eventos para borrar la estimacion si cambia la ficha
buscarElemento("vehicle-form").addEventListener("input", alCambiarFicha);
buscarElemento("vehicle-form").addEventListener("change", alCambiarFicha);
// Validamos al enviar para que el foco no cambie antes del clic
buscarElemento("example-choice").addEventListener("change", (evento) => {
  const valor = evento.target.value;
  const ejemplo = valor === "" ? {} : datos.examples[Number(valor)].vehiculo;
  buscarElemento("brand").value = ejemplo.brand ?? "";
  cargarModelos();
  for (const campo of camposFicha) buscarElemento(campo).value = ejemplo[campo] ?? "";
  limpiarFormulario();
});
buscarElemento("vehicle-form").addEventListener("reset", (evento) => {
  evento.preventDefault();
  buscarElemento("example-choice").value = "";
  camposFicha.forEach((campo) => {
    buscarElemento(campo).value = "";
  });
  cargarModelos();
  limpiarFormulario();
  buscarElemento("optional-details").open = false;
  buscarElemento("brand").focus();
});
buscarElemento("vehicle-form").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const { vehicle: vehiculo, errors: errores } = validarFormulario();
  camposFicha.forEach((campo) => mostrarErrorCampo(campo, errores[campo]));
  const primerError = camposFicha.find((campo) => errores[campo]);
  if (primerError) {
    borrarEstimacion();
    buscarElemento("form-status").textContent = "Revisá los campos marcados para estimar.";
    if (!opciones.obligatorios.includes(primerError))
      buscarElemento("optional-details").open = true;
    buscarElemento(primerError).focus();
    return;
  }
  buscarElemento("form-status").textContent = "";
  const resultado = predecir(vehiculo, datos.model);
  buscarElemento("estimate").textContent = dolaresConCentavos(resultado.price);
  const faltantes = opcionalesVacios(vehiculo);
  buscarElemento("estimate-caption").textContent =
    nombreVehiculo(vehiculo) +
    " · " +
    formatearEntero(vehiculo.km) +
    " km. " +
    (faltantes.length
      ? "Opcionales imputados: " +
        faltantes
          .map((campo) => opciones.etiquetas[campo].split(" (")[0].toLowerCase())
          .join(", ") +
        "."
      : "Ficha completa.");
  hayEstimacion = true;
  fichaCambio = false;
  buscarElemento("estimate-explanation").hidden = false;
  if (resultado.neighbors) {
    buscarElemento("explanation").innerHTML =
      armarTabla(columnasVecinos, resultado.neighbors.map(filaVecino)) +
      '<p class="note">La estimación suma los aportes antes de redondear los valores de la tabla.</p>';
  } else if (resultado.contributions) {
    const etiquetas = [
      ...datos.model.numeric.map((campo) => opciones.etiquetas[campo]),
      ...datos.model.categorical.flatMap((campo, posicion) =>
        datos.model.categories[posicion].map((valor) => opciones.etiquetas[campo] + " · " + valor),
      ),
    ];
    const filas = resultado.contributions
      .map((valor, posicion) => [etiquetas[posicion], valor])
      .filter(([, valor]) => valor !== 0);
    buscarElemento("explanation").innerHTML = armarTabla(
      ["Término", "Aporte"],
      [
        ["Intercepto", dolaresConSigno(datos.model.intercept)],
        ...filas.map(([nombre, valor]) => [nombre, dolaresConSigno(valor)]),
      ],
    );
  } else {
    buscarElemento("explanation").textContent =
      "La estimación usa la mediana de los precios de entrenamiento.";
  }
});
const nombreModelo =
  datos.model.kind === "knn"
    ? "k-NN con " +
      formatearEntero(datos.model.k) +
      " vecinos y peso " +
      nombreDelPeso(datos.model.weights)
    : ganador.modelo;
buscarElemento("estimator-model").textContent =
  "Usamos " +
  nombreModelo +
  ". Se eligió por el menor MAE medio en " +
  particion.folds.length +
  " folds de entrenamiento (" +
  dolaresConCentavos(ganador.MAE_CV) +
  "), antes de evaluar en prueba.";
const preparacion =
  "<strong>Preparamos y comparamos.</strong> Se escalan los números y se codifican las categorías. ";
buscarElemento("estimator-process").innerHTML =
  preparacion +
  (datos.model.kind === "knn"
    ? "Buscamos las " +
      formatearEntero(datos.model.k) +
      " fichas de entrenamiento de menor distancia euclídea. " +
      (datos.model.weights === "distance"
        ? "Promediamos sus precios con pesos inversos a la distancia: cuanto más cerca, mayor peso. Si la distancia es cero, solo se promedian las coincidencias exactas entre los vecinos elegidos."
        : "Promediamos sus precios con el mismo peso para cada vecino.")
    : datos.model.kind === "linear"
      ? "La regresión lineal suma el intercepto y los aportes de las variables preparadas."
      : "La mediana devuelve el mismo precio de referencia de entrenamiento para todas las fichas.");
buscarElemento("preprocessing-values").innerHTML =
  armarTabla(
    ["Número", "Mediana para faltantes", "Media para escalar", "Desviación para escalar"],
    datos.model.numeric.map((campo, posicion) => [
      opciones.etiquetas[campo],
      formatearDecimal(datos.model.median[posicion]),
      formatearDecimal(datos.model.mean[posicion]),
      formatearDecimal(datos.model.scale[posicion]),
    ]),
  ) +
  '<p class="note">Valores mostrados con dos decimales; el cálculo conserva la precisión exportada.</p>' +
  armarTabla(
    ["Categoría", "Moda para faltantes", "Categorías codificadas"],
    datos.model.categorical.map((campo, posicion) => [
      opciones.etiquetas[campo],
      datos.model.mode[posicion],
      datos.model.categories[posicion].length,
    ]),
  );
buscarElemento("code-source").textContent =
  datos.implementation.file +
  " · " +
  datos.implementation.function +
  " (fragmento real incorporado por el exportador).";
buscarElemento("real-code").textContent = datos.implementation.code;
buscarElemento("estimator-ties").textContent =
  datos.model.kind === "knn"
    ? "Los pesos se normalizan para sumar 1. Si dos distancias empatan, se conserva el orden de entrenamiento. Marca o modelo iguales no son un filtro: son parte de la distancia; pueden aparecer vecinos de otra marca o modelo."
    : "El navegador aplica los mismos parámetros de imputación, escalado y categorías que el Pipeline ajustado.";
for (const [clave, imagen] of Object.entries(datos.edaImages))
  buscarElemento("eda-" + clave).src = imagen;
buscarElemento("brand-summary").innerHTML = armarTabla(
  ["Marca", "Avisos", "Mediana publicada (USD)"],
  datos.brandSummary.map((fila) => [
    fila.brand,
    formatearEntero(fila.n),
    formatearEntero(fila.mediana),
  ]),
);
const reduccion = 1 - ganador.MAE_test / referencia.MAE_test;
buscarElemento("conclusion").textContent =
  ganador.modelo +
  " obtuvo un MAE de " +
  dolaresConCentavos(ganador.MAE_test) +
  " en prueba. El MAE fue " +
  formatearEntero(reduccion * 100) +
  " % menor que el del baseline de mediana.";
const fuente = datos.source;
buscarElemento("provenance").innerHTML =
  "<p>Datos de la API pública de Mercado Libre Argentina recopilados por " +
  escaparTexto(fuente.author) +
  ". Versión " +
  fuente.version +
  " publicada y actualizada en febrero de 2024. Licencia declarada en Kaggle: " +
  escaparTexto(fuente.license) +
  ". Descarga del " +
  escaparTexto(fuente.downloaded_on.split("-").reverse().join("/")) +
  ".</p>" +
  "<p>El modelo usa precios directamente en USD. Las " +
  formatearEntero(datos.brands) +
  " marcas y los " +
  formatearEntero(datos.models) +
  " modelos de la muestra son un recorte de la oferta. El año es el de fabricación.</p>" +
  "<p>Validación en cinco particiones agrupadas. Preprocesamiento ajustado en cada partición. " +
  "Evaluación con " +
  porcentaje(particion.fraccion_test) +
  " de los avisos limpios reservados para prueba.</p>" +
  '<p class="note">SHA-256 del CSV <code>' +
  escaparTexto(fuente.sha256) +
  "</code></p>" +
  '<p><a href="' +
  escaparTexto(fuente.source) +
  '">Ficha del dataset en Kaggle</a></p>';
const graficos = {
  histogram: mostrarHistograma,
  "relation-chart": mostrarRelacion,
  "error-chart": mostrarCaso,
};
const observador = new ResizeObserver((entradas) =>
  entradas.forEach(({ target: destino }) => {
    if (destino.clientWidth) graficos[destino.id]();
  }),
);
Object.keys(graficos).forEach((identificador) => observador.observe(buscarElemento(identificador)));

// Los enlaces internos llevan el foco al titulo de la seccion
const secciones = [...document.querySelectorAll("main > section")];
const menu = buscarElemento("route-menu");
const tituloSeccion = (seccion) => seccion.querySelector("h1, h2").textContent;
buscarElemento("route-links").innerHTML = secciones
  .map(
    (seccion) =>
      '<li><a href="#' + seccion.id + '">' + escaparTexto(tituloSeccion(seccion)) + "</a></li>",
  )
  .join("");
secciones.forEach((seccion, posicion) => {
  const encabezado = seccion.querySelector("h1, h2");
  encabezado.tabIndex = -1;
  const etiqueta = document.createElement("p");
  etiqueta.className = "section-number";
  etiqueta.textContent = String(posicion + 1).padStart(2, "0") + " / " + secciones.length;
  encabezado.before(etiqueta);
  const navegacion = document.createElement("nav");
  navegacion.className = "section-pager";
  navegacion.setAttribute("aria-label", "Navegar desde " + tituloSeccion(seccion));
  navegacion.innerHTML =
    (posicion
      ? '<a href="#' + secciones[posicion - 1].id + '">← Anterior</a>'
      : '<a href="#problema">Comenzar →</a>') +
    (posicion && posicion < secciones.length - 1
      ? '<a href="#' + secciones[posicion + 1].id + '">Siguiente →</a>'
      : posicion
        ? '<a href="#portada">Volver al inicio ↑</a>'
        : "");
  seccion.querySelector(".wrap").append(navegacion);
});
document.addEventListener("click", (evento) => {
  const enlace = evento.target.closest('a[href^="#"]');
  if (
    !enlace ||
    evento.ctrlKey ||
    evento.metaKey ||
    evento.shiftKey ||
    evento.altKey ||
    evento.button
  )
    return;
  const destino = document.querySelector(enlace.getAttribute("href"));
  if (!destino) return;
  evento.preventDefault();
  menu.open = false;
  const encabezado = destino.matches("section") ? destino.querySelector("h1, h2") : destino;
  encabezado.focus({
    preventScroll: true,
  });
  destino.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
  history.replaceState(null, "", enlace.getAttribute("href"));
});
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && menu.open) {
    menu.open = false;
    menu.querySelector("summary").focus();
  }
});
document.addEventListener("click", (evento) => {
  if (menu.open && !menu.contains(evento.target)) menu.open = false;
});
