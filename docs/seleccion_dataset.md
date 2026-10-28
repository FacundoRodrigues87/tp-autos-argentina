# Elección del dataset

Se comparó el CSV argentino (510 filas, 12 columnas, mezcla de monedas y sin fecha individual) con el paquete Vehicle dataset de Nehal Birla en Kaggle. La descarga oficial de la versión 4 contiene cuatro archivos distintos. Elegimos `car details v4.csv`: 2.059 filas, 20 columnas, sin duplicados exactos y con nulos reales para trabajar calidad. No debe confundirse con `Car details v3.csv` (8.128 filas y 13 columnas).

Fuente primaria y licencia: https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho . La metadata oficial está en dataset_metadata.json; el proveedor declara “Database: Open Database, Contents: Database Contents”. No se relicencian los datos como propios. SHA-256 del CSV descargado: 6841a81165c2a390d84b361555489e123f739f0e4b2bfe7915e759746b3efe59.

Ventajas para el TP: plazas, potencia, dimensiones, combustible y transmisión permiten preferencias verificables; precio, año y kilometraje permiten regresión y visualizaciones. La muestra es suficientemente pequeña para ejecutar el notebook completo en una notebook personal. No se atribuye a Argentina ni a precios actuales. La moneda requiere corroboración documental; se trabaja en las unidades originales de Price.

También se revisaron 100,000 UK Used Car Data set (https://www.kaggle.com/datasets/adityadesai13/used-car-dataset-ford-and-mercedes): cada CSV tiene solo 9 columnas y la marca viene del nombre del archivo; y US Used Cars (https://www.kaggle.com/datasets/ananaymital/us-used-cars-dataset): 66 columnas pero casi 10 GB, desproporcionado para este TP. No se descargaron esos paquetes.

El enlace aportado por el grupo, https://www.kaggle.com/code/user182827/argentine-car-prices-explore , es un notebook. No permite por sí solo certificar que el CSV adjunto sea idéntico a un archivo del dataset original. Se conserva por separado, con su procedencia del adjunto.
