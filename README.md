# ¿Cuánto piden por un auto usado?

Trabajo práctico de Python para Ciencia de Datos · UADE.

**Integrantes:** Facundo Rodrigues, Mateo Gimenez, Lautaro Acosta, Lucas Insabralde, Matias Sevilla y Bruno Herzig.

- [Notebook ejecutado](TP_autos.ipynb). Limpieza, gráficos, comparación de modelos, evaluación y conclusiones.
- [Dataset del TP](autos.csv). 4.047 avisos usados en USD y 16 columnas. La limpieza del notebook conserva 4.044 avisos.

El notebook compara regresión lineal y k-NN con las mismas cinco particiones del entrenamiento. Ganó **k-NN (5 vecinos, pesos por distancia)**. En los 809 avisos de prueba, su MAE fue **USD 1.406,86** frente a USD 4.630,71 de la mediana de entrenamiento. Su RMSE fue USD 2.625,82 y su R², 0,866.

## Datos

La fuente es el dataset público [Cars publications prices - MercadoLibreARG, de Ariel Rasgido](<https://www.kaggle.com/datasets/arielras/cars-publications-prices-mercadolibrearg>), versión 1, actualizado en febrero de 2024. Para obtener el recorte a partir de `MeliCarPublicactions.csv`, se conservaron las filas con `condition = Usado` y `currency = USD` y las 16 columnas listadas en el encabezado de `autos.csv`. La limpieza se aplica en el notebook. Los datos son precios pedidos históricos en USD.

## Cómo ejecutar el notebook

1. Descargá el repositorio y abrí su carpeta en VS Code o Jupyter. El notebook y el CSV deben quedar juntos.
2. En el entorno que vas a usar como kernel, instalá las dependencias con `python -m pip install -r requirements.txt` (o `python3 -m pip install -r requirements.txt` si tu sistema usa ese comando).
3. Abrí `TP_autos.ipynb`, seleccioná ese entorno como kernel y ejecutá todas las celdas en orden.

La ejecución guardada se verificó con Python 3.12 y scikit-learn 1.8.0 en macOS. En caso de empate en la distancia, la selección de vecinos puede variar entre compilaciones de scikit-learn.
