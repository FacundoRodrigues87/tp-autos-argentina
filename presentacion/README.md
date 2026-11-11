# Presentación HTML

Una vez generado el archivo local `presentacion.html`, abrilo con doble clic en un navegador. El archivo autónomo contiene las trece secciones, figuras del notebook, datos y estimador. Funciona sin conexión; el enlace externo a Kaggle requiere red. No guarda ni envía las fichas. En móvil se necesita un navegador que ejecute JavaScript local, no solo la vista previa del archivo.

**Para exponer:** [guion de seis integrantes](guion.md) · [demostración y preguntas](../docs/demostracion-presentacion.md). **Para integrar esta revisión:** [handoff](../docs/handoff-presentacion.md).

El menú **Recorrido** y los enlaces **Anterior/Siguiente** permiten moverse entre secciones. Tab y Enter operan los controles; Escape cierra el recorrido. Los enlaces internos desplazan la página y llevan el foco al título. Las tablas y las figuras grandes admiten desplazamiento con teclado. La página respeta el movimiento reducido del sistema.

El formulario distingue seis campos obligatorios y cinco opcionales. El resultado y su detalle desaparecen al modificar cualquier campo, cambiar de ficha o limpiar. Los errores se muestran al pulsar **Estimar precio** y el foco va al primer campo inválido; si es opcional se abre su panel. La explicación inicial permanece visible antes de estimar. El detalle técnico usa parámetros exportados y un fragmento real de Python.

## Regenerar

Desde la raíz del repositorio, con el entorno del proyecto:

```sh
python -m presentacion.exportar
```

Se necesita el modelo local `resultados/modelo.joblib`, generado por el notebook y excluido de Git. El exportador usa los CSV y las figuras de `resultados/`, `layout.html.in`, `estilos.css`, `modelo.js` y `app.js`. **Editar esas fuentes y regenerar**, en lugar de cambiar solo el HTML final. No hay dependencias remotas para usar la presentación.

Para revisar sin ejecutar el notebook ni escribir en `resultados/`, se incluyó una preparación específica. Crear primero un entorno temporal con `requirements.txt`, luego:

```sh
python tests/preparar_modelo_presentacion.py --salida /tmp/autos-defensa/modelo.joblib
python -m presentacion.exportar --modelo /tmp/autos-defensa/modelo.joblib
```

El primer comando verifica el ganador y las 831 predicciones de test contra los CSV. Además escribe un informe junto al modelo temporal. La integración concilió la validación cruzada: cinco folds por grupos con mezcla y semilla 42, cuyos IDs quedan guardados. MAE CV de k-NN: USD 1.536,72. El test conserva sus 831 predicciones. Ver [integración y reproducción](../docs/integracion-defensa.md). En Windows, reemplazar `/tmp/...` por una carpeta temporal propia.

El notebook y el exportador llaman a `ejemplos` para tomar las mismas tres fichas de entrenamiento por ID.

`exportar.py` reúne las tablas, los gráficos y los parámetros del modelo. `modelo.js` muestra paso por paso cómo se prepara una ficha, se buscan los vecinos y se calcula el precio. `app.js` conecta ese cálculo con el formulario y los gráficos. Con `--modelo` podés indicar la ruta al archivo de modelo.

## Repetir las comprobaciones

Generar primero las referencias en Python:

```sh
python tests/test_presentacion_defensa.py --modelo /tmp/autos-defensa/modelo.joblib --salida /tmp/autos-defensa/fixtures.json
```

Después ejecutar `tests/presentacion_defensa.cjs` con Node y Playwright disponibles en un entorno de pruebas separado. No hace falta agregarlos al proyecto ni instalarlos para usar el HTML. Si no están en la ruta habitual, indicar la ruta del módulo y la del navegador:

```sh
PLAYWRIGHT_MODULE=/ruta/node_modules/playwright CHROMIUM_EXECUTABLE=/ruta/chromium \
  node tests/presentacion_defensa.cjs /tmp/autos-defensa/fixtures.json /tmp/autos-defensa/capturas
```

La prueba abre el archivo real por `file://` con red desactivada. Contrasta predicciones, validación, empates, coincidencias exactas y las exportaciones de mediana y regresión lineal; comprueba controles, foco, estados del formulario, 1440 × 900, 390 × 844 y 320 × 844, uso táctil simulado y movimiento reducido. También prueba que la explicación cambia al variar `k` y `weights` en una copia temporal. Guarda capturas fuera del repositorio para revisión visual. No es una comprobación en un teléfono físico ni en todos los navegadores.
