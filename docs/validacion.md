# Verificación de la versión integrada

Se integraron presentación (90ec4e3) y revisión académica (27a524c), ambas desde 1b05003. La ejecución conjunta se hizo en macOS ARM64 con Python 3.12.14 y las versiones de requirements.txt. pip check pasó.

## Notebook y separación

Se ejecutaron las 11 celdas de código de TP_autos.ipynb en orden, sin errores, y se validó el archivo con nbformat. El CSV conserva la huella original. Permanecen 4.044 avisos, con 3.213 en entrenamiento y 831 en test. No hay IDs ni claves marca/modelo/versión/año compartidos entre esos conjuntos ni entre ajuste y validación.

La validación usa GroupKFold con shuffle=True y semilla 42. Se guardan todos los IDs de ajuste y validación por fold, además de los de train/test. Cada grupo queda completo en un fold y cada fila de train se valida una vez. Los tamaños de validación son 640, 674, 634, 648 y 617: se mezclan grupos completos, no se exige igual cantidad de filas.

La selección repetida en una segunda corrida local reprodujo los MAE de CV guardados con tolerancia absoluta de USD 1e-8. El protocolo de CV cambió respecto de las ramas iniciales: no se atribuye esa diferencia a una mejora del modelo. El test reservado, el ganador k-NN con cinco vecinos por distancia y sus 831 predicciones permanecen iguales.

| Modelo | MAE CV (USD) | MAE test (USD) | RMSE test (USD) | R² test |
|---|---:|---:|---:|---:|
| Baseline mediana | 4.610,23 | 5.502,45 | 9.523,42 | -0,1384 |
| Regresión lineal | 1.985,46 | 2.242,45 | 4.251,97 | 0,7731 |
| k-NN | 1.536,72 | 1.499,30 | 2.735,57 | 0,9061 |

## Pruebas conjuntas

Pasaron siete pruebas de unittest: integridad y limpieza; disjunción y cobertura de folds; ajuste de transformaciones solo dentro de train; coincidencias y empates; IDs comparados con la corrida guardada; ejemplos estables compartidos entre Python y exportador; exportación y paridad del cálculo JavaScript.

Chromium abrió el HTML real por file:// con la red desactivada. El verificador comparó 831 predicciones de test y 887 fichas válidas contra Python: diferencia máxima USD 0, con tolerancia requerida de 1e-8. Verificó 24 entradas inválidas, cuatro casos de coincidencias/empates y las rutas alternativas de mediana y regresión lineal.

Pasaron controles de las trece secciones, todos los selectores, vecinos, envío, limpieza, eventos input/change, mensajes, foco, Tab/Enter/Escape, navegación sin nuevas pestañas y movimiento reducido. Se probaron escritorio 1440×900, tamaños móviles 390×844 y 320×844, toque emulado y texto ampliado. No hubo errores JavaScript ni solicitudes HTTP. Se revisaron visualmente capturas de métricas, estimador, conclusiones y explicación inicial en escritorio/móvil. No se comprobó un teléfono físico ni otros navegadores.

La consola devolvió USD 7.927,05 para Volkswagen Up! 2014, 108.000 km, Nafta y Manual con opcionales vacíos. Los ejemplos se fijan por ID desde una única función de Python, que también usa el exportador.

## Límites que siguen vigentes

Hay 14 fichas de test con los mismos 11 predictores crudos que alguna ficha de train en otro grupo. La versión integra la clave pero no X: cero grupos compartidos no garantiza vehículos físicos distintos. Se informa ese límite sin retirar filas en función de sus errores.

Las métricas comparan precios pedidos históricos en un recorte de usados en USD. No validan precios finales de venta, datos actuales ni todos los vehículos posibles. Persisten las contradicciones del aviso Ka/Focus y las limitaciones de cobertura. El MAE no es un intervalo de confianza. En esta integración no se repitió la corrida completa en Windows; los IDs registrados permiten cotejarla.

Ver [integración y reproducción](integracion-defensa.md) y [matriz académica](alineacion-materia.md).
