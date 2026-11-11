# ¿Cuánto piden por un auto usado?

Trabajo práctico de Python para Ciencia de Datos (UADE).

**Integrantes:** Facundo Rodrigues, Mateo Gimenez, Lautaro Acosta, Lucas Insabralde, Matias Sevilla y Bruno Herzig.

Para este TP usamos avisos de Mercado Libre Argentina. Queríamos ver si con datos de la ficha de un auto, como el año, el kilometraje y la potencia, podíamos estimar el precio que pedía el vendedor.

## Datos

En [autos.csv](autos.csv) dejamos 4.047 avisos de autos usados publicados en dólares y 16 columnas del archivo original. En el notebook mostramos qué corregimos y por qué quedaron 4.044 avisos después de la limpieza. Los precios son los que figuraban en los avisos del dataset de Ariel Rasgido, actualizado en febrero de 2024. [Fuente pública en Kaggle](https://www.kaggle.com/datasets/arielras/cars-publications-prices-mercadolibrearg)

## Resultados

Probamos regresión lineal y k-NN con la misma división de datos. Nos quedamos con k-NN de 5 vecinos porque tuvo el menor error en validación. En los 809 avisos de prueba, el error absoluto promedio fue de **USD 1.406,86**. Si para todos hubiéramos estimado el mismo precio, usando la mediana del entrenamiento, el error habría sido de USD 4.630,71.

Encontramos 74 avisos de prueba con los mismos datos numéricos que algún aviso de entrenamiento, aunque tenían IDs distintos. El resultado sirve para entender cómo funciona el modelo con avisos de esa fuente. Los gráficos, las demás métricas y las conclusiones están en el [notebook](TP_autos.ipynb).

## Cómo ejecutar el notebook

Descargá el repo y dejá el notebook y `autos.csv` en la misma carpeta. Usá un entorno con Python 3.12 e instalá las dependencias desde esa carpeta.

```sh
python -m pip install -r requirements.txt
```

Abrí el notebook en Jupyter o en VS Code con las extensiones de Python y Jupyter. Seleccioná el entorno donde instalaste las dependencias y corré todas las celdas en orden.
