# Revisión final de entrega y defensa — 11/11/2026

Base revisada: commit de Mateo `27f19d6`. Esta revisión actualiza la auditoría anterior con el código simplificado, los textos completos del notebook y la presentación final. El commit de publicación se identifica en el historial de GitHub por el mensaje «Completar entrega y defensa del TP de autos».

La última comprobación parte de `6013fdd`, verificado contra `main`, e incorpora los seis integrantes en README, notebook y portada del HTML. Se conservaron sus nombres tal como los informó el grupo. El guion local también incluye la nómina; el reparto de bloques queda a cargo del grupo.

## Cumplimiento de la consigna

| Requisito | Evidencia |
| --- | --- |
| Dataset público, al menos diez columnas y tipos mixtos | CSV de Kaggle de Ariel Rasgido, 10.191 avisos y 25 columnas, enlace y recuperación explicados en notebook §1 y README. |
| Pregunta y variable objetivo | Notebook §1 y §5. Precio publicado histórico en USD, seis predictores numéricos y cinco categóricos. |
| Calidad y decisiones | Notebook §2 y `calidad.csv`. Tipos, vacíos, faltantes, duplicados, unidades, imposibles y anticipos. 4.047 usados en USD, 4.044 limpios. |
| EDA univariado | Notebook §3. Estadística descriptiva, histogramas, boxplots y resumen categórico, con interpretación. |
| EDA bivariado | Notebook §4. Precio frente a año/kilómetros, correlaciones y mapa de calor. |
| Agregaciones y gráfico de barras | Notebook §4. `groupby().agg()` por marca y modelo, barras de medianas y tamaños de muestra. |
| Series temporales si hay fechas | El año corresponde al vehículo. No existe una fecha temporal apropiada de cada aviso para construir la serie solicitada condicionalmente. |
| Modelos y baseline | Notebook §5–7. Mediana, regresión lineal y k-NN, separación y selección por validación en entrenamiento. |
| Evaluación | MAE, RMSE y R², comparación con baseline, errores individuales y por segmentos. |
| Conclusiones | Notebook §8. Hallazgos, desempeño, límites y mejoras propuestas. |
| Notebook legible y ejecutable | Explicaciones restauradas, instrucciones completas y resultados guardados. Necesita los archivos auxiliares del repositorio. |
| Presentación opcional | HTML autónomo con trece secciones y estimador. |
| Defensa de 20–25 minutos | La defensa incluye preguntas del docente. El ensayo y la comprensión individual corresponden al grupo. |

## Alineación y decisiones de simplificación

Se cotejaron materiales docentes y la consigna. La [matriz académica](alineacion-materia.md) distingue contenidos vistos y extensiones del proyecto. Las explicaciones del notebook permiten seguir cada decisión sin depender de leer las funciones auxiliares.

Se probó `KNeighborsRegressor(algorithm="brute")` sobre las seis configuraciones de vecinos y pesos, usando exactamente las cinco rondas del entrenamiento. Ganó cinco vecinos ponderados por distancia, con MAE CV 1.536,697580 frente a 1.536,724892 de la clase actual. La diferencia es USD 0,0273. Cambiaron 61 predicciones de validación en más de 0,000001 USD por selección numérica o empates, con diferencia máxima de USD 3.650,88. En el caso de entrenamiento MLA1655348900 se verificó un empate de tres candidatos en el quinto lugar.

Se conserva `VecinosRegresor`: los pasos son explícitos y el desempate por orden permite reproducir el cálculo en Python y en el navegador. La comparación de alternativas se realizó exclusivamente dentro del entrenamiento.

Se conserva la codificación de categorías en indicadores para evitar imponer un orden artificial a las marcas, y la separación por grupos para mantener juntas configuraciones iguales. Su explicación se incluye como adaptación adicional. El preparador de pruebas ahora exige también que coincida el MAE de validación, además de las métricas finales.

## Controles numéricos independientes

- Tamaños verificados: 3.213 avisos de entrenamiento y 831 de prueba.
- Cero IDs y cero grupos compartidos entre entrenamiento y prueba. Cero grupos compartidos en cada ronda de validación.
- Fórmulas independientes aplicadas a los precios y predicciones guardadas: MAE 1.499,298913892; RMSE 2.735,565510884; R² 0,906071115.
- El promedio de los cinco errores coincide con MAE_CV, con diferencia máxima de redondeo 6,82 × 10⁻¹³.
- Se mantienen 14 fichas de prueba con predictores iguales a alguna de entrenamiento en grupos distintos. La clave incluye versión y no identifica con certeza un vehículo físico.
- El EDA describe la muestra completa. El ajuste y la elección automatizados utilizan únicamente entrenamiento. Los resultados corresponden a precios históricos pedidos y a esta muestra.

## Reproducción y presentación

Se instaló un entorno nuevo con Python 3.12.14 y exclusivamente `requirements.txt`; `pip check` informó dependencias compatibles. El notebook ejecutó sus once celdas de código sin errores. Una copia separada de los archivos versionados, sin modelo previo, también ejecutó el notebook, la consola y el exportador siguiendo el README. El ejemplo Up! devolvió USD 7.927,05.

Pasaron las siete pruebas existentes. La comprobación ampliada del HTML en Chromium, sin red, verificó 831 predicciones de prueba y 887 fichas válidas con diferencia máxima cero frente a Python, 24 entradas inválidas, cuatro casos de empates/coincidencias y dos modelos alternativos. Se comprobaron las trece secciones, navegación, foco, cambios y reinicio del formulario, movimiento reducido y tamaños 1440 × 900, 390 × 844 y 320 × 844. Se observaron cero errores JavaScript y cero solicitudes HTTP. Se inspeccionaron las capturas de las trece secciones de escritorio y móvil, además de vistas ampliadas de portada, métricas y explicación del estimador. La visualización en teléfonos físicos, otros navegadores y proyector requiere comprobarse en esos equipos.

La preparación independiente del modelo reprodujo el MAE de validación, el ganador y las predicciones guardadas. Los resultados numéricos se conservan. El 11/11 se consultó la API pública de Kaggle, que confirmó el título, la versión 1, la licencia MIT, la actualización del 06/02/2024 y el carácter público del dataset. También se descargó el ZIP sin autenticación y se verificó que el CSV tiene la misma huella SHA-256 que el incluido en el repositorio.

## Comprobación de cierre del 11/11

Se ejecutó una nueva copia de los archivos versionados, sin modelo previo, usando el entorno aislado de Python 3.12.14 preparado para la entrega. `pip check` pasó. Las once celdas se ejecutaron sin errores y el notebook pasó la validación de formato. Las cinco tablas CSV y el registro de particiones regenerados coinciden con los publicados. El exportador reprodujo exactamente el HTML previo al agregado de integrantes. La consola volvió a estimar USD 7.927,05 para el ejemplo Up!.

Un cálculo independiente con NumPy, sin llamar a `VecinosRegresor` ni a `cdist`, reprodujo las 831 predicciones con diferencia máxima de redondeo de USD 7,3 × 10⁻¹². Se recalcularon métricas, segmentos, descriptivos, correlaciones y parámetros de preparación desde los datos correspondientes. Las siete pruebas existentes pasaron.

Sobre el HTML final con los nombres, Chromium verificó sin conexión 831 predicciones de prueba, 887 fichas válidas, 24 entradas inválidas y cuatro casos de coincidencias o empates. La diferencia máxima frente a Python fue cero. Pasaron navegación, formulario y controles en escritorio y tamaños de 390 y 320 píxeles, con cero errores JavaScript y cero solicitudes HTTP. Se inspeccionaron visualmente las portadas de escritorio y móvil, las métricas y la explicación del estimador en 320 píxeles. Los controles de las secciones restantes conservan la evidencia visual de la revisión anterior y pasaron nuevamente las pruebas funcionales.

Se releyeron la consigna original, las 22 celdas del notebook y las referencias pertinentes de los 34 notebooks docentes. Se encontraron los apartados técnicos requeridos y explicaciones coherentes con los resultados. Las extensiones documentadas siguen requiriendo preparación individual.

Los denominadores siguientes corresponden a componentes delimitados de esta revisión. Expresan defectos observados sobre componentes del alcance; las verificaciones visuales y las limitaciones se describen en cada fila.

| Calidad del entregable | Defectos observados | Evaluación |
| --- | --- | --- |
| Cobertura de requisitos | 0 / 13 | Los trece requisitos de la matriz superior tienen evidencia. El ensayo y el acceso se verifican por separado. |
| Claridad del notebook | 0 / 8 | Las ocho secciones explican pregunta, preparación, análisis, modelo, evaluación y conclusiones. |
| Presentación y controles | 0 / 13 | Las trece secciones pasaron controles funcionales. Revisión visual actual de portada, métricas y explicación, complementada con la anterior. |

| Corrección analítica | Defectos observados | Evaluación |
| --- | --- | --- |
| Fuente y acceso a datos | 0 / 1 | Fuente pública reconfirmada mediante API y descarga. CSV idéntico al documentado. |
| Cálculos y tablas | 0 / 5 | Cinco CSV reproducidos y cálculos principales contrastados de forma independiente. |
| Coherencia entre formatos | 0 / 3 | Notebook, tablas y HTML coinciden en modelo y resultados. |
| Limpieza y separación | 0 / 1 | Flujo completo revisado, grupos disjuntos y preparación dentro de entrenamiento. Persisten las 14 coincidencias crudas declaradas. |
| Conclusiones | 0 / 2 | Notebook y presentación reconocen precios históricos, alcance de la muestra y limitaciones. |

El producto técnico está listo dentro del alcance comprobado. Quedan pendientes externos de entrega y defensa. La comprobación actual se realizó en macOS y Chromium; la corrida base en Windows está documentada en el README. El desempeño en la defensa y la calificación individual dependen de cada integrante y de la evaluación docente.

## Entrega y pendientes externos

El mensaje del profesor permite entregar el notebook o, preferentemente, el enlace a GitHub. La consigna pide también los datos o su enlace. El repositorio incluye notebook, CSV, fuente, código auxiliar e instrucciones. La presentación es opcional y se incluye para la defensa.

La tarea de Teams, cuyo contenido compartió el grupo el 10/11/2026, fija la entrega vigente para el **11/11/2026 a las 14:00 (hora argentina)** y permite múltiples envíos. Esta fecha actualiza el plazo del documento original. La defensa está prevista para el **11/11/2026**.

El mensaje vigente pide notebook o enlace a GitHub, organización y documentación, ejecución correcta, instrucciones de acceso al dataset público y fuente visible. La presentación HTML o PowerPoint es opcional. La defensa dura 20–25 minutos incluyendo preguntas y requiere participación de todos. La nota es individual y contempla producción técnica grupal, claridad de exposición y dominio del código, particularmente preprocesamiento, EDA, visualización y modelado.

El repositorio se comprobó privado mediante GitHub. El grupo confirmó que todavía no dispone del usuario de GitHub del docente; queda pendiente identificarlo para verificar su permiso. El enlace privado por sí solo no acredita acceso. También quedan a cargo del grupo la carga en la tarea, la asignación de los seis bloques, el ensayo oral y confirmar la excepción para seis integrantes si aún no fue acordada.

Esta revisión verifica el producto técnico dentro del alcance documentado. La calificación incluye el dominio y la exposición de cada integrante.
