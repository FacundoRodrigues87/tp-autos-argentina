# Guía de defensa

- **¿Qué aprende el modelo?** Una estimación del precio pedido en USD a partir de seis números y cinco categorías. El valor de cierre depende de información que el dataset no registra.
- **¿Por qué imputar dentro del Pipeline?** Cada fold tiene su propia porción de ajuste. Las medianas, modas y escalas de esa porción también se aplican a su validación.
- **¿Cómo evitamos compartir grupos?** Marca, modelo, versión y año forman una clave. El test se separa primero y los folds se construyen después dentro del entrenamiento.
- **¿Por qué escalar?** Año, kilómetros y potencia tienen unidades diferentes. La distancia se calcula después de estandarizar los números y codificar las categorías.
- **¿Cómo se elige k-NN?** Se prueban seis configuraciones. El menor MAE promedio de validación se compara con el de la regresión lineal y la mediana.
- **¿Qué interpreta cada métrica?** MAE y RMSE se leen en USD. R² compara el error cuadrático con el de usar la media de prueba. Un R² de 0,9061 no representa un porcentaje de precios acertados.
- **¿Cuándo falla más?** El MAE es mayor en los avisos de precio alto y en autos de hasta cinco años en este test. El tamaño del grupo, el sesgo y los casos individuales ayudan a leer cada diferencia.
- **¿De dónde salen las opciones del formulario?** Las combinaciones marca–modelo y las categorías provienen del entrenamiento. Los opcionales vacíos reciben la misma imputación del Pipeline.
- **¿Cómo calcula el navegador?** Aplica los parámetros exportados del Pipeline y vuelve a buscar los vecinos sobre los vectores del entrenamiento. Se desempata por el orden de esos registros.
- **¿Qué fecha representa 2024?** Es el año del corte del dataset. El año de cada fila corresponde al vehículo.

El [guion de la presentación](../presentacion/guion.md) incluye el reparto y los casos para mostrar.
