# Revisión de entrega y defensa — 10/11/2026

Estado: técnicamente apto dentro del alcance comprobado; entrega condicionada al acceso del docente y preparación individual. Se revisó la base b086d48 y se corrigieron instrucciones del notebook, tabla de folds y aviso histórico de CV. No se cambió el modelo ni los datos.

| Criterio solicitado | Evidencia y resultado |
|---|---|
| Notebook organizado y documentado | Ocho secciones, explicaciones antes del código, resultados y conclusiones. Se añadieron instrucciones propias de instalación, archivos auxiliares y recuperación del CSV. |
| Ejecución | Once celdas ejecutadas de principio a fin con Python 3.12 y dependencias del proyecto. Siete pruebas aprobadas, incluida equivalencia Python–JavaScript. |
| Datos públicos y fuente | Kaggle de Ariel Rasgido, enlace en notebook, CSV incluido y metadatos con huella. La página responde, pero su contenido no fue recuperable por el lector web en esta auditoría; licencia y fecha se apoyan en la ficha conservada. |
| Selección y descripción | 10.191 avisos y 25 columnas; 4.047 usados en USD, 4.044 tras limpiar. Unidad: publicación; objetivo: precio pedido histórico en USD. |
| Preprocesamiento | Registro de duplicados, faltantes, unidades, valores imposibles y anticipo. Imputación, escala y categorías se aprenden dentro de cada fold. |
| EDA, descubrimientos y gráficos | Descriptivos, histogramas, boxplots, dispersión, correlaciones, groupby/agg por marca y modelo, interpretación y límites. No se inventa una serie temporal con el año del vehículo. |
| Modelo predictivo | Baseline mediana, lineal y k-NN; selección por CV en entrenamiento y evaluación reservada. |
| Métricas | Recálculo independiente desde las 831 predicciones: MAE 1.499,2989; RMSE 2.735,5655; R² 0,906071. El promedio de los cinco errores de CV coincide con la tabla a precisión numérica. |
| Defensa y tiempos | Guion para seis bloques: 19 minutos más 3–5 de preguntas. Deben asignarse los nombres y ensayarse los tiempos. |
| Claridad y dominio individual | Guías y preguntas disponibles; la comprensión de cada persona solo puede comprobarse mediante un ensayo oral. |

## Correcciones realizadas

- El notebook explica que necesita el repositorio completo y cómo recuperar el dataset público. Entregar el ipynb aislado no permite reproducir sus importaciones.
- La tabla visible de folds muestra tamaños y grupos compartidos; los miles de IDs permanecen en particiones.json.
- La guía de presentación ya no afirma que la discrepancia de CV siga pendiente. La cifra canónica es USD 1.536,72.

## Antes de entregar

1. Comprobar que el docente pueda abrir el repositorio privado. No se modificaron permisos. Si se elige otra modalidad, adjuntar los archivos auxiliares además del notebook según permita la plataforma.
2. Confirmar con el docente la excepción para seis integrantes prevista en la consigna y asignar los bloques a nombres reales.
3. Ensayar el recorrido con cronómetro, dejando las preguntas dentro de los 25 minutos.
4. Cada integrante debe explicar sin leer: por qué USD/usados; una regla de limpieza; qué muestra un gráfico; por qué escalar y usar one-hot; dónde se ajusta la imputación; diferencia entre train, CV y test; baseline; k y pesos; MAE/RMSE/R²; un error real y una limitación.
5. Practicar el ejemplo Up! 2014, 108.000 km, Nafta, Manual, opcionales vacíos: USD 7.927,05. Poder localizar la función que transforma la ficha y explicar los cinco vecinos.

## Límites del dictamen

El EDA describe la muestra completa: no debe afirmarse que el test estuvo oculto para toda exploración humana. El ajuste y la selección automatizados sí utilizan solo entrenamiento. Hay 14 fichas de test con predictores idénticos a alguna de train en otro grupo; la clave de grupos no identifica vehículos físicos. Las métricas no prueban capacidad para cotizar hoy, precios finales de venta ni todo el mercado argentino.

Se reutilizó la comprobación visual de la presentación integrada sin cambios de HTML; en esta revisión se repitieron ejecución y pruebas de cálculo, no una auditoría visual nueva de todos los estados ni Windows. No se verificó el acceso desde la cuenta del docente, la carga en la plataforma ni el desempeño oral. La revisión no garantiza una calificación.
