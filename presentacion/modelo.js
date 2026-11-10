// Refleja las transformaciones y el orden de dimensiones del Pipeline de Python.
function validarVehiculo(values, options) {
  const errors = {};
  const vehicle = {};
  const brand = String(values.brand ?? "").trim();
  const choices = {
    brand: Object.keys(options.modelos),
    model: Object.hasOwn(options.modelos, brand) ? options.modelos[brand] : [],
    ...options.categorias,
  };
  for (const [field, label] of Object.entries(options.etiquetas)) {
    const raw = String(values[field] ?? "").trim();
    if (!raw) {
      if (options.obligatorios.includes(field)) errors[field] = `Completá ${label.toLowerCase()}.`;
      vehicle[field] = null;
    } else if (field in options.rangos) {
      const [low, high] = options.rangos[field];
      const value = Number(raw);
      const integer = options.enteros.includes(field);
      if (!/^[+-]?\d+(?:\.\d+)?$/.test(raw)) {
        errors[field] = `${label} debe ser un número.`;
      } else if (value < low || value > high || (integer && !Number.isInteger(value))) {
        errors[field] = `${label} debe estar entre ${low} y ${high}.${integer ? " Ingresá un entero." : ""}`;
      }
      vehicle[field] = value;
    } else {
      if (!choices[field].includes(raw)) errors[field] = `${label} no es compatible con las opciones disponibles.`;
      vehicle[field] = raw;
    }
  }
  return {vehicle, errors};
}

function transformar(vehicle, model) {
  const numbers = model.numeric.map((field, i) =>
    ((vehicle[field] ?? model.median[i]) - model.mean[i]) / model.scale[i]);
  const categories = model.categorical.flatMap((field, i) =>
    model.categories[i].map(value => Number(value === (vehicle[field] ?? model.mode[i]))));
  return [...numbers, ...categories];
}

function predecir(vehicle, model) {
  if (model.kind === "median") return {price: model.value};
  const vector = transformar(vehicle, model);
  if (model.kind === "linear") {
    const contributions = vector.map((value, i) => value * model.coef[i]);
    return {price: contributions.reduce((total, value) => total + value, model.intercept), contributions};
  }
  const n = model.numeric.length;
  const sorted = model.vectors.map(([numbers, active], index) => {
    let distance2 = 0;
    for (let i = 0; i < n; i++) {
      const delta = vector[i] - numbers[i];
      distance2 += delta * delta;
    }
    let cursor = 0;
    for (let i = n; i < vector.length; i++) {
      const enabled = active[cursor] === i - n;
      if (enabled) cursor++;
      const delta = vector[i] - Number(enabled);
      distance2 += delta * delta;
    }
    return {index, distance2};
  }).sort((a, b) => a.distance2 - b.distance2 || a.index - b.index).slice(0, model.k);
  const exact = sorted[0].distance2 === 0;
  const neighbors = sorted.map(({index, distance2}) => {
    const distance = Math.sqrt(distance2);
    let weight = 1;
    if (model.weights === "distance") weight = exact ? Number(distance === 0) : 1 / distance;
    return {index, distance, weight, price: model.prices[index]};
  });
  const total = neighbors.reduce((sum, row) => sum + row.weight, 0);
  for (const row of neighbors) {
    row.weight /= total;
    row.contribution = row.price * row.weight;
  }
  return {price: neighbors.reduce((sum, row) => sum + row.contribution, 0), neighbors};
}
