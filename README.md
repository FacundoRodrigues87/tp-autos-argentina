# ¿Qué precio le pongo a mi auto usado?

TP integrador de Python para Ciencia de Datos, UADE. Estimamos en USD el precio de publicación de un vehículo usado a partir de avisos históricos de Mercado Libre Argentina.

- [TP_autos.ipynb](TP_autos.ipynb) contiene el análisis ejecutado. El [guion](presentacion/guion.md) distribuye la exposición entre seis integrantes.
- [Alineación con la materia](docs/alineacion-materia.md), [handoff académico](docs/handoff-alineacion.md) e [integración](docs/integracion-defensa.md) documentan decisiones y verificaciones.
- [Datos y limpieza](docs/seleccion_dataset.md) documenta la procedencia y las reglas aplicadas. [Validación](docs/validacion.md) reúne los controles de entrega.

El CSV de origen contiene 10.191 avisos y 25 columnas. El recorte de usados en USD tiene 4.047 filas antes de limpiar y 4.044 después. Ganó **k-NN con 5 vecinos ponderados por distancia**. En los 831 avisos de prueba obtuvo **MAE de USD 1.499,30**, **RMSE de USD 2.735,57** y **R² de 0,9061**. Las métricas comparan la estimación con el precio pedido en la muestra histórica.

## Reproducir en Windows

Desde la carpeta del proyecto, con Python 3.12 (integración comprobada con 3.12.14):

```powershell
py -3.12 -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m ipykernel install --prefix .venv --name tp-autos --display-name "TP Autos"
.venv/Scripts/python.exe -m nbconvert --execute --to notebook --inplace --ExecutePreprocessor.kernel_name=tp-autos TP_autos.ipynb
.venv/Scripts/python.exe estimar.py --marca Volkswagen --modelo 'Up!' --anio 2014 --km 108000 --combustible Nafta --transmision Manual
.venv/Scripts/python.exe -m presentacion.exportar
```

En macOS o Linux, creá el entorno con `python3.12 -m venv .venv` y usá `.venv/bin/python` en los demás comandos. El notebook escribe las tablas, los gráficos y el modelo local en `resultados/`. Podés consultar los campos opcionales del estimador con `estimar.py --help`.

## Archivos de resultados

- `calidad.csv` registra motivos, cantidades e IDs en las reglas de auditoría.
- `particiones.json` describe la separación y los cinco folds, con sus IDs de ajuste y validación.
- `validacion_cruzada.csv` contiene las ocho configuraciones y el MAE de cada fold.
- `metricas.csv`, `catalogo_evaluacion.csv` y `errores_segmentos.csv` contienen las métricas, las predicciones individuales de prueba y sus desgloses.

## Validación cruzada integrada

Se reemplazó el reparto interno sin mezcla por GroupKFold con shuffle=True y semilla 42, manteniendo el test reservado. El nuevo MAE CV de k-NN es USD 1.536,72. El modelo elegido y las 831 predicciones de prueba se conservan. Los IDs guardados permiten detectar diferencias reales entre entornos; la discrepancia histórica no se oculta sustituyendo números en el HTML.

## Entrega y defensa

Entregar el enlace al repositorio y comprobar que el docente pueda abrirlo: actualmente es privado. Si se entrega un archivo, el notebook necesita también el código, el CSV y los metadatos del proyecto. La fuente pública y las instrucciones están en el notebook.

El guion reserva 19 minutos de exposición y 3–5 de preguntas (22–24 en total). Asignar los seis bloques a nombres reales y confirmar la excepción para seis integrantes. Todos deben poder explicar cualquier parte, no solo su bloque. Consultar la [revisión de entrega](docs/auditoria-entrega.md).
