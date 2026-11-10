# Demostración y preguntas de la presentación

Esta guía acompaña al [guion de seis integrantes](../presentacion/guion.md). Los valores corresponden a los archivos de la base `1b05003`; revisar el [handoff](handoff-presentacion.md) antes de integrar cambios de Python. La diferencia de reproducción de validación cruzada sigue pendiente; las métricas de test y las predicciones sí coinciden.

## Preparación breve

Abrir `presentacion/presentacion.html` en un navegador con doble clic. Basta ese archivo: contiene datos, estilos, imágenes y modelo. Comprobarlo con la red desactivada antes de exponer. En celular, abrir el archivo descargado en un navegador que permita ejecutar JavaScript local; una vista previa de un gestor de archivos puede no hacerlo.

El menú **Recorrido** permite saltar a cualquiera de las trece secciones. **Anterior/Siguiente** avanza por el relato. Se puede usar Tab, Enter y Escape; el foco llega al título de destino. Si el equipo tiene movimiento reducido activado, no se animan los cambios. El enlace externo a Kaggle necesita red; el análisis y el estimador funcionan sin ella.

## Demostración en unos tres minutos

1. Ir al estimador. Antes de completar nada, mostrar la explicación inicial: entrada, modelo, tratamiento de faltantes y límites.
2. Completar manualmente **Volkswagen**, **Up!**, **2014**, **108000**, **Nafta**, **Manual**. Dejar sin datos motor, potencia, puertas, plazas y tracción. El motor se expresa en litros; la potencia en hp; los kilómetros no llevan separadores de miles. Los años permitidos pertenecen al entrenamiento histórico, no a la fecha actual.
3. Pulsar **Estimar precio**. En esta base debe verse **USD 7.927,05**. El texto enumera los opcionales imputados. Abrir **Ver cómo se calculó la estimación** para ver cinco distancias, pesos, precios y aportes. Los pesos suman 100 % antes de redondear; la tabla puede mostrar una suma ligeramente distinta por redondeo.
4. Cambiar kilómetros a **120000**. El importe anterior desaparece. Volver a estimar; comparar los vecinos sin prometer que todos cambien ni que el precio siempre baje. k-NN puede cambiar de vecinos de manera discontinua.
5. Escribir **-1** en kilómetros y estimar. Se muestra el error, el foco va al campo y no queda un precio anterior. Corregirlo o pulsar **Limpiar ficha**. Cambiar marca reinicia modelo. Elegir una ficha del selector reemplaza todos los campos, incluidos los opcionales.
6. Para cerrar, ir a errores y seleccionar el **Fiat Uno 1994**. Publicado a USD 29.000, estimado cerca de USD 7.517. Eso muestra por qué una estimación no es una tasación ni una promesa del precio de venta.

Las fichas del selector son ejemplos del entrenamiento. La segunda corresponde al mismo Volkswagen Up! 2014 sin opcionales de la demostración manual. Las tres fichas se fijaron por sus IDs de entrenamiento para evitar cambios por empates de kilometraje al regenerar. Los ejemplos sirven para explicar el cálculo y no sustituyen al test reservado.

## Preguntas frecuentes

**¿Qué pide la consigna y qué entregamos?** Recorrer calidad, exploración, visualizaciones, modelos con baseline, evaluación y conclusiones en un notebook que corra completo. La presentación facilita la defensa. Fuente: PY-002, [consigna original](consigna.docx), P006 y P016–P039. El notebook ejecutado está en la raíz.

**¿Es un recomendador?** El sistema actual estima un número: el precio pedido en USD para una ficha. No ordena vehículos según gustos o presupuesto.

**¿De dónde salen los datos y de qué fecha son?** De avisos de Mercado Libre Argentina recopilados por Ariel Rasgido y publicados en Kaggle. La versión 1 se actualizó en febrero de 2024; la descarga del proyecto fue el 9/11/2026. Esa descarga no vuelve actuales los precios ni prueba que todos los avisos se capturaron el mismo día. Ver [procedencia y reglas](seleccion_dataset.md) y [metadata](dataset_metadata.json).

**¿Por qué no convertir ARS a USD?** El recorte usa usados ya publicados en USD. Evita imponer un tipo de cambio actual sobre avisos históricos sin una fecha y una convención cambiaria para cada observación.

**¿Cuál es el baseline?** Repetir para todos la mediana del precio del entrenamiento: USD 8.500. Es una referencia simple. Su MAE de test fue USD 5.502,45. La mediana de la muestra limpia completa, USD 8.700, es un descriptivo distinto.

**¿Cómo se eligió el modelo?** Se guardaron ocho configuraciones: mediana, lineal y k-NN con 5/15/35 vecinos y dos tipos de peso. Se eligió por el menor MAE medio en cinco folds del entrenamiento. Los CSV registran k-NN, 5 vecinos y distancia, MAE de CV USD 1.504,65. La reproducción local de esta revisión cambió esos MAE de CV, aunque mantuvo el ganador y el test. No afirmar reproducción completa hasta conciliarlo con la revisión de Python.

**¿Para qué separar train, validación y test?** Entrenamiento ajusta los modelos; los folds comparan alternativas dentro de entrenamiento; el test reservado evalúa después de elegir. Hay 3.213 filas de entrenamiento y 831 de test, con semilla 42. Los grupos marca–modelo–versión–año no se comparten entre ajuste y evaluación. Es una separación aleatoria por grupos; no demuestra rendimiento en un mercado futuro.

**¿Por qué imputar y escalar dentro del Pipeline?** Para que cada fold aprenda las medianas, modas, medias, desviaciones y categorías solo de su bloque de ajuste. Se aplican luego a su validación. En el modelo final se aprenden del entrenamiento completo. Los números se estandarizan para que kilómetros no domine por su unidad. Las categorías se codifican en indicadores 0/1.

**¿Cómo calcula k-NN?** Busca los cinco vectores más próximos en distancia euclídea. Para distancias positivas usa pesos inversos a la distancia y los normaliza. Si hay cero, solo las coincidencias exactas entre los cinco elegidos reciben peso. Los empates conservan el orden de entrenamiento. Promedia precios, no elige el vecino más caro ni el promedio de toda una marca. No hay un filtro obligatorio de misma marca o modelo.

**¿Qué pasa si faltan opcionales?** Motor, potencia, puertas y plazas reciben sus medianas de entrenamiento; tracción recibe la moda. Se completa cada campo de manera independiente, no se deduce el motor exacto del modelo de auto. Los valores reales del modelo exportado están en el detalle técnico. Las seis entradas obligatorias no se imputan en el formulario: se solicitan a la persona.

**¿Por qué no puedo escribir cualquier modelo o año?** El formulario se limita a combinaciones marca–modelo y categorías presentes en entrenamiento y a los rangos exportados. Eso evita entradas ajenas al catálogo; no garantiza cobertura suficiente para cualquier combinación aceptada. Internamente el one-hot de Python puede ignorar categorías nuevas, pero la interfaz las rechaza. Puertas y plazas deben ser enteros.

**¿Qué significan los resultados?** MAE USD 1.499,30 es la diferencia absoluta promedio del test; RMSE USD 2.735,57 da más influencia a errores grandes. R² 0,9061 compara errores cuadrados contra predecir la media de ese test. No es un porcentaje de aciertos. El MAE tampoco es un intervalo de confianza ni una garantía de error máximo para un vehículo.

**¿Dónde falla más?** En este test, el nivel alto tuvo MAE USD 2.659,07 (292 avisos), frente a USD 789,89 en el bajo (245). Los autos de hasta cinco años respecto de 2024 tuvieron MAE USD 3.054,73. El sesgo promedio del tramo alto fue −USD 607,40. Son resultados de estos grupos y no explicaciones causales. Ver [desglose original](../resultados/errores_segmentos.csv).

**¿Por qué una ficha de entrenamiento puede dar un precio distinto al aviso?** Al omitir especificaciones se consulta otro vector, con valores imputados. Además pueden existir varias fichas con características iguales y precios diferentes. Con distancia cero se promedian esas coincidencias entre los vecinos elegidos. Un ejemplo conocido no evalúa generalización.

**¿Qué hace cada archivo?** `src/autos.py` implementa limpieza y aprendizaje en Python. El notebook lo usa y genera resultados. `presentacion/exportar.py` incorpora el modelo ajustado, tablas y figuras en la plantilla. `presentacion/modelo.js` reproduce las transformaciones y el cálculo; `app.js` valida y presenta. Abrir el HTML no entrena ni consulta Internet. La ficha permanece en memoria y no se guarda.

**¿Qué mejoraríamos?** Datos más recientes, estado e historial, revisión de contradicciones y evaluación posterior en otra muestra. No sabemos el precio final de venta ni mostramos intervalos calibrados. Esas mejoras están propuestas, no implementadas ni medidas.
