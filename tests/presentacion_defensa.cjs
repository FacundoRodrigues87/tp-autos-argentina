/* HTML real, file:// y sin red. Requiere Playwright instalado fuera del proyecto.
   PLAYWRIGHT_MODULE=/ruta/playwright CHROMIUM_EXECUTABLE=/ruta/chromium \
   node tests/presentacion_defensa.cjs /tmp/defensa.json /tmp/capturas-defensa
*/
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixtures = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const artifacts = process.argv[3] || '/tmp/capturas-defensa';
fs.mkdirSync(artifacts, {recursive: true});
const url = pathToFileURL(path.resolve(__dirname, '../presentacion/presentacion.html')).href;
const close = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≠ ${b}`);

async function main() {
  const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : {})});
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, offline: true, reducedMotion: 'reduce'});
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', req => { if (/^https?:/.test(req.url())) requests.push(req.url()); });
  await page.goto(url);
  await page.locator('#histogram svg').waitFor();
  assert.equal(await page.locator('main > section').count(), 13);
  assert.ok(await page.locator('#estimator-model').textContent());
  assert.equal(await page.locator('#estimate-explanation').isVisible(), false);
  assert.equal(await page.locator('#real-code').textContent(), fixtures.implementation);
  assert.match(await page.locator('#estimator-model').textContent(), /5 vecinos/);
  assert.equal(await page.locator('#model').isDisabled(), true);
  const parity = await page.evaluate(f => {
    let maxError = 0, maxTestError = 0;
    f.vehicles.forEach((v, i) => {
      const checked = validarVehiculo(v, options);
      if (Object.keys(checked.errors).length) throw Error(JSON.stringify(checked.errors));
      maxError = Math.max(maxError, Math.abs(predecir(checked.vehicle, data.model).price - f.expected[i]));
    });
    f.testVehicles.forEach((v, i) => {
      maxTestError = Math.max(maxTestError, Math.abs(predecir(v, data.model).price - f.testExpected[i]));
    });
    f.invalid.forEach(({vehicle, field, message}) => {
      const result = validarVehiculo(vehicle, options);
      if (result.errors[field] !== message) throw Error(field + ': ' + result.errors[field] + ' ≠ ' + message);
    });
    return {maxError, maxTestError,
      boundary: f.boundary.map(item => predecir(item.vehicle, item.model)),
      alternatives: f.alternatives.map(item => item.vehicles.map(v => predecir(validarVehiculo(v, options).vehicle, item.model).price))};
  }, fixtures);
  close(parity.maxError, 0);
  close(parity.maxTestError, 0);
  parity.boundary.forEach((actual, i) => {
    const expected = fixtures.boundary[i];
    close(actual.price, expected.price);
    assert.deepEqual(actual.neighbors.map(n => n.index), expected.indices);
    actual.neighbors.forEach((n, j) => { close(n.distance, expected.distances[j], 1e-12); close(n.weight, expected.weights[j], 1e-12); });
  });
  parity.alternatives.forEach((prices, i) => prices.forEach((value, j) => close(value, fixtures.alternatives[i].expected[j])));
  console.log('Paridad Python–JavaScript:', JSON.stringify({valid: fixtures.vehicles.length, test: fixtures.testVehicles.length,
    invalid: fixtures.invalid.length, boundaries: fixtures.boundary.length, maxError: parity.maxError, maxTestError: parity.maxTestError}));

  // Skip link and all routes must transfer focus, without opening tabs.
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'h-problema');
  const ids = await page.locator('main > section').evaluateAll(nodes => nodes.map(n => n.id));
  for (const [i, id] of ids.entries()) {
    await page.locator('#route-menu > summary').click();
    await page.locator('#route-links a[href="#' + id + '"]').click();
    assert.equal(await page.locator('#route-menu').getAttribute('open'), null);
    assert.equal(await page.evaluate(() => document.activeElement.id), id === 'portada' ? 'titulo' : 'h-' + id);
    assert.ok(await page.locator('#' + id).evaluate(el => el.getBoundingClientRect().top >= 63));
    await page.screenshot({path: path.join(artifacts, `desktop-${String(i + 1).padStart(2, '0')}-${id}.png`)});
  }
  assert.equal(context.pages().length, 1);
  await page.locator('#route-menu > summary').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#route-menu').getAttribute('open'), null);
  assert.equal(await page.evaluate(() => document.activeElement.parentElement.id), 'route-menu');
  await page.locator('#conclusiones .section-pager a').first().click();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'h-estimador');
  await page.locator('#estimador .section-pager a').last().click();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'h-conclusiones');

  // Every existing selector and neighbor control.
  for (const [id, values] of Object.entries({
    'transform-choice': ['engine', 'km', 'doors'], 'relation-choice': ['car_year', 'km', 'power_hp'],
    'fold-choice': ['1', '2', '3', '4', '5'], 'metric-choice': ['MAE_test', 'RMSE_test', 'R2_test'],
    'case-choice': ['0', '1', '2'], 'segment-choice': ['nivel_precio', 'antiguedad', 'brand'],
  })) for (const value of values) await page.locator('#' + id).selectOption(value);
  assert.match(await page.locator('#metric-copy').textContent(), /No es un porcentaje de aciertos/);
  for (let i = 0; i < fixtures.model.k; i++) await page.locator('#reveal-neighbor').click();
  assert.equal(await page.locator('#neighbor-demo tbody tr').count(), fixtures.model.k);
  assert.equal(await page.locator('#reveal-neighbor').isDisabled(), true);
  await page.locator('#reset-neighbors').click();
  assert.equal(await page.locator('#neighbor-demo tbody tr').count(), 0);
  for (const id of ['distribucion', 'relaciones']) {
    const detail = page.locator('#' + id + ' .notebook-figures');
    await detail.locator('summary').click();
    for (const img of await detail.locator('img').all()) { await img.evaluate(el => el.decode()); assert.equal(await img.evaluate(el => el.complete && el.naturalWidth > 0), true); }
    await detail.locator('summary').click();
  }

  const money = value => 'USD ' + new Intl.NumberFormat('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  const submit = () => page.locator('#vehicle-form button[type="submit"]').click();
  const example = async (index = '0') => { await page.locator('#example-choice').selectOption(index); };
  const cleared = async () => {
    assert.equal(await page.locator('#estimate').textContent(), 'USD ·');
    assert.equal(await page.locator('#estimate-explanation').isVisible(), false);
    assert.equal(await page.locator('#explanation').textContent(), '');
  };
  // Manual demo, all five optional inputs omitted.
  await page.locator('#brand').selectOption('Volkswagen');
  await page.locator('#model').selectOption('Up!');
  await page.locator('#car_year').fill('2014');
  await page.locator('#km').fill('108000');
  await page.locator('#fuel_type').selectOption('Nafta');
  await page.locator('#transmission').selectOption('Manual');
  await submit();
  assert.equal(await page.locator('#estimate').textContent(), 'USD 7.927,05');
  assert.match(await page.locator('#estimate-caption').textContent(), /Opcionales imputados/);
  await page.locator('#estimate-explanation > summary').click();
  assert.equal(await page.locator('#explanation tbody tr').count(), 5);
  await page.screenshot({path: path.join(artifacts, 'desktop-resultado.png')});
  // Both input and change events invalidate results, even for select-only updates.
  const fields = await page.locator('#required-fields input, #required-fields select, #optional-fields input, #optional-fields select').evaluateAll(nodes => nodes.map(n => n.id));
  for (const eventType of ['input', 'change']) for (const id of fields) {
    await example(); await submit();
    await page.locator('#' + id).evaluate((el, type) => {
      if (el.tagName === 'SELECT') el.selectedIndex = el.options.length > 2 ? 2 : 0;
      else el.value = String(Number(el.value) + 1);
      el.dispatchEvent(new Event(type, {bubbles: true}));
    }, eventType);
    await cleared();
  }
  for (const index of ['0', '1', '2', '']) { await example(index); await cleared(); if (index !== '') { await submit(); assert.equal(await page.locator('#estimate').textContent(), money(fixtures.samples[Number(index)].price)); } }
  await example('1'); await submit();
  await page.locator('#brand').selectOption('Ford');
  await cleared();
  assert.equal(await page.locator('#model').inputValue(), '');
  assert.ok((await page.locator('#model option').allTextContents()).includes('Ka'));
  // Empty required form focuses the first visible required control.
  await page.locator('#vehicle-form button[type="reset"]').click(); await cleared();
  await submit();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'brand');
  assert.match(await page.locator('#error-brand').textContent(), /Completá/);
  await example(); await page.locator('#km').fill('-1'); await submit(); await cleared();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'km');
  assert.match(await page.locator('#error-km').textContent(), /entre/);
  await example();
  await page.locator('#doors').evaluate(el => { el.value = '4.5'; el.dispatchEvent(new Event('change', {bubbles: true})); });
  await submit(); await cleared();
  assert.equal(await page.locator('#optional-details').getAttribute('open'), '');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'doors');
  assert.match(await page.locator('#error-doors').textContent(), /entero/);
  await page.screenshot({path: path.join(artifacts, 'desktop-error-opcional.png')});
  await example(); await page.locator('#km').fill(''); await page.locator('#km').pressSequentially('-'); await submit();
  assert.match(await page.locator('#error-km').textContent(), /número/);
  await page.locator('#vehicle-form button[type="reset"]').click();
  assert.equal(await page.locator('#model').isDisabled(), true);
  assert.equal(await page.locator('#optional-details').getAttribute('open'), null);
  assert.equal(await page.locator('[aria-invalid="true"]').count(), 0);
  await page.locator('.estimator-guide').evaluate(el => el.scrollIntoView({block: 'start'}));
  await page.screenshot({path: path.join(artifacts, 'desktop-explicacion.png')});
  await page.locator('.estimator-guide summary').click();
  await page.locator('#real-code').evaluate(el => el.scrollIntoView({block: 'center'}));
  await page.screenshot({path: path.join(artifacts, 'desktop-codigo.png')});
  await page.locator('.estimator-guide summary').click();

  // Responsive viewport checks use the same real offline file and controls.
  for (const width of [390, 320]) {
    await page.setViewportSize({width, height: 844});
    for (const [i, id] of ids.entries()) {
      await page.locator('#' + id).evaluate(el => el.scrollIntoView({block: 'start'}));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, id + ' desborda a ' + width);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      if (width === 390) await page.screenshot({path: path.join(artifacts, `mobile-${String(i + 1).padStart(2, '0')}-${id}.png`)});
    }
    await example('1'); await submit();
    assert.equal(await page.locator('#estimate').textContent(), money(fixtures.samples[1].price));
    await page.locator('.estimator-guide').evaluate(el => el.scrollIntoView({block: 'start'}));
    await page.screenshot({path: path.join(artifacts, `mobile-${width}-explicacion.png`)});
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.animate')).animationName), 'none');
  }
  const mobileContext = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, offline: true, reducedMotion: 'reduce'});
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', error => errors.push(String(error)));
  mobile.on('request', req => { if (/^https?:/.test(req.url())) requests.push(req.url()); });
  await mobile.goto(url);
  await mobile.locator('#route-menu > summary').tap();
  await mobile.locator('#route-links a[href="#estimador"]').tap();
  assert.equal(await mobile.evaluate(() => document.activeElement.id), 'h-estimador');
  assert.equal(await mobile.locator('.estimator-guide').isVisible(), true);
  await mobile.locator('#example-choice').selectOption('1');
  await mobile.locator('#vehicle-form button[type="submit"]').tap();
  assert.equal(await mobile.locator('#estimate').textContent(), money(fixtures.samples[1].price));
  await mobile.locator('#vehicle-form button[type="reset"]').tap();
  assert.equal(await mobile.locator('#estimate').textContent(), 'USD ·');
  await mobile.locator('#estimador').evaluate(el => el.scrollIntoView({block: 'start'}));
  await mobile.screenshot({path: path.join(artifacts, 'mobile-touch-formulario.png')});
  await mobileContext.close();

  // Verify that the explanation follows exported parameters, rather than a fixed k/weight string.
  const variantPath = path.join(artifacts, 'modelo-variante.html');
  const original = fs.readFileSync(path.resolve(__dirname, '../presentacion/presentacion.html'), 'utf8');
  const match = original.match(/(<script type="application\/json" id="data">)([\s\S]*?)(<\/script>)/);
  const variantData = JSON.parse(match[2]);
  variantData.model.k = 15;
  variantData.model.weights = 'uniform';
  fs.writeFileSync(variantPath, original.replace(match[0], match[1] + JSON.stringify(variantData).replace(/</g, '\\u003c') + match[3]));
  const variant = await context.newPage();
  variant.on('pageerror', error => errors.push(String(error)));
  await variant.goto(pathToFileURL(variantPath).href);
  assert.match(await variant.locator('#estimator-model').textContent(), /15 vecinos y peso uniforme/);
  assert.match(await variant.locator('#estimator-process').textContent(), /mismo peso/);
  await variant.close();
  await page.locator('details:not(#route-menu)').evaluateAll(nodes => nodes.forEach(el => { el.open = true; }));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const scrollFigure = page.locator('.figure-scroll').first();
  await scrollFigure.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('.figure-scroll').scrollLeft > 0);
  await scrollFigure.evaluate(el => el.scrollIntoView({block: 'center'}));
  await page.screenshot({path: path.join(artifacts, 'mobile-evidencia-desplazable.png')});
  await page.locator('details:not(#route-menu)').evaluateAll(nodes => nodes.forEach(el => { el.open = false; }));
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.locator('#metric-choice').selectOption('MAE_test');
  assert.equal(await page.locator('.bar-row').first().evaluate(el => getComputedStyle(el).animationName), 'arrive');
  await page.setViewportSize({width: 1440, height: 900});
  // Zoom equivalent through a larger default font and narrower viewport.
  await page.addStyleTag({content: 'html { font-size: 200%; }'});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log('HTML real file:// sin red: 13 secciones, escritorio, 390/320 px, formulario, foco, controles y movimiento reducido OK.');
  console.log('Errores JS: 0. Solicitudes HTTP: 0. Capturas:', artifacts);
  await browser.close();
}
main().catch(error => { console.error(error); process.exit(1); });
