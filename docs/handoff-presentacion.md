# Handoff de la presentación para la defensa

Rama de trabajo: `codex/presentacion-defensa`. No se integró ni modificó `main` ni `codex/autos-meli-arg`. Se trabajó desde una copia separada; no se usaron cambios de la otra sesión.

- **SHA base exacto:** `1b05003f3ece1fde18c8bd218a4cc78cb212278c`.
- **SHA final de implementación y pruebas:** `77801cf94c484ac1bd49e5bdf5a0fcd9029d58d8`. El commit posterior de cierre modifica únicamente este handoff para registrar el SHA ya verificado; el código y el HTML son los de esta referencia.
- **Checkout local permanente:** `/Users/facu.rodrii/Documents/03 Notas/01 Facultad/Python para Ciencia de Datos/TP/presentacion-defensa`. Se creó primero en `/private/tmp/` y se trasladó con `git worktree move` después de verificarlo.
- La herramienta `create_worktree` se intentó dos veces y no devolvió resultado. Se comprobó que no había creado un checkout y se usó `git worktree add -b codex/presentacion-defensa` desde el SHA base. El checkout original estaba limpio al comenzar y se preservó. No se cambiaron configuraciones de seguridad.

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `presentacion/layout.html.in` | Explicación inicial, detalles técnicos, acceso a figuras del notebook, recorrido y limpieza de ficha. |
| `presentacion/estilos.css` | Navegación persistente, explicación legible, formulario móvil, figuras desplazables, foco y movimiento reducido. |
| `presentacion/app.js` | Explicación desde parámetros, navegación con foco, validación al enviar, invalidación del resultado por input/change, reinicio y tablas accesibles. |
| `presentacion/exportar.py` | Fragmento Python real, imágenes incluidas en el HTML, agregación por marca, fichas fijadas por ID y `--modelo` para leer un modelo temporal. |
| `presentacion/presentacion.html` | Regenerado mediante el exportador; es autónomo. |
| `presentacion/README.md` | Uso, regeneración y procedimiento de pruebas. |
| `presentacion/guion.md` | Relato de seis integrantes, 19 min más preguntas, cifras, límites y control de reproducción pendiente. |
| `docs/demostracion-presentacion.md` | Demostración reproducible y preguntas frecuentes. |
| `tests/preparar_modelo_presentacion.py` | Reconstrucción temporal del modelo y comparación con los CSV sin escribir en resultados. |
| `tests/test_presentacion_defensa.py` | Referencias Python de fichas, inválidos, modelos alternativos, coincidencias y empates. |
| `tests/presentacion_defensa.cjs` | Prueba del HTML real en navegador sin red, interacciones y capturas. |
| `docs/handoff-presentacion.md` | Evidencia, pendientes y cierre de esta rama. |

Permanecen sin cambios `src/autos.py`, `estimar.py`, `TP_autos.ipynb`, `requirements.txt`, los CSV originales, `resultados/` y `presentacion/modelo.js`. El objeto `model` del JSON exportado es **idéntico** al de la presentación base, incluidos vectores, medianas, medias, escalas, categorías, precios, k y pesos. También se conservaron `options`, `neighbors` y las tres fichas originales. Las diferencias numéricas menores en la lectura/serialización de CSV son del orden de 10⁻¹² y no cambian los valores mostrados. Se agregaron tres campos informativos: `implementation`, `edaImages` y `brandSummary`; no se cambió el significado de los campos existentes.

## Mejoras y problemas corregidos

La explicación debajo del estimador aparece antes de completar la ficha. Explica entrada y salida, selección por CV, imputación, escalado, one-hot, vecinos, pesos y límites del precio histórico. El número de vecinos y tipo de peso se leen del modelo exportado. El detalle técnico muestra parámetros reales y el método `src/autos.py · VecinosRegresor.predict`, extraído con `inspect.getsource`; no se inventó pseudocódigo.

Se encontró un fallo al salir de un campo inválido: el error insertado durante `focusout` podía desplazar el botón entre presionar y soltar el mouse, perdiendo el envío. La validación ahora ocurre al enviar. Los errores llevan el foco al primer control inválido y abren los opcionales cuando corresponde. Cualquier edición, incluidos eventos solo `change`, cambio de ficha o limpieza elimina precio y detalle anteriores. Marca reinicia modelo. El botón de limpieza devuelve el foco a marca.

El recorrido permite saltar a las trece secciones y avanzar/retroceder; los enlaces internos desplazan y enfocan el título sin abrir pestañas. Escape cierra el menú. Se mejoraron el espacio y los rótulos de gráficos, la precisión visible de R² y la lectura del formulario en móvil. Las figuras originales de boxplots, correlaciones y medianas por marca están incluidas, con desplazamiento horizontal por teclado en pantallas pequeñas. La tabla por marca da también los tamaños de muestra. Se explicitan la separación por grupos, la referencia de antigüedad a 2024 y las mejoras propuestas aún no medidas.

## Problemas de Python para integrar

### 1. Validación cruzada no reproducida exactamente

Con Python **3.12.14**, macOS ARM64 y las versiones fijadas en `requirements.txt` (NumPy 2.4.5, pandas 3.0.3, SciPy 1.17.1, scikit-learn 1.8.0), ejecutando `cargar → limpiar → separar → seleccionar → evaluar` desde esta base:

| Modelo | MAE CV guardado (USD) | MAE CV local (USD) |
| --- | ---: | ---: |
| Mediana | 4.603,684244415052 | 4.614,446121422654 |
| Lineal | 1.954,966906178549 | 1.989,981588783442 |
| k-NN | 1.504,653886612269 | 1.547,580973809803 |

Se mantuvieron ganador y parámetros (`k=5`, `weights=distance`), IDs de test y sus **831 predicciones**. También coincidieron las métricas de test de las tres familias con tolerancia absoluta de USD 10⁻⁸. El modelo final exportado es idéntico al JSON base.

Como contraste de solo lectura, el entorno local existente (NumPy 2.5.4, pandas 3.1.0, SciPy 1.18.1, scikit-learn 1.9.1) produjo MAE CV de 4.601,021681370910; 1.959,829611401228; y 1.509,558485219161. Tampoco reprodujo los CSV. **No se atribuyó una causa definitiva** ni se corrigió código fuera del alcance. Conviene revisar el reparto de grupos de igual tamaño y conservar IDs de ajuste/validación por fold, además de tamaños y semilla, para poder comparar exactamente las particiones entre entornos. El reparto actual no guarda esos IDs.

El HTML y el guion conservan las cifras de los archivos disponibles y explican la diferencia. Antes de cerrar la entrega, la revisión de Python debe conciliar las particiones/entorno, actualizar resultados si corresponde y regenerar. No presentar la CV como reproducida de forma exacta mientras siga pendiente.

### 2. Fichas elegidas con kilometrajes empatados

`src/autos.py · ejemplos` ordena por kilómetros sin un segundo criterio estable. La reproducción local sustituyó Peugeot 307 (`MLA1402454175`) por Peugeot 408 (`MLA1652377178`), ambos con 120.000 km, y Volkswagen Up! (`MLA1546276856`) por Gol Trend (`MLA1652605660`), ambos con 108.000 km. El Focus III se mantuvo. Esto cambia los ejemplos al ensayar, aunque no el modelo.

**Resuelto dentro de la presentación:** `demo_examples` selecciona los tres IDs originales desde `saved['train']`. No se copiaron valores inventados ni se escribió en `src/autos.py`. Si una futura partición deja afuera un ID, el exportador falla con un mensaje para revisarlo. Al integrar se puede decidir si fijar ejemplos de toda la entrega por ID o usar un desempate explícito también en Python. Regenerar el notebook podría seguir mostrando fichas distintas hasta conciliar este punto.

### 3. Límites conservados

Deduplicar el ID que dice Ka en el modelo y Focus III en el título no resuelve esa contradicción. El formulario admite solo el catálogo de entrenamiento, pero eso no garantiza que toda combinación tenga buena cobertura. El precio final de venta, el estado e historial y los precios actuales no están disponibles. El MAE no es un intervalo de confianza. No se agregaron intervalos ni mejoras sin evaluar.

## Pruebas realizadas

- Reconstrucción independiente en un entorno temporal con las dependencias fijadas; no se ejecutó ni modificó el notebook. Se verificó la huella del CSV, 4.044 filas limpias, ganador y parámetros, IDs y predicciones de test y métricas de las tres familias. El informe de CV se genera con el procedimiento de abajo.
- **887 fichas válidas** contra Python: incluyen 51 registros muestreados de entrenamiento antes de filtrar los admitidos, fichas válidas del test, las 32 máscaras de los cinco opcionales y la demo manual. El conjunto final tiene 887 fichas; no todos los registros internos de test son aceptables como entrada del formulario porque algunos carecen de obligatorios o tienen categorías no vistas.
- **831 predicciones internas de test** contra el Pipeline. En Chromium, la diferencia máxima observada fue **USD 0** tanto para esas predicciones como para las 887 fichas válidas; tolerancia exigida USD 10⁻⁸.
- **24 inválidos**: obligatorios vacíos, categoría desconocida, marca–modelo incompatible, rangos, enteros fraccionarios, kilómetros negativos, año 2025, notación exponencial, coma en la función de validación directa, NaN e infinito. Mensajes y rechazo coinciden con `ficha` de Python. El campo numérico del navegador puede adaptar la notación decimal local antes de pasar su valor normalizado a esa función.
- Cuatro escenarios sintéticos del **regresor real**: coincidencias exactas y empates en el límite de k, con pesos uniformes y por distancia. Coincidieron índices, distancias, pesos y precio. Se contrastaron además las rutas de exportación y predicción de mediana y regresión lineal (33 fichas cada una).
- HTML real por **`file://`**, con **red desactivada** antes de abrir. Chromium en macOS; 1440 × 900, 390 × 844 y 320 × 844. Emulación móvil adicional con `isMobile` y `hasTouch`: menú, navegación con foco, selección, envío y limpieza mediante toque.
- Se recorrieron las trece secciones y revisaron capturas de escritorio y móvil. Se probaron todos los selectores, revelación/reinicio de vecinos, fichas, todos los campos con eventos `input` y `change`, errores de obligatorios/opcionales y entrada numérica incompleta, limpieza, enlaces internos, Tab/Enter/Escape, foco y movimiento reducido/habilitado. Las figuras detalladas abren y se desplazan con teclado. Sin desborde del documento, incluso con los detalles abiertos; comprobación adicional con fuente al 200 %.
- Una copia temporal con `k=15` y `weights=uniform` mostró esos parámetros y la regla correcta en la explicación inicial. La copia no forma parte de la entrega.
- **0 errores de JavaScript y 0 solicitudes HTTP**. Las imágenes están incorporadas como datos locales. Se revisó que métricas y ejemplos coincidan con las fuentes disponibles y que R² no se describa como porcentaje de aciertos.
- `git diff --check` pasó. Se comprobó ausencia de cambios en los archivos protegidos. El HTML incluye las fuentes actuales, no parches exclusivos del generado.

No se comprobó un teléfono físico, Windows/Python 3.11 ni todos los navegadores. La vista previa de un gestor de archivos móvil puede bloquear JavaScript; abrir el archivo descargado en un navegador. La verificación en Obsidian no formó parte de este encargo: la entrega es la presentación autónoma del repositorio.

## Regeneración y repetición

Si el notebook ya dejó su modelo local:

```sh
python -m presentacion.exportar
```

Para revisar conservando notebook y resultados, crear un entorno temporal con `requirements.txt` y ejecutar desde la raíz:

```sh
python tests/preparar_modelo_presentacion.py --salida /tmp/autos-defensa/modelo.joblib
python -m presentacion.exportar --modelo /tmp/autos-defensa/modelo.joblib
python tests/test_presentacion_defensa.py --modelo /tmp/autos-defensa/modelo.joblib --salida /tmp/autos-defensa/fixtures.json
PLAYWRIGHT_MODULE=/ruta/node_modules/playwright CHROMIUM_EXECUTABLE=/ruta/chromium \
  node tests/presentacion_defensa.cjs /tmp/autos-defensa/fixtures.json /tmp/autos-defensa/capturas
```

El primer comando guarda el informe `modelo.validacion.json` junto al modelo temporal. Las dependencias Node del verificador se usan desde un entorno separado: el HTML no necesita instalarlas. En Windows, adaptar las rutas temporales y las variables de entorno.

El HTML final tiene SHA-256 `f3dd3e35d255b2c80ea0900fd8838fe65230fea2ff46916841d0a8459982dbdf`; una regeneración independiente produjo los mismos bytes. Tras trasladar el worktree se volvió a abrir por `file://` desde la ruta permanente con espacios: demo Up! y navegación con foco correctas, sin errores.

En esta sesión se usaron `/private/tmp/tp-autos-presentacion-env/bin/python`, `/private/tmp/tp-autos-presentacion-pruebas/` y el Chromium disponible en la caché local. Esos archivos temporales y el modelo no se incluyeron en Git. Para abrir ahora, usar el archivo de este checkout `presentacion/presentacion.html`; también se puede descargar el HTML de la rama y abrirlo localmente.
