const data = JSON.parse(document.getElementById("data").textContent);
const options = data.options;
const byId = id => document.getElementById(id);
const integer = new Intl.NumberFormat("es-AR", {maximumFractionDigits: 0});
const decimal = new Intl.NumberFormat("es-AR", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const r2 = new Intl.NumberFormat("es-AR", {minimumFractionDigits: 4, maximumFractionDigits: 4});
const num = value => integer.format(value);
const dec = value => decimal.format(value);
const usd = value => "USD " + num(value);
const preciseUSD = value => "USD " + dec(value);
const signed = value => (value >= 0 ? "+" : "−") + usd(Math.abs(value));
const safe = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const percent = value => dec(value * 100) + " %";
const weightLabel = weight => ({distance: "por distancia", uniform: "uniforme"})[weight];

function selectOptions(element, entries) {
  element.replaceChildren(...entries.map(([value, label]) => new Option(label, value)));
}

function table(labels, rows) {
  const heading = labels.map(label => '<th scope="col">' + safe(label) + "</th>").join("");
  const body = rows.map(row => "<tr>" + row.map(value => "<td>" + safe(value) + "</td>").join("") + "</tr>").join("");
  return '<div class="table-wrap"><table><thead><tr>' + heading + "</tr></thead><tbody>" + body + "</tbody></table></div>";
}

function stats(entries) {
  return entries.map(([value, label]) => "<div><dt>" + safe(value) + "</dt><dd>" + safe(label) + "</dd></div>").join("");
}

const examples = data.auditExamples;
const auditCount = prefix => data.audit.find(row => row.motivo.startsWith(prefix)).cantidad;
byId("funnel").innerHTML = stats([
  [num(data.raw.rows), "avisos originales · " + data.raw.cols + " columnas"],
  [num(data.selected), "usados publicados en USD"],
  [num(data.clean), "avisos después de la limpieza"],
]);
byId("audit-summary").innerHTML = [
  "<p><strong>ID repetido.</strong> " + safe(examples[0].id) + " figura como Ford Ka en el modelo y Focus III en el título. Conservamos la primera aparición.</p>",
  "<p><strong>Año imposible.</strong> Un Chevrolet Corsa figura con año " + safe(examples[1].car_year) + ". Quitamos el aviso.</p>",
  "<p><strong>Anticipo.</strong> Excluimos el Fiat Uno cuyo título identifica " + usd(examples[2].price) + " como anticipo. Conservamos los otros " +
    num(auditCount("Títulos que ofrecen")) + " avisos que ofrecen financiación.</p>",
].join("");
byId("audit-table").innerHTML = table(["Acción", "Regla", "Cantidad"],
  data.audit.map(row => [row.accion, row.motivo, num(row.cantidad)])) +
  table(["ID de publicación", "Título original"], examples.map(row => [row.id, row.title]));

function showTransform() {
  const stages = {
    engine: [["Texto original", "1.6 110CV"], ["Cilindrada", "1,6 L"], ["Dato numérico", "1,6"]],
    km: [["Texto original", "119000 km"], ["Unidad", "km"], ["Dato numérico", "119.000"]],
    doors: [["Texto original", num(examples[1].doors)], ["Control", "Fuera de 2 a 6"], ["Resultado", "Faltante"]],
  }[byId("transform-choice").value];
  byId("transform-demo").innerHTML = stages.map(([label, value], i) =>
    '<div class="animate" style="animation-delay:' + i * 65 + 'ms"><span class="note">' +
    safe(label) + "</span><b>" + safe(value) + "</b></div>").join("");
}
byId("transform-choice").addEventListener("change", showTransform);
showTransform();

const price = data.price;
byId("price-copy").textContent = "La mitad central va de " + usd(price.q1) + " a " + usd(price.q3) +
  ". Los precios altos alargan la cola y elevan la media.";
byId("price-stats").innerHTML = stats([
  [usd(price.median), "Mediana"], [usd(price.mean), "Media"], [usd(price.max), "Máximo observado"],
]);

const tickNumber = new Intl.NumberFormat("es-AR", {maximumFractionDigits: 1});
const compactTick = value => {
  if (Math.abs(value) >= 1000000) return tickNumber.format(value / 1000000) + " M";
  return Math.abs(value) >= 1000 ? tickNumber.format(value / 1000) + " mil" : num(value);
};
const series = (lo, hi, count) => Array.from({length: count}, (_, i) => lo + (hi - lo) * i / (count - 1));

function graph(element, config) {
  const width = element.clientWidth;
  const height = 294;
  const left = 57;
  const right = width - 17;
  const top = 22;
  const bottom = height - 54;
  const [xmin, xmax] = config.x;
  const [ymin, ymax] = config.y;
  const x = value => left + (value - xmin) * (right - left) / (xmax - xmin);
  const y = value => bottom - (value - ymin) * (bottom - top) / (ymax - ymin);
  const point = (cx, cy, r, className) => '<circle class="' + className + '" cx="' + x(cx).toFixed(2) +
    '" cy="' + y(cy).toFixed(2) + '" r="' + r + '"/>';
  const line = (x1, y1, x2, y2, className) => '<line class="' + className + '" x1="' + x1 + '" y1="' + y1 +
    '" x2="' + x2 + '" y2="' + y2 + '"/>';
  const label = (value, tx, ty, align, className = "tick") => '<text class="' + className + '" x="' + tx +
    '" y="' + ty + '" text-anchor="' + align + '">' + safe(value) + "</text>";
  const xt = config.xt ?? series(xmin, xmax, width < 440 ? 4 : 5);
  const yt = config.yt ?? series(ymin, ymax, 5);
  const gx = xt.map(value => label((config.formatX ?? compactTick)(value), x(value), bottom + 19, "middle")).join("");
  const gy = yt.map(value => line(left, y(value), right, y(value), "gridline") +
    label(compactTick(value), left - 8, y(value) + 4, "end")).join("");
  let marks = "";
  if (config.bins) {
    marks = config.bins.map(([lo, hi, count]) =>
      '<rect class="hist-bar" x="' + (x(lo) + 1) + '" y="' + y(count) + '" width="' + (x(hi) - x(lo) - 2) +
      '" height="' + (bottom - y(count)) + '"><title>' + usd(lo) + " a " + usd(hi) + " · " + num(count) +
      " avisos</title></rect>").join("");
  }
  if (config.points) {
    if (config.diagonal) marks += line(x(0), y(0), x(xmax), y(ymax), "axis reference");
    marks += config.points.map(([px, py]) => point(px, py, width < 440 ? 1.6 : 2, "data-point")).join("");
    if (config.highlight) {
      marks += line(x(config.highlight.price), y(config.highlight.price),
        x(config.highlight.price), y(config.highlight.precio_estimado), "axis");
      marks += point(config.highlight.price, config.highlight.precio_estimado, 5, "highlight animate");
    }
  }
  element.innerHTML = '<svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + safe(config.name) +
    '">' + gy + marks + line(left, bottom, right, bottom, "axis") + gx +
    label(config.xTitle, (left + right) / 2, height - 8, "middle", "axis-title") +
    label(config.yTitle, left, 13, "start", "axis-title") + "</svg>";
}

const histogram = price.histogram.map((count, i) => [price.edges[i], price.edges[i + 1], count]);
function showHistogram() {
  const top = Math.ceil(Math.max(...price.histogram) / 500) * 500;
  graph(byId("histogram"), {x: [0, price.edges.at(-1)], y: [0, top], bins: histogram,
    name: "Histograma de precios en USD", xTitle: "Precio publicado (USD)", yTitle: "Avisos",
    xt: [0, 20000, 40000, 60000, 80000], yt: series(0, top, 5)});
}

function showRelation() {
  const field = byId("relation-choice").value;
  const {points, r} = data.relations[field];
  const settings = {
    car_year: {x: [1989, 2025], xt: [1990, 2000, 2010, 2024], formatX: String, xTitle: "Año de fabricación"},
    km: {x: [0, 1020000], xt: [0, 250000, 500000, 750000, 1000000], xTitle: "Kilometraje (km)"},
    power_hp: {x: [0, 280], xt: [0, 70, 140, 210, 280], xTitle: "Potencia (hp)"},
  }[field];
  const chart = byId("relation-chart");
  if (field === "km" && chart.clientWidth < 430) settings.xt = [0, 250000, 500000, 1000000];
  graph(chart, {...settings, y: [0, 85000], yt: [0, 20000, 40000, 60000, 80000], points,
    name: "Dispersión de precio según " + settings.xTitle.toLowerCase(), yTitle: "Precio publicado (USD)"});
  byId("relation-copy").textContent = "r de Pearson = " + dec(r) + " · " + num(points.length) + " avisos.";
}
byId("relation-choice").addEventListener("change", showRelation);

const partition = data.partition;
const chosen = data.metrics.find(row => row.elegido_por_CV);
const baseline = data.metrics.find(row => row.modelo === "Baseline mediana");
const knn = data.knn ?? data.model;
byId("selection-copy").textContent = chosen.modelo + (data.model.kind === "knn"
  ? " con " + num(knn.k) + " vecinos y peso " + weightLabel(knn.weights) : "") +
  " obtuvo el menor MAE de validación, " + preciseUSD(chosen.MAE_CV) + ".";
byId("cv-table").innerHTML = table(["Modelo", "Vecinos", "Pesos", "MAE de validación"],
  data.cv.map(row => [row.modelo, row.vecinos ?? "·", weightLabel(row.pesos) ?? "·", preciseUSD(row.MAE_CV)]));
byId("partition-copy").textContent = num(partition.grupos_train) + " grupos de entrenamiento y " +
  num(partition.grupos_test) + " de prueba. Grupos compartidos: " + num(partition.grupos_compartidos) +
  ". Semilla " + partition.semilla + ".";

function partitionBar(counts, labels) {
  return '<div class="partition-track animate" aria-hidden="true">' +
    counts.map(count => '<span style="flex:' + count + '"></span>').join("") + '</div><div class="partition-legend">' +
    counts.map((count, i) => "<span><b>" + num(count) + "</b> " + safe(labels[i]) + "</span>").join("") + "</div>";
}
byId("holdout").innerHTML = partitionBar([partition.train, partition.test], ["entrenamiento", "prueba"]);
selectOptions(byId("fold-choice"), partition.folds.map(row => [row.fold, "Fold " + row.fold + " de " + partition.folds.length]));
function showFold() {
  const selected = Number(byId("fold-choice").value);
  const fold = partition.folds[selected - 1];
  const blocks = partition.folds.map(row => '<span class="' + (row.fold === selected ? "current animate" : "") +
    '" style="flex:' + row.validacion + '">' + row.fold + "</span>").join("");
  byId("fold-demo").innerHTML = '<div class="fold-track" aria-hidden="true">' + blocks +
    '</div><div class="partition-legend"><span><b>' + num(fold.ajuste) + '</b> ajuste</span><span><b>' +
    num(fold.validacion) + '</b> validación (bloque ' + selected + ')</span></div>' +
    '<p class="note">' + fold.grupos_compartidos + " grupos compartidos en este fold.</p>";
}
byId("fold-choice").addEventListener("change", showFold);
showFold();

const vehicleName = row => row.brand + " " + row.model + " " + row.car_year;
const neighborHeaders = ["Vehículo", "Distancia", "Peso", "Precio (USD)", "Aporte (USD)"];
function neighborValues(row) {
  const car = data.neighbors[row.index];
  return [vehicleName(car) + " · " + num(car.km) + " km", dec(row.distance), percent(row.weight),
    num(row.price), num(row.contribution)];
}
const demoVehicle = data.examples[1].vehiculo;
const demo = predecir(demoVehicle, knn);
byId("neighbor-intro").textContent = vehicleName(demoVehicle) + " · " + num(demoVehicle.km) +
  " km. Usamos una ficha de entrenamiento con especificaciones opcionales faltantes para ver la búsqueda." +
  (data.model.kind === "knn" ? "" : " Esta animación corresponde al modelo de comparación.");
byId("neighbor-weight-rule").textContent = knn.weights === "distance"
  ? "El peso parte de 1 ÷ distancia y se normaliza para que los pesos sumen 100 %. Si hay coincidencias exactas, solo ellas reciben peso."
  : "Con pesos uniformes, todos los vecinos aportan la misma proporción de su precio.";
let visibleNeighbors = 0;
function showNeighbors() {
  const shown = demo.neighbors.slice(0, visibleNeighbors);
  byId("neighbor-demo").innerHTML = table(neighborHeaders, shown.map(neighborValues));
  byId("neighbor-demo").querySelector("tbody tr:last-child")?.classList.add("animate");
  const subtotal = shown.reduce((sum, row) => sum + row.contribution, 0);
  byId("neighbor-status").textContent = visibleNeighbors === knn.k
    ? "Estimación de k-NN: " + usd(demo.price)
    : visibleNeighbors + " de " + knn.k + " vecinos visibles" + (visibleNeighbors ? " · aporte acumulado " + usd(subtotal) : ".");
  byId("reveal-neighbor").disabled = visibleNeighbors === knn.k;
  byId("reset-neighbors").disabled = visibleNeighbors === 0;
}
byId("reveal-neighbor").addEventListener("click", () => { visibleNeighbors++; showNeighbors(); });
byId("reset-neighbors").addEventListener("click", () => { visibleNeighbors = 0; showNeighbors(); });
showNeighbors();

function showMetric() {
  const field = byId("metric-choice").value;
  const explain = {
    MAE_test: "El MAE mide cuánto se desvía, en promedio, la estimación del precio publicado.",
    RMSE_test: "El RMSE da más peso a las diferencias grandes y se expresa en USD.",
    R2_test: "R² compara el error cuadrático con el de usar la media observada de prueba. Puede ser negativo.",
  };
  byId("metric-copy").textContent = explain[field];
  const values = data.metrics.map(row => row[field]);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const position = value => (value - low) / (high - low) * 100;
  const zero = position(0);
  byId("metric-chart").innerHTML = data.metrics.map(row => {
    const bar = position(row[field]);
    const label = field === "R2_test" ? dec(row[field]) : usd(row[field]);
    return '<div class="bar-row animate"><div class="bar-label"><span>' + safe(row.modelo) +
      (row.elegido_por_CV ? " · elegido" : "") + '</span><span class="number">' + label +
      '</span></div><div class="bar-track" aria-hidden="true"><i class="' + (row.elegido_por_CV ? "" : "secondary-bar") +
      '" style="left:' + Math.min(bar, zero) + "%;width:" + Math.abs(bar - zero) + '%"></i><span class="zero" style="left:' +
      zero + '%"></span></div></div>';
  }).join("");
}
byId("metric-choice").addEventListener("change", showMetric);
byId("metric-table").innerHTML = table(["Modelo", "MAE CV", "MAE prueba", "RMSE prueba", "R²"],
  data.metrics.map(row => [row.modelo, preciseUSD(row.MAE_CV), preciseUSD(row.MAE_test), preciseUSD(row.RMSE_test), r2.format(row.R2_test)]));
showMetric();

selectOptions(byId("case-choice"), data.cases.map((row, i) => [
  i, vehicleName(row) + (i === 0 ? " · error típico" : " · error alto"),
]));
function showCase() {
  const row = data.cases[Number(byId("case-choice").value)];
  byId("case-copy").innerHTML = "<strong>" + safe(row.id) + "</strong><br>Publicado " + usd(row.price) +
    "<br>Estimado " + usd(row.precio_estimado) + "<br>Diferencia " + signed(row.error);
  graph(byId("error-chart"), {x: [0, 85000], y: [0, 85000], xt: [0, 20000, 40000, 60000, 80000],
    yt: [0, 20000, 40000, 60000, 80000], points: data.testPoints, diagonal: true, highlight: row,
    name: "Precios estimados frente a los publicados, con el aviso elegido resaltado",
    xTitle: "Precio publicado (USD)", yTitle: "Precio estimado (USD)"});
}
byId("case-choice").addEventListener("change", showCase);
function showSegments() {
  const field = byId("segment-choice").value;
  const [low, high] = partition.cortes_precio_USD;
  const explanations = {
    nivel_precio: "Terciles de entrenamiento en " + usd(low) + " y " + usd(high) + ".",
    antiguedad: "Antigüedad medida con referencia a 2024.",
    brand: "Cada fila reúne los avisos de la marca que quedaron en prueba.",
  };
  byId("segment-copy").textContent = explanations[field] + " El sesgo es la diferencia promedio entre estimado y publicado.";
  byId("segment-table").innerHTML = table(["Segmento", "Avisos", "MAE", "Sesgo"],
    data.errors.filter(row => row.variable === field).map(row => [row.segmento, num(row.n), usd(row.MAE), signed(row.sesgo)]));
}
byId("segment-choice").addEventListener("change", showSegments);
showSegments();

const formFields = ["brand", "model", "car_year", "km", "fuel_type", "transmission",
  "engine_l", "power_hp", "doors", "passenger_capacity", "traction_control"];

function formField(field) {
  const required = options.obligatorios.includes(field);
  const type = required ? " required" : "";
  const attrs = ' id="' + field + '" name="' + field + '" aria-describedby="error-' + field + '"' + type;
  const range = options.rangos[field];
  const control = range
    ? '<input type="number" min="' + range[0] + '" max="' + range[1] + '" step="' +
      (options.enteros.includes(field) ? "1" : "any") + '"' + attrs + ">"
    : "<select" + attrs + "></select>";
  return '<div><label for="' + field + '">' + safe(options.etiquetas[field]) + "</label>" + control +
    '<span class="field-error" id="error-' + field + '"></span></div>';
}
byId("required-fields").innerHTML = formFields.filter(field => options.obligatorios.includes(field)).map(formField).join("");
byId("optional-fields").innerHTML = formFields.filter(field => !options.obligatorios.includes(field)).map(formField).join("");
function setChoices(field, values, empty) {
  selectOptions(byId(field), [["", empty], ...values.map(value => [value, value])]);
}
function setModels() {
  const brand = byId("brand").value;
  setChoices("model", options.modelos[brand] ?? [], brand ? "Elegí el modelo" : "Elegí primero la marca");
  byId("model").disabled = !brand;
}
setChoices("brand", Object.keys(options.modelos), "Elegí la marca");
for (const [field, values] of Object.entries(options.categorias)) {
  setChoices(field, values, options.obligatorios.includes(field) ? "Elegí una opción" : "Sin dato");
}
selectOptions(byId("example-choice"), [["", "Completar una ficha"], ...data.examples.map(({vehiculo}, i) =>
  [i, vehicleName(vehiculo) + (i === 1 ? " · sin opcionales" : "")])]);
setModels();

function fieldError(field, message = "") {
  byId("error-" + field).textContent = message;
  if (message) byId(field).setAttribute("aria-invalid", "true");
  else byId(field).removeAttribute("aria-invalid");
}
function resetEstimate() {
  byId("estimate").textContent = "USD ·";
  byId("estimate-caption").textContent = "La estimación aparece al completar la ficha.";
  byId("estimate-explanation").hidden = true;
}
function formValues() {
  return Object.fromEntries(formFields.map(field => [field, byId(field).value]));
}
function fieldErrors() {
  const result = validarVehiculo(formValues(), options);
  for (const field of formFields) {
    if (byId(field).validity.badInput) result.errors[field] = options.etiquetas[field] + " debe ser un número.";
  }
  return result;
}
function clearFormStatus() {
  byId("form-status").textContent = "";
  formFields.forEach(field => fieldError(field));
  resetEstimate();
}
byId("brand").addEventListener("change", () => { setModels(); fieldError("model"); });
byId("vehicle-form").addEventListener("input", event => {
  if (event.target.id === "example-choice") return;
  byId("example-choice").value = "";
  byId("form-status").textContent = "";
  fieldError(event.target.id);
  resetEstimate();
});
byId("vehicle-form").addEventListener("focusout", event => {
  const field = event.target.id;
  if (formFields.includes(field) && (byId(field).value || byId(field).validity.badInput)) {
    fieldError(field, fieldErrors().errors[field]);
  }
});
byId("example-choice").addEventListener("change", event => {
  const value = event.target.value;
  const sample = value === "" ? {} : data.examples[Number(value)].vehiculo;
  byId("brand").value = sample.brand ?? "";
  setModels();
  for (const field of formFields) byId(field).value = sample[field] ?? "";
  clearFormStatus();
});
byId("vehicle-form").addEventListener("submit", event => {
  event.preventDefault();
  const {vehicle, errors} = fieldErrors();
  formFields.forEach(field => fieldError(field, errors[field]));
  const first = formFields.find(field => errors[field]);
  if (first) {
    resetEstimate();
    byId("form-status").textContent = "Revisá los campos marcados para estimar.";
    if (!options.obligatorios.includes(first)) byId("optional-details").open = true;
    byId(first).focus();
    return;
  }
  byId("form-status").textContent = "";
  const result = predecir(vehicle, data.model);
  byId("estimate").textContent = preciseUSD(result.price);
  const missing = formFields.filter(field => vehicle[field] === null);
  byId("estimate-caption").textContent = vehicleName(vehicle) + " · " + num(vehicle.km) + " km. " +
    (missing.length ? "Opcionales imputados: " + missing.map(field => options.etiquetas[field].split(" (")[0].toLowerCase()).join(", ") + "." :
      "Ficha completa.");
  byId("estimate-explanation").hidden = false;
  if (result.neighbors) {
    byId("explanation").innerHTML = table(neighborHeaders, result.neighbors.map(neighborValues)) +
      '<p class="note">La estimación suma los aportes antes de redondear los valores de la tabla.</p>';
  } else if (result.contributions) {
    const labels = [...data.model.numeric.map(field => options.etiquetas[field]),
      ...data.model.categorical.flatMap((field, i) => data.model.categories[i].map(
        value => options.etiquetas[field] + " · " + value))];
    const rows = result.contributions.map((value, i) => [labels[i], value]).filter(([, value]) => value !== 0);
    byId("explanation").innerHTML = table(["Término", "Aporte"], [
      ["Intercepto", signed(data.model.intercept)], ...rows.map(([name, value]) => [name, signed(value)]),
    ]);
  } else {
    byId("explanation").textContent = "La estimación usa la mediana de los precios de entrenamiento.";
  }
});

const reduction = 1 - chosen.MAE_test / baseline.MAE_test;
byId("conclusion").textContent = chosen.modelo + " obtuvo un MAE de " + preciseUSD(chosen.MAE_test) +
  " en prueba. El MAE fue " + num(reduction * 100) + " % menor que el del baseline de mediana.";
const source = data.source;
byId("provenance").innerHTML =
  "<p>Datos de la API pública de Mercado Libre Argentina recopilados por " + safe(source.author) +
  ". Versión " + source.version + " publicada y actualizada en febrero de 2024. Licencia declarada en Kaggle: " +
  safe(source.license) + ". Descarga del " + safe(source.downloaded_on.split("-").reverse().join("/")) + ".</p>" +
  "<p>El modelo usa precios directamente en USD. Las " + num(data.brands) + " marcas y los " + num(data.models) +
  " modelos de la muestra son un recorte de la oferta. El año es el de fabricación.</p>" +
  "<p>Validación en cinco particiones agrupadas. Preprocesamiento ajustado en cada partición. " +
  "Evaluación con " + percent(partition.fraccion_test) + " de los avisos limpios reservados para prueba.</p>" +
  '<p class="note">SHA-256 del CSV <code>' + safe(source.sha256) + '</code></p>' +
  '<p><a href="' + safe(source.source) + '">Ficha del dataset en Kaggle</a></p>';

const charts = {"histogram": showHistogram, "relation-chart": showRelation, "error-chart": showCase};
const observer = new ResizeObserver(entries => entries.forEach(({target}) => {
  if (target.clientWidth) charts[target.id]();
}));
Object.keys(charts).forEach(id => observer.observe(byId(id)));
