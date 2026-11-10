# Verificación de la entrega

## Reproducción y separación

Se creó un entorno nuevo con Python 3.11 y `requirements.txt`. Se ejecutaron los 11 bloques de código de `TP_autos.ipynb` en orden y se validó el archivo con nbformat. La carga verificó la huella SHA-256 del CSV original. La limpieza dejó 4.044 IDs únicos y regeneró los gráficos y las tablas.

La partición con semilla 42 asignó 3.213 avisos a entrenamiento y 831 a prueba (20,55 %). Se comprobaron cero grupos compartidos entre entrenamiento y prueba, y cero entre ajuste y validación en los cinco folds. El grupo combina marca, modelo, versión y año. El criterio de selección fue el MAE medio de validación.

| Modelo | MAE de validación (USD) | MAE de prueba (USD) | RMSE de prueba (USD) | R² de prueba |
| --- | ---: | ---: | ---: | ---: |
| Mediana | 4.603,68 | 5.502,45 | 9.523,42 | -0,1384 |
| Regresión lineal | 1.954,97 | 2.242,45 | 4.251,97 | 0,7731 |
| k-NN, 5 vecinos por distancia | 1.504,65 | 1.499,30 | 2.735,57 | 0,9061 |

Se contrastaron las métricas exportadas al HTML con los CSV del notebook. La presentación usa los mismos valores con el redondeo indicado por cada formato. [Métricas completas](../resultados/metricas.csv) · [Ocho configuraciones](../resultados/validacion_cruzada.csv) · [Particiones](../resultados/particiones.json)

## Estimador

- Se comparó el modelo ganador en Python y Chromium con 51 fichas válidas, incluidas fichas completas, con cambios de kilometraje y con opcionales omitidos. También se cotejaron las 831 predicciones de prueba. La tolerancia fue de USD 0,00000001. Se verificó por separado la ruta de exportación y cálculo de la regresión lineal.
- Se probaron una combinación marca–modelo incompatible, una categoría ajena al entrenamiento, campos obligatorios vacíos, kilómetros negativos, año imposible, puertas fuera de rango y cantidades fraccionarias para campos enteros.
- El Volkswagen Up! 2014 con 108.000 km, Nafta y Manual estima USD 7.927,05 con los cinco opcionales vacíos. Se comprobó el mismo importe en la consola y el formulario.
- El desempate de k-NN mantiene el orden de los registros de entrenamiento. Esto permite repetir la selección de vecinos cuando hay distancias iguales.

## HTML autónomo

Se abrió `presentacion.html` con Chromium desde una URL `file://` y con la red desactivada. Se recorrieron y revisaron visualmente las trece secciones a 1440 × 900 y 390 × 844. Se probaron los selectores de transformación, fold, dispersión, métrica, caso de prueba y segmento, la revelación de vecinos, el formulario y los estados de error. La página no produjo errores de JavaScript, solicitudes de red ni desplazamiento horizontal del documento. Se comprobaron las animaciones con el movimiento habilitado y la ausencia de desborde del documento a 320 px.

## Lectura de resultados

Los avisos del tercil alto tuvieron un MAE de USD 2.659,07 y un sesgo de −USD 607,40. Los avisos de hasta cinco años tuvieron un MAE de USD 3.054,73. El modelo subestimó el Fiat Uno 1994 publicado a USD 29.000 por unos USD 21.483. Las métricas describen la capacidad de aproximar precios pedidos en este recorte histórico. [Errores por segmento](../resultados/errores_segmentos.csv)
