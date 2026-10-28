# Autos en Argentina: precios y recomendaciones

Trabajo integrador de Python para Ciencia de Datos, UADE, segundo parcial.

Queremos estimar el precio publicado de un auto y encontrar opciones compatibles con el presupuesto y las preferencias de una persona. El modelo predictivo y el orden de recomendación se evaluarán por separado.

## Datos

`data/raw/argentina_cars.csv` es la copia sin modificaciones del archivo aportado por el grupo. Tiene 510 filas y 12 columnas. Su enlace público original y fecha de captura están pendientes de confirmación. No corresponde presentar los precios como valores actuales de mercado.

El archivo contiene pesos y dólares. Se analizarán por separado, sin inventar un tipo de cambio. No contiene consumo, equipamiento ni seguridad: esas preferencias no pueden inferirse del dataset.

## Alcance

1. Revisar calidad, nulos, categorías, duplicados y valores imposibles.
2. Explorar las variables y sus relaciones con el precio.
3. Comparar un baseline, regresión lineal y k-NN mediante separación de entrenamiento y test y validación cruzada solo en entrenamiento.
4. Construir recomendaciones con filtros explícitos y puntuaciones explicables.
5. Documentar resultados, limitaciones y defensa oral.

La consigna está en `docs/consigna.docx`. Material de referencia: https://github.com/UADE-Python-Data-Science/583433_repo_oficial, commit 4589c4da36188bab5badab791f7f70b344a401cd; unidades 3 a 7.

Estado: repositorio inicial; desarrollo y evaluación pendientes. Este trabajo debe ser revisado y entendido por todos los integrantes antes de entregarlo.
