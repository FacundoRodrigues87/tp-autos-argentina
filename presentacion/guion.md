# Guion para la defensa del TP

Este es el texto para practicar la exposición siguiendo las 13 secciones del HTML. Las indicaciones **Mostrar** son acciones, no frases para leer. Se reparte en seis bloques: 19 minutos de exposición y demostración, más 3–5 minutos para preguntas. Los tiempos son objetivos de ensayo; no se alcanzan leyendo solamente el texto. Asignen un nombre a cada bloque.

El vocabulario y los conceptos del discurso se apoyan en la [revisión del material de clase](../docs/alineacion-materia.md): carga de datos, limpieza, estadística descriptiva, gráficos, agrupaciones, regresión, vecinos, escalado, validación y métricas. El código tiene algunas decisiones adicionales cuya cobertura en clase no está acreditada. No se presentan como temas vistos: quedan documentadas en esa revisión y en la guía de defensa para responder con honestidad si el docente las pregunta.

## Integrante 1 — Problema y datos — 3 minutos

### 1. Portada

**Decir:**

“Para este trabajo nos planteamos una pregunta: ¿qué precio de publicación podría tener un auto usado según sus características? Trabajamos con avisos de Mercado Libre Argentina y usamos Python para revisar los datos, analizarlos y comparar modelos que estiman ese precio.

El resultado es una referencia basada en los avisos del dataset. No es el precio al que finalmente se vendió el auto ni una cotización actual.”

### 2. Qué queremos predecir

**Mostrar:** la pregunta del proyecto y las características del vehículo.

**Decir:**

“Es un problema de regresión porque queremos obtener un número: el precio en dólares. Esa es nuestra variable objetivo. Para estimarla usamos información del auto, como año, kilómetros, marca, modelo, combustible y transmisión.

La idea es comprobar si usar esas características permite estimar mejor que dar siempre un mismo precio. También queremos entender en qué casos la estimación se equivoca más.”

### 3. De dónde salen los datos

**Mostrar:** fuente, cantidad de filas y columnas.

**Decir:**

“El dataset es público y está publicado en Kaggle por Ariel Rasgido. Cada fila representa un aviso y cada columna una característica. El archivo original tiene 10.191 filas y 25 columnas; incluye números y categorías.

Elegimos autos usados publicados directamente en dólares para comparar importes en la misma moneda. No mezclamos pesos y dólares ni convertimos avisos históricos con una cotización de hoy. Ese recorte tiene 4.047 avisos antes de la limpieza. La versión del dataset es de febrero de 2024.

Cargamos el CSV con pandas. La fuente y las instrucciones para ejecutar el trabajo están en el notebook.”

**Transición:** “Antes de analizar precios, revisamos la calidad de esos datos.”

## Integrante 2 — Limpieza y análisis exploratorio — 4 minutos

### 4. Limpieza

**Mostrar:** resumen de limpieza y un ejemplo de conversión.

**Decir:**

“Revisamos los tipos de datos, los valores vacíos, los duplicados y los valores que no tenían sentido. Algunos números venían como texto acompañado de unidades, así que los convertimos para poder calcular.

Quitamos una repetición de un aviso, un registro con un año imposible y otro cuyo precio era un anticipo, no el precio completo. Después de estas exclusiones quedaron 4.044 avisos.

Si una característica opcional tenía un valor imposible, la dejamos como faltante. Por ejemplo, un auto no puede tener 60.252 puertas. Para las características faltantes usamos la mediana cuando son numéricas y el valor más frecuente cuando son categorías, tomando esos valores de los datos de entrenamiento.

No eliminamos un precio solo por ser muy alto o muy bajo: un valor extremo puede ser real. También registramos las decisiones para poder explicar qué cambió.”

### 5. Cómo se distribuyen los datos

**Mostrar:** histograma de precios; abrir también histogramas y boxplots del notebook.

**Decir:**

“Calculamos medidas descriptivas y usamos gráficos para entender la muestra. El histograma permite ver en qué intervalos se concentran los precios. La mediana es de 8.700 dólares y la media es de aproximadamente 10.896. La media es mayor porque los precios altos la empujan hacia arriba.

La mitad central de los avisos está entre 6.100 y 13.000 dólares. El boxplot ayuda a ver esa parte central y los valores más alejados. Hicimos el mismo tipo de revisión para los kilómetros.

Estas medidas describen nuestra muestra; no representan necesariamente a todos los autos del país.”

### 6. Relaciones y agrupaciones

**Mostrar:** dispersión por año y kilómetros; mapa de correlaciones y barras por marca en el detalle.

**Decir:**

“Después analizamos las variables de a pares. Cada punto del gráfico representa un aviso. Comparamos el precio con el año y con los kilómetros. Para un mismo año podemos ver distintos precios: una sola característica no alcanza para explicar todo.

La correlación resume la dirección y la intensidad de una relación lineal. Una asociación no demuestra que una variable cause el precio.

También usamos groupby y agg para agrupar por marca y por modelo y calcular cantidad de avisos, media y mediana. El gráfico de barras compara las medianas por marca. Hay que mirar también cuántos avisos tiene cada grupo, porque las marcas incluyen distintos modelos y edades.

No hicimos una serie temporal: el año es el de fabricación del auto, no la fecha del aviso. No permite saber cómo cambió el precio a lo largo del tiempo.”

**Transición:** “Con los datos revisados, pasamos a comparar modelos.”

## Integrante 3 — Modelos y evaluación — 3 minutos

### 7. Qué modelos comparamos

**Mostrar:** referencia simple, regresión lineal y k-NN.

**Decir:**

“Primero usamos una referencia sencilla, o baseline: estimar siempre la mediana de los precios de entrenamiento, que es de 8.500 dólares. Sirve para comprobar si un modelo más elaborado aporta una mejora.

Probamos regresión lineal, que relaciona las características con el precio mediante una combinación de sus valores. También probamos k-NN, que busca autos cercanos según las características y combina sus precios.

En k-NN probamos 5, 15 y 35 vecinos. Comparamos darles el mismo peso o dar más importancia a los más cercanos. La elección fue cinco vecinos con mayor peso para los cercanos, porque obtuvo el menor error promedio de validación.”

### 8. Cómo separamos y validamos

**Mostrar:** entrenamiento, prueba y una ronda de validación.

**Decir:**

“Separamos 3.213 avisos para entrenamiento y 831 para prueba, aproximadamente el 80 y el 20 por ciento. El entrenamiento sirve para ajustar los modelos. La prueba permite evaluar después cómo funcionan con avisos que no se usaron para ajustarlos.

Para elegir entre las opciones usamos validación cruzada dentro del entrenamiento: lo dividimos en cinco partes y vamos alternando cuál se usa para validar. Comparamos el error promedio de esas rondas. Esto permite elegir sin usar la prueba para decidir qué modelo queda.

Los valores con los que completamos faltantes y ajustamos las escalas se calculan usando solamente la parte de entrenamiento que corresponde en cada ronda.”

**Transición:** “Ahora vamos a mostrar con un ejemplo cómo funcionan los vecinos.”

## Integrante 4 — Cómo estima k-NN — 2 minutos

### 9. Los cinco vecinos

**Mostrar:** revelar los cinco vecinos y señalar sus precios y aportes.

**Decir:**

“Para estimar el precio, k-NN compara las características del auto ingresado con las de los autos de entrenamiento. Elige los cinco más cercanos y combina sus precios. Los más cercanos tienen mayor importancia en el resultado.

Antes de comparar, ajustamos la escala de los números. Los kilómetros pueden tener valores de cientos de miles y otras características valores mucho más chicos. Sin escalado, el tamaño de los números podría dominar la comparación.

En esta tabla vemos cuáles son los vecinos y cómo participan en la estimación. Parecido no significa idéntico: pueden diferir en varias características.

Esta ficha es un ejemplo para entender el funcionamiento. Para saber cuánto se equivoca el modelo tenemos que mirar los resultados de prueba, no este ejemplo.”

**Transición:** “Veamos entonces qué pasó con los 831 avisos que reservamos.”

## Integrante 5 — Resultados y errores — 4 minutos

### 10. Métricas

**Mostrar:** alternar MAE, RMSE y R²; comparar los tres modelos.

**Decir:**

“Usamos tres medidas para evaluar. El MAE es el promedio de los errores absolutos: mide cuánto nos alejamos del precio publicado, sin importar si fue por arriba o por abajo. El modelo elegido obtuvo un MAE de 1.499,30 dólares.

El RMSE da más importancia a los errores grandes. Dio 2.735,57 dólares. Que sea mayor que el MAE nos ayuda a ver que hay casos con errores importantes.

El R² compara el error cuadrático del modelo con el de usar la media del conjunto evaluado. Obtuvimos 0,9061. No significa que acertamos el 90,61 por ciento de los precios.

La referencia que siempre estima la mediana tuvo un MAE de 5.502,45 dólares. k-NN redujo ese error aproximadamente un 72,8 por ciento en esta prueba.

El MAE es un promedio del conjunto: no garantiza que cada estimación se equivoque menos de 1.499 dólares.”

### 11. Dónde falla

**Mostrar:** gráfico de precio publicado frente a estimado, segmentos y caso del Fiat Uno.

**Decir:**

“En este gráfico, cuanto más cerca está un punto de la diagonal, más cerca está la estimación del precio publicado. Los puntos alejados muestran errores mayores.

No nos quedamos solo con un promedio general: agrupamos los errores por marca, antigüedad y nivel de precio. Los avisos del tramo de precios altos tuvieron más error promedio que los del tramo bajo.

Un ejemplo es un Fiat Uno de 1994 publicado a 29.000 dólares que el modelo estimó cerca de 7.517. Es un error grande. Lo conservamos porque no teníamos evidencia suficiente para decir que el precio era un error de carga. Es un aviso distinto del que excluimos por indicar un anticipo.

El modelo usa las características disponibles. No conoce el estado real del auto, el mantenimiento ni otras condiciones que podrían ayudar a explicar un caso particular.”

**Transición:** “Con esos resultados y límites claros, mostramos la herramienta.”

## Integrante 6 — Demostración y cierre — 3 minutos

### 12. Uso del estimador

**Mostrar:** ingresar Volkswagen, Up!, año 2014, 108000 km, Nafta y Manual. Dejar vacíos los campos opcionales. Pulsar Estimar precio y abrir los vecinos.

**Decir:**

“Ingresamos las características del auto. Los campos opcionales pueden quedar vacíos; en ese caso se completan con los valores calculados durante el entrenamiento.

Para este ejemplo obtenemos 7.927,05 dólares. Podemos ver los autos utilizados como referencia. Si cambiamos un dato, tenemos que volver a estimar.

La herramienta permite usar el modelo que analizamos en el notebook. Funciona sin conexión y no está buscando avisos ni precios actuales mientras la usamos.”

**Mostrar:** cambiar kilómetros y volver a estimar. Señalar el nuevo resultado sin anticipar una cifra ni asegurar que siempre aumentará o bajará.

### 13. Conclusiones

**Decir:**

“Partimos de un dataset público, revisamos su calidad, limpiamos los datos y los exploramos con estadísticas, agrupaciones y gráficos. Después comparamos una referencia simple con regresión lineal y k-NN.

El modelo de cinco vecinos logró el menor error de validación y mejoró la referencia en la prueba reservada. También encontramos errores importantes, especialmente en algunos avisos caros.

El resultado es una referencia sobre precios publicados históricos. Para mejorar el trabajo incorporaríamos información del estado del vehículo, mantenimiento y avisos más recientes. Para estimar el precio realmente pagado necesitaríamos datos de ventas.

El notebook, el dataset, la fuente y las instrucciones están en el repositorio. Con esto cerramos la presentación y quedamos disponibles para las preguntas.”

## Preparación del grupo — no leer en la exposición

- Practicar con el HTML abierto: señalar los gráficos y explicar lo que se ve. No memorizar cifras sin entenderlas.
- Todos deben poder explicar la variable objetivo, un ejemplo de limpieza, media y mediana, un gráfico, la separación de datos, la referencia simple, k-NN y las tres métricas.
- Ensayar las transiciones y cronometrar el recorrido completo. Reservar las preguntas dentro de los 25 minutos.
- Confirmar la modalidad para seis integrantes y el acceso del docente al repositorio privado.
- El discurso evita detalles de programación web y de las clases auxiliares. Eso no elimina esas partes del código. Si el docente pregunta por una decisión adicional, consultar la [guía de defensa](../docs/guia_defensa.md) y distinguir lo trabajado en clase de las adaptaciones del proyecto; no afirmar que se vio algo sin respaldo.
