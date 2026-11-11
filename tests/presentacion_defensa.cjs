/* Prueba de la presentacion sin red con Playwright */
const archivos = require("node:fs");
const rutas = require("node:path");
const verificar = require("node:assert/strict");
const { pathToFileURL: rutaAUrl } = require("node:url");
const { chromium: navegadorChromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const datosPrueba = JSON.parse(archivos.readFileSync(process.argv[2], "utf8"));
const carpetaCapturas = process.argv[3] || "/tmp/capturas-defensa";
archivos.mkdirSync(carpetaCapturas, {
  recursive: true,
});
const direccion = rutaAUrl(rutas.resolve(__dirname, "../presentacion/presentacion.html")).href;
const verificarCercania = (primero, segundo, tolerancia = 1e-8) =>
  verificar.ok(Math.abs(primero - segundo) <= tolerancia, `${primero} ≠ ${segundo}`);
async function probar() {
  const navegador = await navegadorChromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE
      ? {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
        }
      : {}),
  });
  const contexto = await navegador.newContext({
    viewport: {
      width: 1440,
      height: 900,
    },
    offline: true,
    reducedMotion: "reduce",
  });
  const pagina = await contexto.newPage();
  const errores = [],
    solicitudes = [];
  pagina.on("pageerror", (error) => errores.push(String(error)));
  pagina.on("request", (solicitud) => {
    if (/^https?:/.test(solicitud.url())) solicitudes.push(solicitud.url());
  });
  await pagina.goto(direccion);
  await pagina.locator("#histogram svg").waitFor();
  verificar.equal(await pagina.locator("main > section").count(), 13);
  verificar.ok(await pagina.locator("#estimator-model").textContent());
  verificar.equal(await pagina.locator("#estimate-explanation").isVisible(), false);
  verificar.equal(await pagina.locator("#real-code").textContent(), datosPrueba.implementation);
  verificar.match(await pagina.locator("#estimator-model").textContent(), /5 vecinos/);
  verificar.equal(await pagina.locator("#model").isDisabled(), true);
  const paridad = await pagina.evaluate((pruebas) => {
    let errorMaximo = 0,
      errorMaximoPrueba = 0;
    pruebas.vehicles.forEach((vehiculo, posicion) => {
      const validacion = validarVehiculo(vehiculo, opciones);
      if (Object.keys(validacion.errors).length) throw Error(JSON.stringify(validacion.errors));
      errorMaximo = Math.max(
        errorMaximo,
        Math.abs(predecir(validacion.vehicle, datos.model).price - pruebas.expected[posicion]),
      );
    });
    pruebas.testVehicles.forEach((vehiculo, posicion) => {
      errorMaximoPrueba = Math.max(
        errorMaximoPrueba,
        Math.abs(predecir(vehiculo, datos.model).price - pruebas.testExpected[posicion]),
      );
    });
    pruebas.invalid.forEach(({ vehicle: vehiculo, field: campo, message: mensaje }) => {
      const resultado = validarVehiculo(vehiculo, opciones);
      if (resultado.errors[campo] !== mensaje)
        throw Error(campo + ": " + resultado.errors[campo] + " ≠ " + mensaje);
    });
    return {
      maxError: errorMaximo,
      maxTestError: errorMaximoPrueba,
      boundary: pruebas.boundary.map((caso) => predecir(caso.vehicle, caso.model)),
      alternatives: pruebas.alternatives.map((caso) =>
        caso.vehicles.map(
          (vehiculo) => predecir(validarVehiculo(vehiculo, opciones).vehicle, caso.model).price,
        ),
      ),
    };
  }, datosPrueba);
  verificarCercania(paridad.maxError, 0);
  verificarCercania(paridad.maxTestError, 0);
  paridad.boundary.forEach((obtenido, posicion) => {
    const esperado = datosPrueba.boundary[posicion];
    verificarCercania(obtenido.price, esperado.price);
    verificar.deepEqual(
      obtenido.neighbors.map((vecino) => vecino.index),
      esperado.indices,
    );
    obtenido.neighbors.forEach((vecino, indice) => {
      verificarCercania(vecino.distance, esperado.distances[indice], 1e-12);
      verificarCercania(vecino.weight, esperado.weights[indice], 1e-12);
    });
  });
  paridad.alternatives.forEach((precios, posicion) =>
    precios.forEach((valor, indice) =>
      verificarCercania(valor, datosPrueba.alternatives[posicion].expected[indice]),
    ),
  );
  console.log(
    "Paridad Python–JavaScript:",
    JSON.stringify({
      valid: datosPrueba.vehicles.length,
      test: datosPrueba.testVehicles.length,
      invalid: datosPrueba.invalid.length,
      boundaries: datosPrueba.boundary.length,
      maxError: paridad.maxError,
      maxTestError: paridad.maxTestError,
    }),
  );

  // Comprobamos que los enlaces lleven el foco sin abrir pestañas
  await pagina.keyboard.press("Tab");
  verificar.equal(
    await pagina.locator(".skip").evaluate((elemento) => elemento === document.activeElement),
    true,
  );
  await pagina.keyboard.press("Enter");
  verificar.equal(await pagina.evaluate(() => document.activeElement.id), "h-problema");
  const ids = await pagina
    .locator("main > section")
    .evaluateAll((elementos) => elementos.map((vecino) => vecino.id));
  for (const [posicion, identificador] of ids.entries()) {
    await pagina.locator("#route-menu > summary").click();
    await pagina.locator('#route-links a[href="#' + identificador + '"]').click();
    verificar.equal(await pagina.locator("#route-menu").getAttribute("open"), null);
    verificar.equal(
      await pagina.evaluate(() => document.activeElement.id),
      identificador === "portada" ? "titulo" : "h-" + identificador,
    );
    verificar.ok(
      await pagina
        .locator("#" + identificador)
        .evaluate((elemento) => elemento.getBoundingClientRect().top >= 63),
    );
    await pagina.screenshot({
      path: rutas.join(
        carpetaCapturas,
        `desktop-${String(posicion + 1).padStart(2, "0")}-${identificador}.png`,
      ),
    });
  }
  verificar.equal(contexto.pages().length, 1);
  await pagina.locator("#route-menu > summary").click();
  await pagina.keyboard.press("Escape");
  verificar.equal(await pagina.locator("#route-menu").getAttribute("open"), null);
  verificar.equal(
    await pagina.evaluate(() => document.activeElement.parentElement.id),
    "route-menu",
  );
  await pagina.locator("#conclusiones .section-pager a").first().click();
  verificar.equal(await pagina.evaluate(() => document.activeElement.id), "h-estimador");
  await pagina.locator("#estimador .section-pager a").last().click();
  verificar.equal(await pagina.evaluate(() => document.activeElement.id), "h-conclusiones");

  // Probamos todos los selectores y controles de vecinos
  for (const [identificador, valores] of Object.entries({
    "transform-choice": ["engine", "km", "doors"],
    "relation-choice": ["car_year", "km", "power_hp"],
    "fold-choice": ["1", "2", "3", "4", "5"],
    "metric-choice": ["MAE_test", "RMSE_test", "R2_test"],
    "case-choice": ["0", "1", "2"],
    "segment-choice": ["nivel_precio", "antiguedad", "brand"],
  }))
    for (const valor of valores) await pagina.locator("#" + identificador).selectOption(valor);
  verificar.match(
    await pagina.locator("#metric-copy").textContent(),
    /No es un porcentaje de aciertos/,
  );
  for (let posicion = 0; posicion < datosPrueba.model.k; posicion++)
    await pagina.locator("#reveal-neighbor").click();
  verificar.equal(await pagina.locator("#neighbor-demo tbody tr").count(), datosPrueba.model.k);
  verificar.equal(await pagina.locator("#reveal-neighbor").isDisabled(), true);
  await pagina.locator("#reset-neighbors").click();
  verificar.equal(await pagina.locator("#neighbor-demo tbody tr").count(), 0);
  for (const identificador of ["distribucion", "relaciones"]) {
    const detalle = pagina.locator("#" + identificador + " .notebook-figures");
    await detalle.locator("summary").click();
    for (const imagen of await detalle.locator("img").all()) {
      await imagen.evaluate((elemento) => elemento.decode());
      verificar.equal(
        await imagen.evaluate((elemento) => elemento.complete && elemento.naturalWidth > 0),
        true,
      );
    }
    await detalle.locator("summary").click();
  }
  const formatearPrecio = (valor) =>
    "USD " +
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  const enviarFicha = () => pagina.locator('#vehicle-form button[type="submit"]').click();
  const cargarEjemplo = async (posicion = "0") => {
    await pagina.locator("#example-choice").selectOption(posicion);
  };
  const verificarEstimacionVacia = async () => {
    verificar.equal(await pagina.locator("#estimate").textContent(), "USD ·");
    verificar.equal(await pagina.locator("#estimate-explanation").isVisible(), false);
    verificar.equal(await pagina.locator("#explanation").textContent(), "");
  };
  // Completamos una ficha a mano sin los cinco opcionales
  await pagina.locator("#brand").selectOption("Volkswagen");
  await pagina.locator("#model").selectOption("Up!");
  await pagina.locator("#car_year").fill("2014");
  await pagina.locator("#km").fill("108000");
  await pagina.locator("#fuel_type").selectOption("Nafta");
  await pagina.locator("#transmission").selectOption("Manual");
  await enviarFicha();
  verificar.equal(await pagina.locator("#estimate").textContent(), "USD 7.927,05");
  verificar.match(await pagina.locator("#estimate-caption").textContent(), /Opcionales imputados/);
  await pagina.locator("#estimate-explanation > summary").click();
  verificar.equal(await pagina.locator("#explanation tbody tr").count(), 5);
  await pagina.screenshot({
    path: rutas.join(carpetaCapturas, "desktop-resultado.png"),
  });
  // Los dos eventos del formulario deben borrar la estimacion
  const campos = await pagina
    .locator(
      "#required-fields input, #required-fields select, #optional-fields input, #optional-fields select",
    )
    .evaluateAll((elementos) => elementos.map((vecino) => vecino.id));
  for (const tipoEvento of ["input", "change"])
    for (const identificador of campos) {
      await cargarEjemplo();
      await enviarFicha();
      await pagina.locator("#" + identificador).evaluate((elemento, tipo) => {
        if (elemento.tagName === "SELECT")
          elemento.selectedIndex = elemento.options.length > 2 ? 2 : 0;
        else elemento.value = String(Number(elemento.value) + 1);
        elemento.dispatchEvent(
          new Event(tipo, {
            bubbles: true,
          }),
        );
      }, tipoEvento);
      await verificarEstimacionVacia();
    }
  for (const posicion of ["0", "1", "2", ""]) {
    await cargarEjemplo(posicion);
    await verificarEstimacionVacia();
    if (posicion !== "") {
      await enviarFicha();
      verificar.equal(
        await pagina.locator("#estimate").textContent(),
        formatearPrecio(datosPrueba.samples[Number(posicion)].price),
      );
    }
  }
  await cargarEjemplo("1");
  await enviarFicha();
  await pagina.locator("#brand").selectOption("Ford");
  await verificarEstimacionVacia();
  verificar.equal(await pagina.locator("#model").inputValue(), "");
  verificar.ok((await pagina.locator("#model option").allTextContents()).includes("Ka"));
  // Una ficha vacia lleva el foco al primer campo obligatorio
  await pagina.locator('#vehicle-form button[type="reset"]').click();
  await verificarEstimacionVacia();
  await enviarFicha();
  verificar.equal(await pagina.evaluate(() => document.activeElement.id), "brand");
  verificar.match(await pagina.locator("#error-brand").textContent(), /Completá/);
  await cargarEjemplo();
  await pagina.locator("#km").fill("-1");
  await enviarFicha();
  await verificarEstimacionVacia();
  verificar.equal(await pagina.evaluate(() => document.activeElement.id), "km");
  verificar.match(await pagina.locator("#error-km").textContent(), /entre/);
  await cargarEjemplo();
  await pagina.locator("#doors").evaluate((elemento) => {
    elemento.value = "4.5";
    elemento.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );
  });
  await enviarFicha();
  await verificarEstimacionVacia();
  verificar.equal(await pagina.locator("#optional-details").getAttribute("open"), "");
  verificar.equal(await pagina.evaluate(() => document.activeElement.id), "doors");
  verificar.match(await pagina.locator("#error-doors").textContent(), /entero/);
  await pagina.screenshot({
    path: rutas.join(carpetaCapturas, "desktop-error-opcional.png"),
  });
  await cargarEjemplo();
  await pagina.locator("#km").fill("");
  await pagina.locator("#km").pressSequentially("-");
  await enviarFicha();
  verificar.match(await pagina.locator("#error-km").textContent(), /número/);
  await pagina.locator('#vehicle-form button[type="reset"]').click();
  verificar.equal(await pagina.locator("#model").isDisabled(), true);
  verificar.equal(await pagina.locator("#optional-details").getAttribute("open"), null);
  verificar.equal(await pagina.locator('[aria-invalid="true"]').count(), 0);
  await pagina.locator(".estimator-guide").evaluate((elemento) =>
    elemento.scrollIntoView({
      block: "start",
    }),
  );
  await pagina.screenshot({
    path: rutas.join(carpetaCapturas, "desktop-explicacion.png"),
  });
  await pagina.locator(".estimator-guide summary").click();
  await pagina.locator("#real-code").evaluate((elemento) =>
    elemento.scrollIntoView({
      block: "center",
    }),
  );
  await pagina.screenshot({
    path: rutas.join(carpetaCapturas, "desktop-codigo.png"),
  });
  await pagina.locator(".estimator-guide summary").click();

  // Probamos la misma pagina en pantallas mas angostas
  for (const ancho of [390, 320]) {
    await pagina.setViewportSize({
      width: ancho,
      height: 844,
    });
    for (const [posicion, identificador] of ids.entries()) {
      await pagina.locator("#" + identificador).evaluate((elemento) =>
        elemento.scrollIntoView({
          block: "start",
        }),
      );
      verificar.equal(
        await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        identificador + " desborda a " + ancho,
      );
      await pagina.evaluate(
        () =>
          new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver))),
      );
      if (ancho === 390)
        await pagina.screenshot({
          path: rutas.join(
            carpetaCapturas,
            `mobile-${String(posicion + 1).padStart(2, "0")}-${identificador}.png`,
          ),
        });
    }
    await cargarEjemplo("1");
    await enviarFicha();
    verificar.equal(
      await pagina.locator("#estimate").textContent(),
      formatearPrecio(datosPrueba.samples[1].price),
    );
    await pagina.locator(".estimator-guide").evaluate((elemento) =>
      elemento.scrollIntoView({
        block: "start",
      }),
    );
    await pagina.screenshot({
      path: rutas.join(carpetaCapturas, `mobile-${ancho}-explicacion.png`),
    });
    verificar.equal(
      await pagina.evaluate(
        () => getComputedStyle(document.querySelector(".animate")).animationName,
      ),
      "none",
    );
  }
  const contextoMovil = await navegador.newContext({
    viewport: {
      width: 390,
      height: 844,
    },
    isMobile: true,
    hasTouch: true,
    offline: true,
    reducedMotion: "reduce",
  });
  const paginaMovil = await contextoMovil.newPage();
  paginaMovil.on("pageerror", (error) => errores.push(String(error)));
  paginaMovil.on("request", (solicitud) => {
    if (/^https?:/.test(solicitud.url())) solicitudes.push(solicitud.url());
  });
  await paginaMovil.goto(direccion);
  await paginaMovil.locator("#route-menu > summary").tap();
  await paginaMovil.locator('#route-links a[href="#estimador"]').tap();
  verificar.equal(await paginaMovil.evaluate(() => document.activeElement.id), "h-estimador");
  verificar.equal(await paginaMovil.locator(".estimator-guide").isVisible(), true);
  await paginaMovil.locator("#example-choice").selectOption("1");
  await paginaMovil.locator('#vehicle-form button[type="submit"]').tap();
  verificar.equal(
    await paginaMovil.locator("#estimate").textContent(),
    formatearPrecio(datosPrueba.samples[1].price),
  );
  await paginaMovil.locator('#vehicle-form button[type="reset"]').tap();
  verificar.equal(await paginaMovil.locator("#estimate").textContent(), "USD ·");
  await paginaMovil.locator("#estimador").evaluate((elemento) =>
    elemento.scrollIntoView({
      block: "start",
    }),
  );
  await paginaMovil.screenshot({
    path: rutas.join(carpetaCapturas, "mobile-touch-formulario.png"),
  });
  await contextoMovil.close();

  // La explicacion debe reflejar los parametros exportados
  const rutaVariante = rutas.join(carpetaCapturas, "modelo-variante.html");
  const original = archivos.readFileSync(
    rutas.resolve(__dirname, "../presentacion/presentacion.html"),
    "utf8",
  );
  const coincidencia = original.match(
    /(<script type="application\/json" id="data">)([\s\S]*?)(<\/script>)/,
  );
  const datosVariante = JSON.parse(coincidencia[2]);
  datosVariante.model.k = 15;
  datosVariante.model.weights = "uniform";
  archivos.writeFileSync(
    rutaVariante,
    original.replace(
      coincidencia[0],
      coincidencia[1] + JSON.stringify(datosVariante).replace(/</g, "\\u003c") + coincidencia[3],
    ),
  );
  const paginaVariante = await contexto.newPage();
  paginaVariante.on("pageerror", (error) => errores.push(String(error)));
  await paginaVariante.goto(rutaAUrl(rutaVariante).href);
  verificar.match(
    await paginaVariante.locator("#estimator-model").textContent(),
    /15 vecinos y peso uniforme/,
  );
  verificar.match(await paginaVariante.locator("#estimator-process").textContent(), /mismo peso/);
  await paginaVariante.close();
  await pagina.locator("details:not(#route-menu)").evaluateAll((elementos) =>
    elementos.forEach((elemento) => {
      elemento.open = true;
    }),
  );
  verificar.equal(
    await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  const figuraDesplazable = pagina.locator(".figure-scroll").first();
  await figuraDesplazable.focus();
  await pagina.keyboard.press("ArrowRight");
  await pagina.waitForFunction(() => document.querySelector(".figure-scroll").scrollLeft > 0);
  await figuraDesplazable.evaluate((elemento) =>
    elemento.scrollIntoView({
      block: "center",
    }),
  );
  await pagina.screenshot({
    path: rutas.join(carpetaCapturas, "mobile-evidencia-desplazable.png"),
  });
  await pagina.locator("details:not(#route-menu)").evaluateAll((elementos) =>
    elementos.forEach((elemento) => {
      elemento.open = false;
    }),
  );
  await pagina.emulateMedia({
    reducedMotion: "no-preference",
  });
  await pagina.locator("#metric-choice").selectOption("MAE_test");
  verificar.equal(
    await pagina
      .locator(".bar-row")
      .first()
      .evaluate((elemento) => getComputedStyle(elemento).animationName),
    "arrive",
  );
  await pagina.setViewportSize({
    width: 1440,
    height: 900,
  });
  // Aumentamos el texto para comprobar que la pagina no desborde
  await pagina.addStyleTag({
    content: "html { font-size: 200%; }",
  });
  verificar.equal(
    await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  verificar.deepEqual(errores, []);
  verificar.deepEqual(solicitudes, []);
  console.log(
    "HTML real file:// sin red: 13 secciones, escritorio, 390/320 px, formulario, foco, controles y movimiento reducido OK.",
  );
  console.log("Errores JS: 0. Solicitudes HTTP: 0. Capturas:", carpetaCapturas);
  await navegador.close();
}
probar().catch((error) => {
  console.error(error);
  process.exit(1);
});
