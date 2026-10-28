# Autos usados: predicción de precios y recomendaciones

TP integrador de Python para Ciencia de Datos, UADE. El objetivo es estimar el precio de un auto y ofrecer un ranking que respete presupuesto, plazas y preferencias. El notebook explica el análisis antes de cada bloque de código.

## Datos y alcance

El dataset principal es Vehicle dataset, archivo `car details v4.csv`: 2.059 avisos y 20 columnas del mercado de India. El nombre inicial del repositorio conserva “argentina” porque el proyecto comenzó con un CSV argentino; ese archivo queda como piloto y no se mezcla con el principal. No se presentan estos datos como precios argentinos actuales. La moneda de Price está pendiente de confirmación: los presupuestos se expresan en las mismas unidades del archivo.

Fuente: https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho . Ver comparación, licencia, huella y límites en `docs/seleccion_dataset.md` y metadata original en `docs/dataset_metadata.json`. La consigna está en `docs/consigna.docx`.

## Ejecutar

Con Python 3.12:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter nbconvert --execute --to notebook --inplace TP_autos.ipynb
python recomendar.py --presupuesto 800000 --plazas 5 --caja Manual --km-max 100000
```

Abrir `TP_autos.ipynb` en Jupyter, VS Code o Colab. En Colab subir también `src/autos.py` y `data/raw/car_details_v4.csv` conservando las carpetas. Los CSV de resultados y los gráficos se regeneran al ejecutar.

## Qué incluye

Calidad y limpieza, estadística descriptiva, histogramas y boxplots, dispersión y correlación, groupby y agg, baseline, regresión lineal y k-NN. Separación por grupos y validación cruzada dentro de entrenamiento. MAE, RMSE y R² en test. Recomendador con filtros y puntajes explicados y ejemplos comprobables.

No hay fechas individuales de aviso; no se fabrica una serie temporal a partir del año del auto. La predicción de precio se evalúa por separado de la relevancia del ranking. El catálogo de demostración corresponde a test; sus precios no se utilizaron al entrenar el modelo.

Todos los integrantes deben revisar las decisiones y poder explicar cualquier parte. Pendientes: corroborar moneda, revisar elección con el instructor y personalizar casos de uso y defensa con el grupo. No hay invitaciones enviadas todavía.
