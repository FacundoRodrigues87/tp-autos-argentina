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
    CAT, FEATURES, GROUP, NUM, RESULTS, YEAR,
    VecinosRegresor, cargar, estimar, ejemplos, ficha, limpiar, seleccionar, separar,
)


class RevisionProgramaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = cargar()
        cls.data, cls.audit = limpiar(cls.raw)
        cls.parts = separar(cls.data)

    def test_integridad_y_limpieza(self):
        self.assertEqual(self.raw.shape, (10191, 25))
        self.assertEqual(len(self.data), 4044)
        self.assertTrue(self.data["id"].is_unique)
        self.assertTrue(self.data["condition"].eq("Usado").all())
        self.assertTrue(self.data["currency"].eq("USD").all())
        self.assertTrue(self.data["price"].gt(0).all())
        self.assertTrue(self.data["km"].ge(0).all())
        self.assertTrue(self.data["car_year"].between(1886, YEAR).all())
        exclusions = self.audit.loc[self.audit["accion"].eq("exclusión") & self.audit["cantidad"].gt(0)]
        self.assertEqual(exclusions["ids"].tolist(), ["MLA1404982421", "MLA1639157994", "MLA1403304889"])

    def test_grupos_disjuntos_y_cobertura_de_los_folds(self):
        train, test = self.parts.train, self.parts.test
        self.assertEqual((len(train), len(test)), (3213, 831))
        self.assertTrue(set(train["id"]).isdisjoint(test["id"]))
        self.assertEqual(set(train["id"]) | set(test["id"]), set(self.data["id"]))

        def keys(frame):
            return [tuple(str(value).casefold() for value in row)
                    for row in frame[GROUP].fillna("").itertuples(index=False, name=None)]

        train_keys = keys(train)
        self.assertTrue(set(train_keys).isdisjoint(keys(test)))
        validated = []
        for fit, val in self.parts.folds:
            self.assertTrue({train_keys[i] for i in fit}.isdisjoint(train_keys[i] for i in val))
            validated.extend(val)
        self.assertEqual(sorted(validated), list(range(len(train))))

    def test_seleccion_ajusta_transformaciones_dentro_de_train(self):
        # Dos folds bastan para probar el armado de la tabla sin asumir cinco.
        # El objeto deliberadamente carece de una partición de prueba.
        train_only = SimpleNamespace(train=self.parts.train, folds=self.parts.folds[:2])
        original_fit = ColumnTransformer.fit_transform
        fit_rows = Counter()

        def record_fit(transformer, X, y=None, **params):
            result = original_fit(transformer, X, y, **params)
            fit_rows[tuple(X.index)] += 1
            num = transformer.named_transformers_["num"].named_steps
            medians = X[NUM].median()
            imputed = X[NUM].fillna(medians)
            np.testing.assert_allclose(num["imputar"].statistics_, medians)
            np.testing.assert_allclose(num["escalar"].mean_, imputed.mean())
            np.testing.assert_allclose(num["escalar"].scale_, imputed.std(ddof=0))

            cat = transformer.named_transformers_["cat"].named_steps
            np.testing.assert_array_equal(cat["imputar"].statistics_, X[CAT].mode().iloc[0])
            for field, learned in zip(CAT, cat["onehot"].categories_):
                self.assertEqual(learned.tolist(), sorted(X[field].dropna().unique()))
            return result

        with patch.object(ColumnTransformer, "fit_transform", record_fit):
            winner, searches, cv = seleccionar(train_only)

        fold_columns = [name for name in cv if name.startswith("MAE_fold_")]
        self.assertEqual(fold_columns, ["MAE_fold_1", "MAE_fold_2"])
        self.assertEqual(winner, cv.iloc[0]["modelo"])
        np.testing.assert_allclose(cv["MAE_CV"], cv[fold_columns].mean(axis=1))
        expected_fits = Counter({tuple(fit): len(cv) for fit, _ in train_only.folds})
        expected_fits[tuple(train_only.train.index)] = len(searches)
        self.assertEqual(fit_rows, expected_fits)

    def test_ids_de_particiones_coinciden_con_la_corrida_guardada(self):
        recorded = json.loads((RESULTS / "particiones.json").read_text(encoding="utf-8"))
        self.assertEqual(self.parts.train.id.tolist(), recorded["ids_train"])
        self.assertEqual(self.parts.test.id.tolist(), recorded["ids_test"])
        for (fit, val), saved in zip(self.parts.folds, recorded["folds"], strict=True):
            self.assertEqual(self.parts.train.iloc[fit].id.tolist(), saved["ids_ajuste"])
            self.assertEqual(self.parts.train.iloc[val].id.tolist(), saved["ids_validacion"])

    def test_demo_comparte_ids_y_no_depende_del_orden_de_filas(self):
        original = ejemplos(self.parts.train)
        shuffled = ejemplos(self.parts.train.sample(frac=1, random_state=7))
        self.assertEqual([x["id"] for x in original], [x["id"] for x in shuffled])
        for first, second in zip(original, shuffled, strict=True):
            pd.testing.assert_series_equal(pd.Series(first["vehiculo"]), pd.Series(second["vehiculo"]))
        self.assertEqual(exportar.demo_examples(self.parts.train), original)

    def test_vecinos_respetan_empates_y_coincidencias_exactas(self):
        tied = VecinosRegresor(2).fit([[1.0], [-1.0], [1.0]], [100, 200, 400])
        indices, distances, weights = tied.neighbors([[0.0]])
        np.testing.assert_array_equal(indices, [[0, 1]])
        np.testing.assert_allclose(distances, [[1.0, 1.0]])
        np.testing.assert_allclose(weights, [[0.5, 0.5]])
        np.testing.assert_allclose(tied.predict([[0.0]]), [150.0])

        exact = VecinosRegresor(3, "distance").fit([[0.0], [0.0], [1.0]], [100, 300, 900])
        np.testing.assert_allclose(exact.neighbors([[0.0]])[2], [[0.5, 0.5, 0.0]])
        np.testing.assert_allclose(exact.predict([[0.0]]), [200.0])


@unittest.skipUnless(shutil.which("node"), "Node.js permite verificar el estimador del HTML")
class PresentacionTests(unittest.TestCase):
    def test_exportacion_y_calculo_javascript(self):
        model_path = RESULTS / "modelo.joblib"
        self.assertTrue(model_path.is_file(), "Ejecutá primero el notebook")
        saved = joblib.load(model_path)
        cases = pd.read_csv(RESULTS / "catalogo_evaluacion.csv")
        script = (exportar.HERE / "modelo.js").read_text(encoding="utf-8")

        with TemporaryDirectory(prefix="tp-autos-export-") as directory:
            root = Path(directory)
            (root / "presentacion").mkdir()
            with patch.object(exportar, "ROOT", root):
                exportar.main([])
            html = (root / "presentacion/presentacion.html").read_text(encoding="utf-8")

        self.assertIn(script, html)
        match = re.search(r'<script[^>]+id="data"[^>]*>(.*?)</script>', html, re.DOTALL)
        self.assertIsNotNone(match)
        payload = json.loads(match.group(1))
        options = saved["opciones"]
        forms = [sample["vehiculo"] for sample in saved["ejemplos"]]
        forms.append({"brand": "Volkswagen", "model": "Up!", "car_year": 2014, "km": 108000,
                      "fuel_type": "Nafta", "transmission": "Manual"})

        js = """
const { data, cases, forms } = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
const knn = data.knn ?? data.model;
const results = forms.map(fields => {
    const { vehicle, errors } = validarVehiculo(fields, data.options);
    if (Object.keys(errors).length) throw new Error(JSON.stringify(errors));
    return {
        price: predecir(vehicle, data.model).price,
        neighbors: predecir(vehicle, knn).neighbors.map(row => row.index),
    };
});
const tie = predecir({ km: 0 }, {
    kind: "knn", k: 2, weights: "distance", numeric: ["km"], categorical: [],
    median: [0], mean: [0], scale: [1], vectors: [[[1], []], [[-1], []], [[1], []]],
    prices: [100, 200, 400],
});
const rejected = validarVehiculo({ ...forms[0], km: -1 }, data.options).errors;
console.log(JSON.stringify({
    results, rejected,
    tie: [tie.price, tie.neighbors.map(row => row.index)],
    predictions: cases.map(fields => predecir(fields, data.model).price),
}));
"""
        args = {"data": payload, "cases": exportar.records(cases[FEATURES]), "forms": forms}
        result = subprocess.run(["node", "-e", script + js], input=json.dumps(args), text=True,
                                encoding="utf-8", capture_output=True, timeout=60)
        self.assertEqual(result.returncode, 0, result.stderr)
        js_result = json.loads(result.stdout)
        np.testing.assert_allclose(js_result["predictions"], cases["precio_estimado"], rtol=0, atol=1e-8)
        self.assertEqual(js_result["tie"], [150, [0, 1]])
        self.assertIn("km", js_result["rejected"])

        knn = saved["comparacion_knn"].named_steps
        for form, actual in zip(forms, js_result["results"], strict=True):
            self.assertAlmostEqual(actual["price"], estimar(saved["modelo"], options, form), delta=1e-8)
            vector = knn["preparar"].transform(ficha(form, options))
            self.assertEqual(actual["neighbors"], knn["modelo"].neighbors(vector)[0][0].tolist())
