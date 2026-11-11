# Revisión final de entrega y defensa — 10/11/2026

Base revisada: commit de Mateo `27f19d6`. Esta revisión actualiza la auditoría anterior con el código simplificado, los textos completos del notebook y la presentación final. El commit de publicación se identifica en el historial de GitHub por el mensaje «Completar entrega y defensa del TP de autos».

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
| Presentación opcional | HTML autónomo con trece secciones y estimador, más guion de seis bloques. |
| Defensa de 20–25 minutos | Guion de 19 minutos más 3–5 de preguntas. El ensayo y la comprensión individual corresponden al grupo. |

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

La preparación independiente del modelo reprodujo el MAE de validación, el ganador y las predicciones guardadas. Los resultados numéricos se conservan. La ficha de Kaggle responde con el título esperado, pero el lector web no recuperó su texto; la licencia y fecha se apoyan en los metadatos conservados y no se presentan como reconfirmadas en esta revisión.

## Entrega y pendientes externos

El mensaje del profesor permite entregar el notebook o, preferentemente, el enlace a GitHub. La consigna pide también los datos o su enlace. El repositorio incluye notebook, CSV, fuente, código auxiliar e instrucciones. La presentación es opcional y se incluye para la defensa.

La consigna guardada fija **10/11/2026 a las 23:59** para entregar y **11/11/2026** para defender. Una prórroga requiere confirmación en la tarea del campus.

El repositorio se comprobó privado mediante GitHub. Falta identificar la cuenta del docente para verificar su permiso. El enlace privado por sí solo no acredita acceso. También quedan a cargo del grupo la carga en la tarea, la asignación de los seis bloques, el ensayo oral y confirmar la excepción para seis integrantes si aún no fue acordada.

Esta revisión verifica el producto técnico dentro del alcance documentado. La calificación incluye el dominio y la exposición de cada integrante.
