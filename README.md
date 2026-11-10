# ¿Qué precio le pongo a mi auto usado?

TP integrador de Python para Ciencia de Datos, UADE. Estimamos en USD el precio de publicación de un vehículo usado a partir de avisos históricos de Mercado Libre Argentina.

- [TP_autos.ipynb](TP_autos.ipynb) contiene el análisis ejecutado. El [guion](presentacion/guion.md) distribuye la exposición entre seis integrantes.
- [Datos y limpieza](docs/seleccion_dataset.md) documenta la procedencia y las reglas aplicadas. [Validación](docs/validacion.md) reúne los controles de entrega.

El CSV de origen contiene 10.191 avisos y 25 columnas. El recorte de usados en USD tiene 4.047 filas antes de limpiar y 4.044 después. Ganó **k-NN con 5 vecinos ponderados por distancia**. En los 831 avisos de prueba obtuvo **MAE de USD 1.499,30**, **RMSE de USD 2.735,57** y **R² de 0,9061**. Las métricas comparan la estimación con el precio pedido en la muestra histórica.

## Reproducir en Windows

Desde la carpeta del proyecto, con Python 3.11:

```powershell
py -3.11 -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m nbconvert --execute --to notebook --inplace TP_autos.ipynb
.venv/Scripts/python.exe estimar.py --marca Volkswagen --modelo 'Up!' --anio 2014 --km 108000 --combustible Nafta --transmision Manual
.venv/Scripts/python.exe -m presentacion.exportar
```

En macOS o Linux, creá el entorno con `python3.11 -m venv .venv` y usá `.venv/bin/python` en los demás comandos. El notebook escribe las tablas, los gráficos y el modelo local en `resultados/`. Podés consultar los campos opcionales del estimador con `estimar.py --help`.

## Archivos de resultados

- `calidad.csv` registra motivos, cantidades e IDs en las reglas de auditoría.
- `particiones.json` describe la separación y los cinco folds.
- `validacion_cruzada.csv` contiene las ocho configuraciones y el MAE de cada fold.
- `metricas.csv`, `catalogo_evaluacion.csv` y `errores_segmentos.csv` contienen las métricas, las predicciones individuales de prueba y sus desgloses.
