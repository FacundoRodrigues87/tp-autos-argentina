// Validamos la ficha antes de estimar el precio
function validarVehiculo(valores, opciones) {
  const errores = {};
  const vehiculo = {};
  const marca = String(valores.brand ?? "").trim();
  let modelos = [];
  if (Object.hasOwn(opciones.modelos, marca)) {
    modelos = opciones.modelos[marca];
  }
  const categoriasValidas = {
    brand: Object.keys(opciones.modelos),
    model: modelos,
    ...opciones.categorias,
  };

  for (const campo of Object.keys(opciones.etiquetas)) {
    const etiqueta = opciones.etiquetas[campo];
    const texto = String(valores[campo] ?? "").trim();
    if (texto === "") {
      if (opciones.obligatorios.includes(campo)) {
        errores[campo] = "Completá " + etiqueta.toLowerCase() + ".";
      }
      vehiculo[campo] = null;
      continue;
    }

    if (campo in opciones.rangos) {
      const minimo = opciones.rangos[campo][0];
      const maximo = opciones.rangos[campo][1];
      const numero = Number(texto);
      const requiereEntero = opciones.enteros.includes(campo);
      if (!/^[+-]?\d+(?:\.\d+)?$/.test(texto)) {
        errores[campo] = etiqueta + " debe ser un número.";
      } else if (
        numero < minimo ||
        numero > maximo ||
        (requiereEntero && !Number.isInteger(numero))
      ) {
        errores[campo] = etiqueta + " debe estar entre " + minimo + " y " + maximo + ".";
        if (requiereEntero) {
          errores[campo] += " Ingresá un entero.";
        }
      }
      vehiculo[campo] = numero;
    } else {
      if (!categoriasValidas[campo].includes(texto)) {
        errores[campo] = etiqueta + " no es compatible con las opciones disponibles.";
      }
      vehiculo[campo] = texto;
    }
  }
  return { vehicle: vehiculo, errors: errores };
}

function transformar(vehiculo, modelo) {
  const vector = [];
  // Completamos los numeros vacios con la mediana antes de escalar
  for (let posicion = 0; posicion < modelo.numeric.length; posicion++) {
    const campo = modelo.numeric[posicion];
    let numero = vehiculo[campo];
    if (numero == null) {
      numero = modelo.median[posicion];
    }
    const centrado = numero - modelo.mean[posicion];
    vector.push(centrado / modelo.scale[posicion]);
  }

  // Cada categoria tiene un lugar propio con un cero o un uno
  for (let posicion = 0; posicion < modelo.categorical.length; posicion++) {
    const campo = modelo.categorical[posicion];
    let categoria = vehiculo[campo];
    if (categoria == null) {
      categoria = modelo.mode[posicion];
    }
    for (const valor of modelo.categories[posicion]) {
      if (valor === categoria) {
        vector.push(1);
      } else {
        vector.push(0);
      }
    }
  }
  return vector;
}

function predecir(vehiculo, modelo) {
  if (modelo.kind === "median") {
    return { price: modelo.value };
  }

  const vector = transformar(vehiculo, modelo);
  if (modelo.kind === "linear") {
    const aportes = [];
    let precio = modelo.intercept;
    for (let posicion = 0; posicion < vector.length; posicion++) {
      const aporte = vector[posicion] * modelo.coef[posicion];
      aportes.push(aporte);
      precio += aporte;
    }
    return { price: precio, contributions: aportes };
  }

  const cantidadNumeros = modelo.numeric.length;
  const distancias = [];
  for (let indice = 0; indice < modelo.vectors.length; indice++) {
    const numeros = modelo.vectors[indice][0];
    const columnasActivas = modelo.vectors[indice][1];
    let distanciaCuadrada = 0;
    for (let posicion = 0; posicion < cantidadNumeros; posicion++) {
      const diferencia = vector[posicion] - numeros[posicion];
      distanciaCuadrada += diferencia * diferencia;
    }

    // El archivo solo guarda las posiciones que tienen un uno
    let siguienteActiva = 0;
    for (let posicion = cantidadNumeros; posicion < vector.length; posicion++) {
      let valor = 0;
      if (columnasActivas[siguienteActiva] === posicion - cantidadNumeros) {
        valor = 1;
        siguienteActiva++;
      }
      const diferencia = vector[posicion] - valor;
      distanciaCuadrada += diferencia * diferencia;
    }
    distancias.push({ indice, distanciaCuadrada });
  }

  // En un empate queda primero el aviso que se guardo antes
  distancias.sort(function (primero, segundo) {
    if (primero.distanciaCuadrada === segundo.distanciaCuadrada) {
      return primero.indice - segundo.indice;
    }
    return primero.distanciaCuadrada - segundo.distanciaCuadrada;
  });
  const masCercanos = distancias.slice(0, modelo.k);
  const hayCoincidencias = masCercanos[0].distanciaCuadrada === 0;

  const vecinos = [];
  let sumaPesos = 0;
  for (const aviso of masCercanos) {
    const distancia = Math.sqrt(aviso.distanciaCuadrada);
    let peso = 1;
    if (modelo.weights === "distance") {
      if (hayCoincidencias) {
        peso = Number(distancia === 0);
      } else {
        peso = 1 / distancia;
      }
    }
    sumaPesos += peso;
    vecinos.push({
      index: aviso.indice,
      distance: distancia,
      weight: peso,
      price: modelo.prices[aviso.indice],
    });
  }

  let precio = 0;
  for (const vecino of vecinos) {
    vecino.weight = vecino.weight / sumaPesos;
    vecino.contribution = vecino.price * vecino.weight;
    precio += vecino.contribution;
  }
  return { price: precio, neighbors: vecinos };
}
