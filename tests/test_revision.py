from collections import Counter
import json
from pathlib import Path
import re
import shutil
import subprocess
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer

from presentacion import exportar
from src.autos import (
    CATEGORICAS, PREDICTORAS, COLUMNAS_GRUPO, NUMERICAS, RESULTADOS, ANIO_CORTE,
    VecinosRegresor, cargar, estimar, ejemplos, ficha, limpiar, seleccionar, separar,
)


class PruebasRevisionPrograma(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = cargar()
        cls.avisos, cls.auditoria = limpiar(cls.original)
        cls.particiones = separar(cls.avisos)

    def test_integridad_y_limpieza(self):
        self.assertEqual(self.original.shape, (10191, 25))
        self.assertEqual(len(self.avisos), 4044)
        self.assertTrue(self.avisos["id"].is_unique)
        self.assertTrue(self.avisos["condition"].eq("Usado").all())
        self.assertTrue(self.avisos["currency"].eq("USD").all())
        self.assertTrue(self.avisos["price"].gt(0).all())
        self.assertTrue(self.avisos["km"].ge(0).all())
        self.assertTrue(self.avisos["car_year"].between(1886, ANIO_CORTE).all())
        exclusiones = self.auditoria.loc[self.auditoria["accion"].eq("exclusión") & self.auditoria["cantidad"].gt(0)]
        self.assertEqual(exclusiones["ids"].tolist(), ["MLA1404982421", "MLA1639157994", "MLA1403304889"])

    def test_grupos_disjuntos_y_cobertura_de_las_rondas(self):
        entrenamiento, prueba = self.particiones.entrenamiento, self.particiones.prueba
        self.assertEqual((len(entrenamiento), len(prueba)), (3213, 831))
        self.assertTrue(set(entrenamiento["id"]).isdisjoint(prueba["id"]))
        self.assertEqual(set(entrenamiento["id"]) | set(prueba["id"]), set(self.avisos["id"]))

        def claves(tabla):
            return [tuple(str(valor).casefold() for valor in fila)
                    for fila in tabla[COLUMNAS_GRUPO].fillna("").itertuples(index=False, name=None)]

        claves_entrenamiento = claves(entrenamiento)
        self.assertTrue(set(claves_entrenamiento).isdisjoint(claves(prueba)))
        validadas = []
        for ajuste, validacion in self.particiones.rondas:
            self.assertTrue({claves_entrenamiento[posicion] for posicion in ajuste}.isdisjoint(claves_entrenamiento[posicion] for posicion in validacion))
            validadas.extend(validacion)
        self.assertEqual(sorted(validadas), list(range(len(entrenamiento))))

    def test_seleccion_ajusta_transformaciones_dentro_del_entrenamiento(self):
        # Usamos dos rondas para comprobar que la tabla se adapte
        # La seleccion solo necesita el entrenamiento
        solo_entrenamiento = SimpleNamespace(entrenamiento=self.particiones.entrenamiento, rondas=self.particiones.rondas[:2])
        ajustar_original = ColumnTransformer.fit_transform
        ajustes = Counter()

        def registrar_ajuste(transformador, predictores, precios=None, **parametros):
            resultado = ajustar_original(transformador, predictores, precios, **parametros)
            ajustes[tuple(predictores.index)] += 1
            numeros = transformador.named_transformers_["num"].named_steps
            medianas = predictores[NUMERICAS].median()
            imputados = predictores[NUMERICAS].fillna(medianas)
            np.testing.assert_allclose(numeros["imputar"].statistics_, medianas)
            np.testing.assert_allclose(numeros["escalar"].mean_, imputados.mean())
            np.testing.assert_allclose(numeros["escalar"].scale_, imputados.std(ddof=0))

            categorias = transformador.named_transformers_["cat"].named_steps
            np.testing.assert_array_equal(categorias["imputar"].statistics_, predictores[CATEGORICAS].mode().iloc[0])
            for campo, aprendidas in zip(CATEGORICAS, categorias["onehot"].categories_):
                self.assertEqual(aprendidas.tolist(), sorted(predictores[campo].dropna().unique()))
            return resultado

        with patch.object(ColumnTransformer, "fit_transform", registrar_ajuste):
            ganador, busquedas, validacion = seleccionar(solo_entrenamiento)

        columnas_rondas = [nombre for nombre in validacion if nombre.startswith("MAE_fold_")]
        self.assertEqual(columnas_rondas, ["MAE_fold_1", "MAE_fold_2"])
        self.assertEqual(ganador, validacion.iloc[0]["modelo"])
        np.testing.assert_allclose(validacion["MAE_CV"], validacion[columnas_rondas].mean(axis=1))
        ajustes_esperados = Counter({tuple(ajuste): len(validacion) for ajuste, _ in solo_entrenamiento.rondas})
        ajustes_esperados[tuple(solo_entrenamiento.entrenamiento.index)] = len(busquedas)
        self.assertEqual(ajustes, ajustes_esperados)

    def test_ids_de_particiones_coinciden_con_la_corrida_guardada(self):
        registradas = json.loads((RESULTADOS / "particiones.json").read_text(encoding="utf-8"))
        self.assertEqual(self.particiones.entrenamiento.id.tolist(), registradas["ids_train"])
        self.assertEqual(self.particiones.prueba.id.tolist(), registradas["ids_test"])
        for (ajuste, validacion), guardado in zip(self.particiones.rondas, registradas["folds"], strict=True):
            self.assertEqual(self.particiones.entrenamiento.iloc[ajuste].id.tolist(), guardado["ids_ajuste"])
            self.assertEqual(self.particiones.entrenamiento.iloc[validacion].id.tolist(), guardado["ids_validacion"])

    def test_demo_comparte_ids_y_no_depende_del_orden_de_filas(self):
        original = ejemplos(self.particiones.entrenamiento)
        mezclado = ejemplos(self.particiones.entrenamiento.sample(frac=1, random_state=7))
        self.assertEqual([fila["id"] for fila in original], [fila["id"] for fila in mezclado])
        for primero, segundo in zip(original, mezclado, strict=True):
            pd.testing.assert_series_equal(pd.Series(primero["vehiculo"]), pd.Series(segundo["vehiculo"]))

    def test_vecinos_respetan_empates_y_coincidencias_exactas(self):
        empatados = VecinosRegresor(2).fit([[1.0], [-1.0], [1.0]], [100, 200, 400])
        indices, distancias, pesos = empatados.vecinos([[0.0]])
        np.testing.assert_array_equal(indices, [[0, 1]])
        np.testing.assert_allclose(distancias, [[1.0, 1.0]])
        np.testing.assert_allclose(pesos, [[0.5, 0.5]])
        np.testing.assert_allclose(empatados.predict([[0.0]]), [150.0])

        exactos = VecinosRegresor(3, "distance").fit([[0.0], [0.0], [1.0]], [100, 300, 900])
        np.testing.assert_allclose(exactos.vecinos([[0.0]])[2], [[0.5, 0.5, 0.0]])
        np.testing.assert_allclose(exactos.predict([[0.0]]), [200.0])


@unittest.skipUnless(shutil.which("node"), "Node.js permite verificar el estimador del HTML")
class PruebasPresentacion(unittest.TestCase):
    def test_exportacion_y_calculo_javascript(self):
        archivo_modelo = RESULTADOS / "modelo.joblib"
        self.assertTrue(archivo_modelo.is_file(), "Ejecutá primero el notebook")
        guardado = joblib.load(archivo_modelo)
        casos = pd.read_csv(RESULTADOS / "catalogo_evaluacion.csv")
        codigo = (exportar.CARPETA_PRESENTACION / "modelo.js").read_text(encoding="utf-8")

        with TemporaryDirectory(prefix="tp-autos-export-") as directorio:
            raiz = Path(directorio)
            (raiz / "presentacion").mkdir()
            with patch.object(exportar, "RAIZ", raiz):
                exportar.main([])
            pagina = (raiz / "presentacion/presentacion.html").read_text(encoding="utf-8")

        self.assertIn(codigo, pagina)
        coincidencia = re.search(r'<script[^>]+id="data"[^>]*>(.*?)</script>', pagina, re.DOTALL)
        self.assertIsNotNone(coincidencia)
        datos_presentacion = json.loads(coincidencia.group(1))
        self.assertEqual(datos_presentacion["examples"], guardado["ejemplos"])
        opciones_validas = guardado["opciones"]
        fichas = [ejemplo["vehiculo"] for ejemplo in guardado["ejemplos"]]
        fichas.append({"brand": "Volkswagen", "model": "Up!", "car_year": 2014, "km": 108000,
                      "fuel_type": "Nafta", "transmission": "Manual"})

        codigo_prueba = """
const entrada = require("node:fs").readFileSync(0, "utf8");
const {data: datos, cases: casos, forms: fichas} = JSON.parse(entrada);
const modeloVecinos = datos.knn ?? datos.model;
const resultados = [];
for (const ficha of fichas) {
    const validacion = validarVehiculo(ficha, datos.options);
    if (Object.keys(validacion.errors).length) {
        throw new Error(JSON.stringify(validacion.errors));
    }
    const vehiculo = validacion.vehicle;
    const precio = predecir(vehiculo, datos.model).price;
    const vecinos = predecir(vehiculo, modeloVecinos).neighbors;
    resultados.push({price: precio, neighbors: vecinos.map(fila => fila.index)});
}
const empate = predecir({km: 0}, {
    kind: "knn", k: 2, weights: "distance", numeric: ["km"], categorical: [],
    median: [0], mean: [0], scale: [1], vectors: [[[1], []], [[-1], []], [[1], []]],
    prices: [100, 200, 400],
});
const rechazados = validarVehiculo({...fichas[0], km: -1}, datos.options).errors;
console.log(JSON.stringify({
    results: resultados,
    rejected: rechazados,
    tie: [empate.price, empate.neighbors.map(fila => fila.index)],
    predictions: casos.map(ficha => predecir(ficha, datos.model).price),
}));
"""
        argumentos = {"data": datos_presentacion, "cases": exportar.registros(casos[PREDICTORAS]), "forms": fichas}
        resultado = subprocess.run(["node", "-e", codigo + codigo_prueba], input=json.dumps(argumentos), text=True,
                                encoding="utf-8", capture_output=True, timeout=60)
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        resultado_js = json.loads(resultado.stdout)
        np.testing.assert_allclose(resultado_js["predictions"], casos["precio_estimado"], rtol=0, atol=1e-8)
        self.assertEqual(resultado_js["tie"], [150, [0, 1]])
        self.assertIn("km", resultado_js["rejected"])

        vecinos = guardado["comparacion_knn"].named_steps
        for formulario, obtenido in zip(fichas, resultado_js["results"], strict=True):
            self.assertAlmostEqual(obtenido["price"], estimar(guardado["modelo"], opciones_validas, formulario), delta=1e-8)
            vector = vecinos["preparar"].transform(ficha(formulario, opciones_validas))
            self.assertEqual(obtenido["neighbors"], vecinos["modelo"].vecinos(vector)[0][0].tolist())
