# Integración de las dos revisiones

Rama: codex/integracion-defensa. Base común: 1b05003f3ece1fde18c8bd218a4cc78cb212278c.

- Presentación: 90ec4e3eff84bab3bc4e0ed4387450e9bab9455e.
- Revisión académica: 27a524cfea00a3a2086dac8f409bc7b9b828642f.

Se hizo un merge de ambas ramas en un worktree independiente. No hubo conflictos textuales; sí tres diferencias que necesitaban conciliación funcional. Las ramas de origen y main se conservaron.

## Decisiones de integración

### Validación cruzada

Las corridas de Windows y macOS de las ramas originales informaron MAE de CV distintos. No se guardaron IDs originales por fold, por lo que no puede reconstruirse qué asignación produjo cada cifra. La implementación de GroupKFold sin shuffle ordena tamaños de grupos con np.argsort sin ordenar explícitamente los empates. Esto es una dependencia que conviene evitar, pero no se declara como causa única demostrada de toda diferencia histórica.

Se eligió GroupKFold(n_splits=5, shuffle=True, random_state=42) y se registraron los IDs completos de cada partición. Se mantiene la separación de test original y se usa exclusivamente CV en train para seleccionar. El cambio se hizo por reproducibilidad, no para mejorar el resultado de test. No se añadieron nuevos modelos ni hiperparámetros.

Se publicó una nueva corrida canónica: MAE CV de k-NN USD 1.536,72, en lugar de USD 1.504,65 de la versión anterior. La segunda ejecución local la reprodujo con tolerancia de USD 1e-8. El modelo final, el test y sus 831 predicciones coinciden con la base. No se afirma haber reproducido los folds históricos de Windows ni haber probado aún este nuevo reparto en ese sistema.

### Ejemplos y contrato del exportador

Las fichas de la defensa se fijan por ID en src.autos.ejemplos; demo_examples del exportador delega en esa función. Así, notebook, modelo guardado y HTML muestran la misma selección sin depender de empates de kilometraje.

El exportador conserva su interfaz de consola y admite main(argv=None). La prueba de la revisión académica lo llama con main([]) para no interpretar los argumentos de unittest. Se preservan campos, unidades, orden de variables, categorías y la regla de desempate de VecinosRegresor y modelo.js.

### Material de la exposición

Se conserva la explicación inicial debajo del estimador, el fragmento real de código y las mejoras de formulario y navegación. Se regeneró el HTML desde las fuentes y el modelo integrado. Se actualizaron el guion, las preguntas frecuentes, la matriz y la documentación para reflejar el nuevo CV y la limitación de las 14 fichas con predictores coincidentes.

## Resultado y evidencia

| Modelo | MAE CV (USD) | MAE test (USD) | RMSE test (USD) | R² test |
|---|---:|---:|---:|---:|
| Baseline mediana | 4.610,23 | 5.502,45 | 9.523,42 | -0,1384 |
| Regresión lineal | 1.985,46 | 2.242,45 | 4.251,97 | 0,7731 |
| k-NN | 1.536,72 | 1.499,30 | 2.735,57 | 0,9061 |

- Notebook completo, 11 celdas de código, sin errores; nbformat válido.
- Siete pruebas de Python aprobadas.
- 831 predicciones y 887 fichas válidas: paridad Python–JavaScript con error máximo USD 0.
- 24 inválidos, cuatro casos de coincidencias/empates y dos modelos alternativos comprobados.
- HTML autónomo probado sin red en Chromium: trece secciones, escritorio y móvil, formulario, foco y controles; cero errores JS y cero solicitudes HTTP.
- Capturas de los elementos afectados revisadas. Teléfono físico, otros navegadores y repetición de esta integración en Windows quedan fuera de la comprobación realizada.

SHA-256 del HTML final: `fb35ef8dc311dd487ad2421d6aa0c8154b2f3ee580f52a0b51d98540ab2f8456`.

## Reproducción

Desde la raíz, con Python 3.12. Crear un entorno, instalar requirements.txt y verificar pip check. Registrar un kernel local al entorno para no usar inadvertidamente otro Python:

```sh
python -m ipykernel install --prefix .venv --name tp-autos --display-name "TP Autos"
python -m nbconvert --execute --to notebook --inplace --ExecutePreprocessor.kernel_name=tp-autos TP_autos.ipynb
python -m presentacion.exportar
python -m unittest discover -s tests -v
python estimar.py --marca Volkswagen --modelo 'Up!' --anio 2014 --km 108000 --combustible Nafta --transmision Manual
```

Los comandos presuponen el entorno activado. En Windows se puede usar explícitamente .venv/Scripts/python.exe; en macOS/Linux, .venv/bin/python. Para la prueba de JavaScript de unittest, Node debe estar en PATH.

Para la prueba completa de navegador, con Playwright y Chromium disponibles fuera de las dependencias de la herramienta:

```sh
python tests/test_presentacion_defensa.py --modelo resultados/modelo.joblib --salida /tmp/defensa-integrada.json
PLAYWRIGHT_MODULE=/ruta/playwright CHROMIUM_EXECUTABLE=/ruta/chromium node tests/presentacion_defensa.cjs /tmp/defensa-integrada.json /tmp/capturas-integradas
```

Adaptar las rutas temporales y variables de entorno a Windows. Playwright y Node son herramientas de comprobación: el HTML final abre sin instalación ni red.

En esta sesión se usaron el entorno /private/tmp/tp-autos-presentacion-env, configuración y kernel temporales, y /private/tmp/tp-autos-integracion para informes y capturas. El modelo joblib se regeneró localmente y continúa ignorado por Git. Los archivos originales del dataset y la consigna conservan sus bytes. La cobertura docente y sus extensiones están descritas en la matriz académica; no se atribuyen temas nuevos a la cursada.
