# ¿Cuánto piden por un auto usado?

Trabajo práctico de Python para Ciencia de Datos · UADE.

**Integrantes** · Facundo Rodrigues, Mateo Gimenez, Lautaro Acosta, Lucas Insabralde, Matias Sevilla y Bruno Herzig.

## Entrega final

- [TP_autos.ipynb](TP_autos.ipynb) contiene la limpieza, los gráficos, la regresión lineal y los resultados de la ejecución.
- [autos.csv](autos.csv) contiene 4.047 avisos de autos usados publicados en USD y 12 columnas. Después de la limpieza quedan 4.044 avisos.

Estimamos el precio publicado en USD a partir del año de fabricación y el kilometraje. En los 831 avisos de prueba, la regresión lineal obtuvo un MAE de USD 4.479,20, frente a USD 5.502,45 de la mediana de entrenamiento. [Fuente pública de los avisos](https://www.kaggle.com/datasets/arielras/cars-publications-prices-mercadolibrearg)

## Cómo ejecutarlo

Descargá el repositorio y abrí su carpeta principal en VS Code o Jupyter. El notebook y el CSV deben estar en la misma carpeta. En el entorno de Python que vas a seleccionar como kernel, instalá las dependencias.

```sh
python -m pip install -r requirements.txt
```

Abrí `TP_autos.ipynb` y ejecutá todas las celdas en orden. La versión de entrega se verificó con Python 3.13.
