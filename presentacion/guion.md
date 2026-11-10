# Guion de exposición

El proyecto estima **precios de publicación de usados en USD**. La presentación acompaña al notebook; el notebook contiene el análisis y es el entregable principal. Fuente de la consigna: **PY-002**, [Word original](../docs/consigna.docx), P006, P016–P026 y P028–P039. La defensa pide 20–25 minutos con preguntas y que todos puedan explicar cualquier parte (P033–P034).

Conservamos seis integrantes, sin asignar nombres. Los bloques suman **19 minutos**; reservar 3–5 minutos para preguntas da 22–24 minutos. Ensayar el recorrido y ajustar el ritmo, sin convertir los tiempos sugeridos en criterios de evaluación.

**Control pendiente antes de entregar:** los CSV guardados y el HTML coinciden. La reproducción local confirmó ganador, las 831 predicciones y métricas de prueba, pero dio otros MAE de validación cruzada. Las cifras de CV de abajo son las **guardadas**, no una reproducción exacta. Consultar [el handoff](../docs/handoff-presentacion.md); al integrar la revisión de Python se debe conciliar esta diferencia y regenerar el HTML. Si preguntan por ella, explicarla sin afirmar que ya está resuelta.

## Integrante 1 · Secciones 1 a 3 · 3 min

1. **Portada.** «Queremos ayudar a poner un precio de publicación a un usado. Estimamos un número en dólares a partir de sus características». Aclarar desde el comienzo que son avisos históricos, con actualización del dataset en febrero de 2024.
2. **Problema.** Comparar solo por modelo no alcanza: importan año, kilómetros y características. La variable objetivo es `price`, el importe pedido. Estado, mantenimiento, negociación y precio final de venta no están registrados para este uso. El sistema actual estima precios; no recomienda autos según preferencias.
3. **Datos.** Una fila es un aviso. Ariel Rasgido reunió publicaciones mediante la API pública de Mercado Libre Argentina y publicó el dataset en Kaggle. El original tiene 10.191 filas y 25 columnas. Elegimos usados ya publicados en USD: 4.047 filas. No convertimos los avisos en pesos con un tipo de cambio actual. Después de limpiar quedan 4.044. `X` contiene seis números y cinco categorías; `y`, el precio. La versión se usa para agrupar, no como predictor.

**Transición:** «Antes de comparar modelos, revisamos qué significaban los datos y qué errores traían».

## Integrante 2 · Secciones 4 a 6 · 4 min

4. **Limpieza.** Explicar las tres exclusiones: una repetición de ID, el Corsa con año imposible y un Fiat Uno cuyo importe era un anticipo. El duplicado mantiene una contradicción: el campo dice Ka y el título Focus III. Deduplicar no corrige esa inconsistencia. Los otros 23 títulos que ofrecen financiación permanecen. Una especificación imposible pasa a faltante; no siempre elimina la fila. Mostrar «1.6 110CV» → 1,6 L y las 60.252 puertas → faltante. Los precios extremos no se descartaron solo por ser extremos.
5. **Distribución.** La mediana de la muestra limpia es USD 8.700 y la media, aproximadamente USD 10.896. La mitad central está entre USD 6.100 y USD 13.000. La cola de precios altos eleva la media. Abrir el detalle del notebook si preguntan por los boxplots. Esos puntos alejados de los cuartiles no equivalen automáticamente a errores de carga.
6. **Relaciones.** Alternar año, kilómetros y potencia. Señalar que a un mismo año hay precios muy diferentes: asociación no implica una regla exacta ni causalidad. En el detalle están el mapa de correlaciones y el barplot con `groupby + agg`. La tabla incluye cuántos avisos aporta cada marca; sus medianas mezclan modelos y edades diferentes.

**Transición:** «Con estas variables probamos si un modelo mejora una referencia sencilla».

## Integrante 3 · Secciones 7 y 8 · 3 min

7. **Algoritmos.** El baseline predice siempre la mediana **del entrenamiento**, USD 8.500; no es la mediana de USD 8.700 de la muestra completa. La regresión lineal suma un intercepto y contribuciones aprendidas. k-NN busca fichas próximas y promedia sus precios. Se evaluaron ocho configuraciones: baseline, lineal y seis k-NN (5, 15 y 35 vecinos, con pesos uniformes o por distancia). En los resultados guardados ganó k-NN con 5 y distancia, MAE de CV USD 1.504,65. Explicar el control de reproducción pendiente si se abre esa tabla.
8. **Separación.** Primero se reservan 831 avisos para prueba y quedan 3.213 para entrenamiento: 20,55 % y 79,45 %. Marca, modelo, versión y año forman un grupo que no se reparte entre ambos. Dentro de entrenamiento se usa validación cruzada agrupada de cinco folds. Cambiar el fold: unas 2.570 filas ajustan y unas 643 validan. En cada ajuste se aprenden medianas, modas, escalas y categorías. El test no decide el modelo. La separación es aleatoria por grupos, no una prueba sobre un período futuro.

**Transición:** «Veamos qué significa comparar fichas cercanas».

## Integrante 4 · Sección 9 · 2 min

9. **Vecinos.** Revelar las cinco filas. La ficha de demostración proviene de entrenamiento y omite los opcionales; sirve para explicar el mecanismo, no para medir generalización. Los números faltantes reciben medianas y la tracción, la moda del entrenamiento. Después se estandariza cada número restando su media y dividiendo por su desviación. Las categorías pasan a indicadores 0/1. Así kilómetros no domina por tener números grandes.

   La distancia es euclídea sobre ese vector. El peso parte de `1 / distancia` y luego se divide por la suma de los pesos. Cada aporte es precio del vecino × peso normalizado; se suman los aportes sin redondear. Si hay distancia cero, solo las coincidencias exactas entre los vecinos elegidos reciben peso. Los empates conservan el orden de entrenamiento. Una categoría igual suma cercanía; no obliga a que todos los vecinos sean de la misma marca o modelo.

**Transición:** «El ejemplo muestra cómo calcula; la prueba reservada muestra cuánto se equivoca».

## Integrante 5 · Secciones 10 y 11 · 4 min

10. **Métricas.** Alternar MAE, RMSE y R². En los 831 avisos de prueba, k-NN obtuvo **MAE USD 1.499,30**, **RMSE USD 2.735,57** y **R² 0,9061**. MAE es el error absoluto promedio; RMSE amplifica los errores grandes. Ambos están en USD. R² compara el error cuadrático con el de predecir la media de ese test: puede ser negativo y no significa «90,61 % de aciertos». El baseline tuvo MAE USD 5.502,45; el de k-NN fue aproximadamente 72,8 % menor. No presentar el MAE como un intervalo garantizado para un auto particular.
11. **Errores.** Seleccionar el Fiat Uno 1994, publicado a USD 29.000 y estimado cerca de USD 7.517: subestimación de unos USD 21.483. Es distinto del Uno excluido por anticipo. Se conservó porque no hubo evidencia suficiente para quitarlo por precio. El tramo alto tuvo MAE USD 2.659,07 con 292 avisos; el bajo, USD 789,89 con 245. Los cortes USD 6.800 y USD 11.000 se calcularon en entrenamiento. El sesgo es estimado menos publicado; negativo indica subestimación promedio. La antigüedad se calcula respecto de 2024, no del día de la defensa.

**Transición:** «Con esas limitaciones claras podemos usar el estimador como referencia».

## Integrante 6 · Secciones 12 y 13 · 3 min

12. **Estimador.** Leer primero «Cómo funciona esta estimación», visible sin completar la ficha. Cargar **manualmente** Volkswagen / Up! / 2014 / 108000 km / Nafta / Manual, con los cinco opcionales vacíos. Pulsar «Estimar precio»: **USD 7.927,05** en esta base. También se puede elegir la segunda ficha del selector, el mismo Up! sin opcionales. Las fichas se fijaron por ID para repetir la demostración. Abrir los vecinos. Cambiar kilómetros: el importe anterior desaparece y hay que volver a estimar. Mostrar una entrada inválida o «Limpiar ficha» si el tiempo alcanza. El detalle técnico incorpora un fragmento real de `src/autos.py`, no pseudocódigo.

   Python limpia, entrena y evalúa; `presentacion/exportar.py` copia parámetros y resultados al HTML; `presentacion/modelo.js` calcula en el navegador. Sin API, reentrenamiento ni consulta de precios actuales durante la demostración.
13. **Cierre.** «El modelo mejora al baseline en este test y aporta una referencia de precios pedidos históricos. Vimos errores mayores en segmentos caros y recientes. Para mejorar proponemos registrar estado e historial, revisar contradicciones y evaluar con datos nuevos». Son propuestas, no mejoras ya implementadas ni resultados prometidos. La ficha de la fuente, licencia declarada y huella del CSV están al final.

Dejar [la guía de demostración y preguntas](../docs/demostracion-presentacion.md) a mano. Todos deben poder explicar baseline, separación, preprocesamiento y límites, aunque hayan expuesto otro bloque.
