# Handoff de la revisión académica

> Registro histórico de esa rama. El estado actual, los cambios de validación cruzada y las pruebas conjuntas están en [integración de la defensa](integracion-defensa.md).

| Referencia | SHA |
| --- | --- |
| Base exacta de `codex/autos-meli-arg` | `1b05003f3ece1fde18c8bd218a4cc78cb212278c` |
| Revisión final del TP ejecutada y verificada | `c31ac75d10d109b76007fae5f5c6792a3722fa03` |
| Material docente usado | `4589c4da36188bab5badab791f7f70b344a401cd` |

Este handoff se agrega en un commit documental posterior a la revisión del TP. El SHA final de la rama se obtiene con `git rev-parse refs/heads/codex/revision-programa` en el checkout o con `git ls-remote origin refs/heads/codex/revision-programa` en el remoto.

## Cobertura

La [matriz de alineación](alineacion-materia.md) enumera los 34 notebooks del repositorio docente, las actividades y resoluciones, el código y el PDF del primer parcial, y los apoyos consultados. Se cotejó la copia de Windows con el SHA remoto. El checkout docente quedó en `E:\uade1\583433-referencia-4589c4d`, fuera del checkout del TP. En Windows quedaron sin acceso la ruta macOS, los índices de `Fuentes/`, la ficha `PY-002` y el directorio histórico especificado. Teams, SharePoint y grabaciones quedaron sin verificar.

## Hallazgos y cambios

- **`TP_autos.ipynb`.** Hace visibles los tipos, vacíos, duplicados y predictores. Explica cómo se pasan los datos al modelo, qué se aprende en cada fold, por qué se agrupan los avisos y cómo se interpretan las métricas. Las conclusiones salen de la ejecución y distinguen precio pedido histórico, precio de cierre y cotización actual. Una fecha por aviso es necesaria para estudiar la evolución de precios.
- **`src/autos.py`.** Las exclusiones devuelven el DataFrame filtrado, con la misma secuencia y auditoría. La selección y la evaluación separan explícitamente `X` e `y` y reutilizan los grupos y las matrices. La tabla de CV toma la cantidad de folds del ajuste. Se conserva `VecinosRegresor` por el contrato de desempate con el navegador.
- **`requirements.txt`.** Se agrupó por uso, con las mismas versiones. SciPy y Joblib se importan directamente además de ser dependencias de scikit-learn.
- **`tests/test_revision.py`.** Comprueba datos, particiones, ajuste por fold, empates y compatibilidad de la exportación.
- **Documentación de revisión.** Se agregaron `docs/alineacion-materia.md` y este handoff.

Se conservaron la limpieza efectiva, los predictores, la grilla, el baseline y el criterio de selección. La regresión lineal y el baseline se comparan con el mismo procedimiento, y el test se evalúa después de elegir por CV. El notebook se volvió a ejecutar para dejar la auditoría y las explicaciones junto a sus salidas.

## Verificación y resultados

- El ZIP público de Kaggle v1 y el CSV versionado coinciden byte a byte. SHA-256 `0bce5fcc04bc320713a750ebdf4512f35c638c96dcf6dedab8059e8bcc91f25f`. 10.191 × 25 en origen, 4.047 usados en USD y 4.044 después de limpiar. [Ficha del dataset](https://www.kaggle.com/datasets/arielras/cars-publications-prices-mercadolibrearg)
- En Windows, Python 3.13.14 en un entorno virtual nuevo y las versiones de `requirements.txt`. `pip check`, `nbconvert` y `nbformat.validate` pasaron. El notebook tiene 11 celdas de código ejecutadas en orden. La corrida usó un hilo para OpenBLAS y OpenMP. El sandbox de Windows denegó el cambio de permisos del archivo de conexión de Jupyter en el primer intento. La ejecución local autorizada completó sin alterar la protección del kernel.
- Cero IDs o claves de grupo compartidos entre 3.213 avisos de train (1.576 grupos) y 831 de test (394 grupos). Los cinco folds cubren train, cada fila se valida una vez y las claves de ajuste y validación son disjuntas. Quedan 14 fichas de prueba con los 11 predictores crudos idénticos a alguna ficha de train en otro grupo. La versión forma parte de la clave y queda fuera de `X`. El CSV permite identificar avisos y aproximar configuraciones, con capacidad limitada para identificar vehículos repetidos.
- Cinco pruebas específicas pasaron. Una ejecutó la selección con dos folds y con acceso solo a train. Registró las filas que recibía el ajuste de cada transformador y comprobó medianas, modas, escalas y categorías contra esas filas. Otra verificó desempate y coincidencias exactas.
- El estimador de consola devuelve USD 7.927,05 para el Volkswagen Up! 2014, 108.000 km, Nafta y Manual con los opcionales vacíos. Un kilometraje negativo genera el error de rango y código de salida 2.
- El exportador generó un HTML temporal de 961.935 bytes. La prueba con Node.js 24.15.0 comparó el JavaScript del HTML con las 831 predicciones de prueba y cuatro fichas, con tolerancia absoluta de USD `1e-8`. También verificó los índices de vecinos de las fichas, un empate en el corte y el rechazo de kilometraje negativo. La prueba cubre el cálculo y el formulario a nivel de funciones. La navegación y el diseño visual quedan para la sesión de presentación.

| Modelo | MAE CV (USD) | MAE test (USD) | RMSE test (USD) | R² test |
| --- | ---: | ---: | ---: | ---: |
| Mediana | 4.603,68 | 5.502,45 | 9.523,42 | −0,1384 |
| Regresión lineal | 1.954,97 | 2.242,45 | 4.251,97 | 0,7731 |
| k-NN, `k=5`, peso por distancia | 1.504,65 | 1.499,30 | 2.735,57 | 0,9061 |

El notebook regeneró los CSV, JSON, gráficos y el modelo local. Los derivados versionados coinciden con la base en `git diff`. Los cambios se limitaron a la claridad y al armado del reporte de folds, de modo que el procedimiento ejecutado con cinco folds vuelve a producir las mismas métricas. El modelo queda generado en `resultados/modelo.joblib`, ignorado por Git.

### Caso que justifica conservar el k-NN propio

En train, las posiciones 146 y 152 tienen la misma ficha transformada y precios de USD 8.900 y USD 8.000. Una consulta derivada de la posición 205, con `km` aumentado en 0,01 unidades estandarizadas, las deja empatadas en el quinto lugar. En esta corrida `VecinosRegresor` elige 146 y estima USD 9.352,14. `KNeighborsRegressor` 1.8.0 elige 152 y estima USD 9.331,18. Para reproducir la comparación dentro del entorno del TP se puede ejecutar este bloque de Python.

```python
from sklearn.neighbors import KNeighborsRegressor
from src.autos import FEATURES, NUM, VecinosRegresor, cargar, limpiar, preprocesador, separar

data, _ = limpiar(cargar())
train = separar(data).train
X = preprocesador().fit_transform(train[FEATURES])
y = train['price']
query = X[[205]].copy()
query[0, NUM.index('km')] += 0.01
own = VecinosRegresor(5, 'distance').fit(X, y)
standard = KNeighborsRegressor(5, weights='distance').fit(X, y)
print(own.neighbors(query)[0], own.predict(query))
print(standard.kneighbors(query)[1], standard.predict(query))
```

## Contratos y pendientes de integración

- `presentacion/exportar.py` sigue encontrando `ROOT`, `META`, `RESULTS`, `NUM`, `CAT`, `cargar`, `limpiar` y `VecinosRegresor`. El Pipeline expone `preparar` y `modelo`, y las ramas `num` y `cat` conservan `imputar`, `escalar` y `onehot` en sus lugares. El exportador usa `vectors_`, `prices_`, `n_neighbors` y `weights` en el orden del ajuste.
- `modelo.joblib` conserva `nombre`, `modelo`, `comparacion_knn`, `opciones`, `train` y `ejemplos`. Las opciones conservan `modelos`, `categorias`, `rangos`, `obligatorios`, `enteros` y `etiquetas`. `estimar.py` y las tablas de `resultados/` mantienen su contrato, incluida la auditoría con IDs y las columnas por fold.
- Al integrar la presentación, regenerar el HTML con el notebook y el exportador de la rama integrada. Volver a comprobar equivalencia Python–JavaScript con fichas completas, opcionales vacíos, empates y todas las predicciones de prueba. Cualquier sustitución del estimador requiere acordar la regla de desempate, adaptar la exportación y validar el cálculo en ambos lenguajes.
- En la integración, enlazar la matriz y este handoff desde el README. Incorporar a `docs/validacion.md` la prueba reproducible y el alcance de la clave de grupos. Sumar a `docs/guia_defensa.md` un ejemplo de one-hot, otro de empate y la distinción entre baseline y referencia de R². Reflejar el diagnóstico de tipos y vacíos y la ausencia de fechas de aviso en `docs/seleccion_dataset.md`.
- El guion base reparte la exposición entre seis integrantes. La consigna ¶6–7 define hasta cinco y contempla seis como excepción. Si ese reparto aplica al grupo, revisar la modalidad con el instructor durante la integración.

## Reproducción

Desde la raíz del TP en PowerShell, con Python 3.13 como en esta revisión y Node.js para la prueba de JavaScript.

```powershell
python -m venv .venv
$env:OPENBLAS_NUM_THREADS = '1'
$env:OMP_NUM_THREADS = '1'
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m pip check
.venv/Scripts/python.exe -m nbconvert --execute --to notebook --inplace TP_autos.ipynb
.venv/Scripts/python.exe -c 'import nbformat; nbformat.validate(nbformat.read("TP_autos.ipynb", as_version=4))'
.venv/Scripts/python.exe estimar.py --marca Volkswagen --modelo 'Up!' --anio 2014 --km 108000 --combustible Nafta --transmision Manual
.venv/Scripts/python.exe -m unittest discover -s tests -v
git diff 1b05003f3ece1fde18c8bd218a4cc78cb212278c -- resultados
```

La prueba `test_exportacion_y_calculo_javascript` llama al exportador con una raíz temporal y compara el HTML generado. Para actualizar el HTML versionado durante la integración, ejecutar `.venv/Scripts/python.exe -m presentacion.exportar`. En macOS o Linux el ejecutable del entorno es `.venv/bin/python`.

Para volver a cotejar el material docente desde un directorio padre separado del TP.

```powershell
git clone https://github.com/UADE-Python-Data-Science/583433_repo_oficial.git 583433-referencia-4589c4d
git -C 583433-referencia-4589c4d switch --detach 4589c4da36188bab5badab791f7f70b344a401cd
git -C 583433-referencia-4589c4d ls-tree -r --name-only HEAD
```
