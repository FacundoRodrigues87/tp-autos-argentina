# Guion de exposición

## Integrante 1 · Secciones 1 a 3 · 3 min

1. **Portada.** Abrí con «¿Qué precio le pongo a mi auto usado?».
2. **Problema.** Explicá qué diferencias entre autos afectan la comparación de avisos. Definí el objetivo como precio de publicación.
3. **Datos.** Una fila corresponde a un aviso. Mostrá cómo se pasa de 10.191 publicaciones a 4.047 usadas en USD y a 4.044 después de limpiar. Distinguí los predictores de la versión, que se usa para agrupar.

## Integrante 2 · Secciones 4 a 6 · 4 min

4. **Limpieza.** Mostrá el ID duplicado, el Corsa con año y puertas imposibles y el Fiat Uno cuyo importe era un anticipo. Cambiá el ejemplo de transformación para mostrar el paso de texto a número y el tratamiento de un dato inválido.
5. **Distribución.** Leé el intervalo central y compará media con mediana. La cola alta explica por qué la media se desplaza.
6. **Relaciones.** Alterná entre año, kilómetros y potencia. Elegí un valor del eje y señalá la dispersión de precios que aparece allí.

## Integrante 3 · Secciones 7 y 8 · 3 min

7. **Algoritmos.** Explicá qué información usa la mediana, qué aprende la regresión lineal y qué compara k-NN. Abrí las ocho configuraciones. k-NN con 5 vecinos y pesos por distancia tuvo el menor MAE de validación.
8. **Particiones.** Mostrá los 3.213 avisos de entrenamiento y 831 de prueba. Cambiá el fold y explicá que se recalculan las transformaciones en el bloque de ajuste. Marca, modelo, versión y año definen cada grupo.

## Integrante 4 · Sección 9 · 2 min

9. **Vecinos.** Revelá cada fila y señalá distancia, peso y aporte al precio. Para distancias positivas se normaliza la inversa de la distancia. Si alguna vale cero, el peso se reparte entre las coincidencias exactas. El ejemplo usa una ficha de entrenamiento con opcionales omitidos.

## Integrante 5 · Secciones 10 y 11 · 4 min

10. **Métricas.** Alterná MAE, RMSE y R². Explicá que el MAE de prueba de k-NN fue USD 1.499,30, el RMSE fue USD 2.735,57 y el R² fue 0,9061.
11. **Errores.** Seleccioná el Fiat Uno 1994, publicado a USD 29.000 y estimado cerca de USD 7.517. El aviso quedó en la muestra y el modelo lo subestimó. Mostrá que el tramo de precio alto tuvo un MAE de USD 2.659, frente a USD 790 en el bajo, con 292 y 245 avisos respectivamente.

## Integrante 6 · Secciones 12 y 13 · 3 min

12. **Estimador.** Cargá el Volkswagen Up! 2014 con 108.000 km, Nafta y Manual. Pulsá «Estimar precio». Debería aparecer USD 7.927,05 con las especificaciones opcionales imputadas. Abrí el detalle de vecinos y cambiá un dato para volver a estimar.
13. **Cierre.** Retomá la pregunta de la portada. La estimación aporta una referencia de avisos comparables. Señalá que el error crece en el tramo alto y que el modelo describe un recorte histórico de publicaciones. Dejá la sección de procedencia a mano para las preguntas.
