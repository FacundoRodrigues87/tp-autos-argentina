# Alineación del TP con Python para Ciencia de Datos

Revisión del 10/11/2026 sobre la versión de Mateo `27f19d6` y las explicaciones del notebook preparadas para la entrega. Esta matriz distingue contenidos acreditados en el material docente de adaptaciones del proyecto.

## Fuentes revisadas

La consigna está en `docs/consigna.docx`. También se aplican las indicaciones del profesor sobre notebook ejecutable, fuente pública, entrega mediante archivo o enlace a GitHub y defensa de 20–25 minutos con participación individual.

Se consultó la copia local de los 34 notebooks del repositorio docente fijada en `4589c4da36188bab5badab791f7f70b344a401cd`. Se revisaron las celdas relevantes de las unidades 3–5 y 7 y se buscó la presencia de las técnicas adicionales en todo ese corpus. La copia local está bajo `Material del repositorio/2026-10-28 - 4589c4d` en la carpeta de la materia. Las referencias de celda cuentan desde 1 e incluyen Markdown y código. [Repositorio docente de referencia](https://github.com/UADE-Python-Data-Science/583433_repo_oficial/tree/4589c4da36188bab5badab791f7f70b344a401cd).

El alcance de esta comprobación son esos materiales. Teams, grabaciones y explicaciones orales no están verificados. Que una técnica carezca de evidencia en este corpus requiere explicarla como adaptación propia del TP.

## Requisitos y evidencia en el entregable

| Requisito | Evidencia del TP | Correspondencia con la cursada |
| --- | --- | --- |
| Dataset público, al menos 10 columnas y mezcla de tipos | Notebook §1, CSV de 10.191 filas y 25 columnas, fuente Kaggle, metadatos e instrucciones de recuperación. | Carga y exploración de datos de U2. |
| Pregunta predictiva, X e y | §1 y §5 estiman precio publicado en USD con seis variables numéricas y cinco categóricas. | U7, ejemplo de regresión lineal, celdas 20–24. |
| Tipos, duplicados, faltantes e imposibles | §2 muestra diagnóstico original, decisiones, cantidades, tipos finales y faltantes. Recorte de 4.047 a 4.044 avisos. | U3, EDA duplicados/nulos, celdas 20–21, 31, 36, 52 y 85. |
| Justificación de limpieza | §2 explica unidades, rango de especificaciones, duplicados, año inválido y anticipo. Se conservan extremos que pasan los controles. | Conversión de tipos y criterios de calidad aplicados al dominio de autos. |
| Estadística e interpretación univariada | §3 contiene media, mediana, cuartiles, categorías, histogramas y boxplots, con lectura de sus resultados. | U4, estadística descriptiva, celdas 27, 30, 32, 49–50 y 53–55. |
| Análisis bivariado | §4 muestra precio frente a año y km, mapa de correlaciones y explicación de asociación y dispersión. | U4, correlación, y U7 Diamonds, celda 13. |
| Agregaciones y barras | §4 agrupa por marca y marca–modelo con cantidad, media y mediana. Barras de mediana por marca. | U5, agregación, celdas 17 y 21–23. |
| Serie temporal cuando hay fechas | §4 explica que el año de fabricación describe al vehículo. Faltan fechas de publicación para estudiar evolución de precios. | El requisito es condicional a fechas útiles para la pregunta. |
| Regresión lineal o k-NN y baseline | §6 compara mediana, regresión lineal y k-NN. La mediana es la referencia constante elegida para MAE. | U7 Diamonds, celdas 28 y 40. En clase el baseline usa media. La mediana es una adaptación explícita. |
| Separación y elección sin usar test | §5–6 separan grupos y seleccionan por validación interna. | U7 Diamonds, celdas 48–52, explica CV y la reserva del test. La variante por grupos es una extensión. |
| Escalado y búsqueda opcionales | §6 ajusta preparación dentro del Pipeline y compara seis configuraciones de vecinos con GridSearchCV. | U7 Diamonds, celdas 52 y 64–65. |
| Evaluación de regresión | §7 muestra MAE, RMSE y R², baseline, predicho frente a observado y errores por segmentos. | Métricas de U7 y agregaciones de U5. |
| Conclusiones fundamentadas | §8 interpreta mejora frente a baseline, casos difíciles, alcance histórico y posibles mejoras. | Flujo de conclusiones del notebook U7 Diamonds, celda 69. |
| Entrega reproducible | §1 indica Python 3.12, repositorio completo, instalación, CSV y ejecución ordenada. | Entornos y notebooks de U2. La ejecución final se registra en la auditoría de entrega. |

## Técnicas adicionales y explicación necesaria

| Técnica | Evidencia docente | Decisión y explicación para la defensa |
| --- | --- | --- |
| Indicadores 0/1 con OneHotEncoder | El corpus revisado no contiene OneHotEncoder. U7 Diamonds, celdas 62–63, convierte categorías ordinales con map. | Las marcas y combustibles se representan mediante indicadores porque carecen de un orden natural. Ejemplo simple de Nafta en §6. Las categorías se aprenden en entrenamiento. |
| ColumnTransformer e imputación en Pipeline | ColumnTransformer no aparece en el corpus. Sí aparecen fillna, Pipeline y StandardScaler. | Una preparación para números y otra para categorías. Medianas, modas y escala se ajustan dentro de cada ronda para evitar usar información de validación. |
| GroupShuffleSplit y GroupKFold | El corpus usa train_test_split y KFold. No aparecen las variantes por grupos. | Agrupar marca–modelo–versión–año permite mantener la misma configuración a un solo lado de cada separación. Se comprueban grupos compartidos y se guardan IDs. La clave no identifica vehículos físicos. |
| VecinosRegresor y cdist | U7 Diamonds usa KNeighborsRegressor, analiza vecinos y explica empates en celdas 28 y 31–32. No aparecen cdist ni BaseEstimator en el corpus. | La implementación calcula distancias y promedios, con desempate por orden de entrenamiento. Esa regla permite compartir el cálculo con JavaScript. Debe justificarse como adaptación de implementación. |
| Baseline con DummyRegressor | Se enseña la idea de baseline con np.full y la media, en U7 Diamonds celda 40. No aparece DummyRegressor en el corpus. | Predicción constante con la mediana aprendida en cada ajuste. La clase permite compararla con el mismo procedimiento de validación que los otros modelos. |
| Particiones y utilidades de archivos | La revisión anterior citaba dataclasses. La versión de Mateo usa una clase simple Particiones. | El contenedor reúne entrenamiento, prueba, rondas y detalles. Los nombres en español y las funciones explícitas facilitan recorrer el proceso. |
| joblib, exportación y cálculo web | No hay evidencia suficiente del empaquetado del modelo y de su réplica en JavaScript dentro de la materia. | Son apoyos para usar el modelo desde consola y HTML. La defensa debe poder explicar qué valores aprendidos se guardan y cómo se verifica la equivalencia. |

La búsqueda de nombres en el corpus se complementó con lectura de las celdas citadas. Una importación aislada no acredita que un tema haya sido desarrollado. Las extensiones deben poder explicarse mediante ejemplos del TP y con sus limitaciones.

## Cambios académicos realizados para la entrega

Se conservaron los nombres claros y pasos explícitos de Mateo. Se restauraron puntuación y acentos en las explicaciones del notebook, y se incorporó una lectura de los hallazgos junto a cada sección. Se explicaron la diferencia entre validación y prueba, la comparación con el baseline, las 14 coincidencias de predictores crudos entre conjuntos y el alcance del agrupamiento.

Los ejemplos de la herramienta usan entrenamiento. La evaluación usa los 831 avisos reservados. El EDA describe la muestra completa y esa decisión se declara expresamente. La fuente registra actualización de febrero de 2024, lo que limita su uso para cotizaciones actuales.

## Preparación individual

Cada integrante debe poder explicar una regla de limpieza, un gráfico, X e y, el baseline, el escalado, cómo se elige k, qué informa cada métrica y una limitación. Para las extensiones, practicar el ejemplo de indicadores de combustible, dos avisos con la misma clave de grupo y un empate entre vecinos. La evidencia de ejecución y los pendientes de acceso y defensa se reúnen en `docs/auditoria-entrega.md`.
