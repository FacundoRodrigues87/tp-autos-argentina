# Verificación de la primera versión

Se ejecutó el notebook completo con las dependencias fijadas en requirements.txt, semilla 42 y el CSV original descargado. Se validó su estructura con nbformat. Se revisaron los cinco gráficos generados y se corrigieron etiquetas del mapa de correlación.

Se probaron la interfaz por consola, los filtros obligatorios, el caso sin candidatos, el rechazo de presupuestos negativos y pesos inválidos, y que cambiar los pesos de precio/año cambie el orden del ranking. Estos controles no equivalen a una evaluación con usuarios.

La partición tiene 1.646 avisos de entrenamiento y 413 de test; no comparte grupos de marca, versión y año. El ganador por MAE de validación es k-NN con k=5 y pesos por distancia. Las cifras reproducibles están en resultados/metricas.csv y resultados/particiones.json. No se eligieron parámetros con el resultado de test.

El notebook es una versión funcional para revisar con el grupo. Pendientes: corroborar moneda del campo Price con documentación primaria, revisar el dataset con el instructor, comprobar casos de uso con integrantes y decidir el alcance final del recomendador. La inspección de gráficos no constituye validación de precios como valores actuales.

La vista HTML se exportó, pero su apertura en navegador quedó bloqueada por la política de URLs locales. Se revisaron directamente los gráficos; falta revisar la presentación completa en un visor de notebooks.
