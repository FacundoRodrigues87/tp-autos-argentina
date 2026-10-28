# Guía para discutir el trabajo

Antes de entregar, cada integrante debería ejecutar el notebook y poder responder con sus propias palabras:

1. **Qué predecimos:** precio publicado, no venta cerrada. No hay registros de compradores ni de satisfacción.
2. **Por qué este dataset:** 20 columnas y 2.059 avisos permiten trabajar especificaciones y preferencias. El costo es cambiar de mercado: India, sin afirmar precios argentinos.
3. **Qué se conserva:** CSV original y metadata. Las transformaciones ocurren en una copia.
4. **Cómo tratamos los nulos:** imputación ajustada dentro del entrenamiento; un faltante de plazas no satisface un filtro de plazas.
5. **Por qué k-NN necesita escala:** distancia entre kilómetros y otras unidades; StandardScaler evita que una escala numérica grande domine por sí sola.
6. **Qué es el baseline:** predecir la mediana del conjunto de entrenamiento para todos los autos.
7. **Cómo evitamos fuga:** grupos de marca, modelo y año separados entre train y test, y entre folds de validación. El precio no entra como predictor.
8. **Cómo elegimos el modelo:** menor MAE de validación cruzada en train. Las métricas de test describen la decisión ya tomada.
9. **Qué significa R²:** comparación del error cuadrático con el de predecir la media; no es porcentaje de aciertos.
10. **Qué hace el recomendador:** descarta opciones incompatibles y ordena las restantes por una regla de precio, año y kilometraje. Sus pesos los decide la persona; no se aprendieron con datos de usuarios.
11. **Qué falta medir:** utilidad del ranking con personas reales y casos de preferencias representativos.
12. **Por qué no hay serie temporal:** Year es año del vehículo; no hay fecha individual del aviso. No son observaciones del mercado a lo largo del tiempo.
13. **Qué no sabemos:** moneda documentalmente confirmada, fecha de captura de cada aviso, mantenimiento, seguridad, precios vigentes o ventas finales.

Completar con las decisiones que el grupo adopte, casos propios y observaciones del instructor. No memorizar métricas sin entender su denominador y sus unidades.
