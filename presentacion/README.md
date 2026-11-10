# Presentación HTML

Una vez generado el archivo local `presentacion.html`, abrilo con doble clic. El archivo incluye estilos, datos, gráficos, animaciones y estimador. Se puede presentar sin red desde escritorio o móvil. El [guion](guion.md) está separado.

Para regenerarlo, ejecutá el notebook y luego `python -m presentacion.exportar` desde la raíz con el mismo entorno de Python. El exportador incorpora las tablas de resultados y el modelo ajustado en la plantilla `layout.html.in`, junto con `estilos.css`, `modelo.js` y `app.js`.
