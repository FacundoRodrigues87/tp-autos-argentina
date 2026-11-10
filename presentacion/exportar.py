"""Armá el HTML autónomo con los resultados del notebook."""

import argparse
import base64
import inspect
import json
import textwrap
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from src.autos import CAT, FEATURES, META, NUM, REQUIRED, RESULTS, ROOT, VecinosRegresor, cargar, limpiar, preprocesador

HERE = Path(__file__).resolve().parent


def records(frame):
    return json.loads(frame.to_json(orient="records", double_precision=15))


def export_model(pipeline):
    prep = pipeline.named_steps["preparar"].named_transformers_
    scaler = prep["num"].named_steps["escalar"]
    state = {
        "numeric": NUM, "categorical": CAT,
        "median": prep["num"].named_steps["imputar"].statistics_.tolist(),
        "mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist(),
        "mode": prep["cat"].named_steps["imputar"].statistics_.tolist(),
        "categories": [column.tolist() for column in prep["cat"].named_steps["onehot"].categories_],
    }
    model = pipeline.named_steps["modelo"]
    if isinstance(model, VecinosRegresor):
        # Keep the full-precision numeric prefix and encode the one-hot suffix as active indices.
        # The JS implementation expands this to the original dimension order for distances.
        vectors = [[row[:len(NUM)].tolist(), np.flatnonzero(row[len(NUM):]).tolist()]
                   for row in model.vectors_]
        return {**state, "kind": "knn", "k": model.n_neighbors, "weights": model.weights,
                "vectors": vectors, "prices": model.prices_.tolist()}
    if hasattr(model, "coef_"):
        return {**state, "kind": "linear", "coef": model.coef_.tolist(), "intercept": model.intercept_}
    return {**state, "kind": "median", "value": float(model.constant_.item())}


def demo_examples(train):
    """Fichas originales por ID: no varían por empates al ordenar kilometrajes."""
    ids = ["MLA1402454175", "MLA1546276856", "MLA1640255410"]
    rows = train.set_index("id")
    if not set(ids).issubset(rows.index):
        raise ValueError("Una ficha de demostración ya no está en entrenamiento. Revisá los IDs en demo_examples.")
    return [{"id": identifier, "vehiculo": rows.loc[identifier, FEATURES if i != 1 else REQUIRED].to_dict()}
            for i, identifier in enumerate(ids)]


def payload(model_path=None):
    raw = cargar()
    data, _ = limpiar(raw)
    saved = joblib.load(model_path or RESULTS / "modelo.joblib")
    cases = pd.read_csv(RESULTS / "catalogo_evaluacion.csv")
    typical = (cases["error_abs"] - cases["error_abs"].median()).abs().idxmin()
    highlighted = pd.concat([cases.loc[[typical]], cases.nlargest(2, "error_abs")])
    metrics = pd.read_csv(RESULTS / "metricas.csv")
    cv = pd.read_csv(RESULTS / "validacion_cruzada.csv")
    histogram, edges = np.histogram(data.price, bins=np.arange(0, 85001, 5000))
    relations = {}
    for field in ("car_year", "km", "power_hp"):
        paired = data[[field, "price"]].dropna()
        relations[field] = {"points": paired.to_numpy().tolist(),
                            "r": paired[field].corr(paired.price)}
    partition = json.loads((RESULTS / "particiones.json").read_text(encoding="utf-8"))
    audit = pd.read_csv(RESULTS / "calidad.csv")
    examples = raw.drop_duplicates("id").set_index("id").loc[
        ["MLA1404982421", "MLA1639157994", "MLA1403304889"], ["title", "model", "car_year", "doors", "price"]
    ]
    winner = export_model(saved["modelo"])
    implementation = VecinosRegresor.predict if winner["kind"] == "knn" else preprocesador
    eda = {key: "data:image/png;base64," + base64.b64encode((RESULTS / filename).read_bytes()).decode("ascii")
           for key, filename in {"univariate": "01_univariado.png", "correlation": "03_correlacion.png",
                                 "brands": "04_marcas.png"}.items()}
    brands = data.groupby("brand").agg(n=("price", "size"), mediana=("price", "median"))
    return {
        "implementation": {"file": "src/autos.py", "function": implementation.__qualname__,
                           "code": textwrap.dedent(inspect.getsource(implementation)).strip()},
        "edaImages": eda, "brandSummary": records(brands.sort_values("mediana").reset_index()),
        "source": json.loads(META.read_text(encoding="utf-8")),
        "raw": {"rows": len(raw), "cols": len(raw.columns)},
        "selected": int(audit.loc[audit.accion.eq("selección"), "cantidad"].iloc[0]),
        "clean": len(data), "brands": data.brand.nunique(), "models": data.model.nunique(),
        "audit": records(audit),
        "auditExamples": records(examples.reset_index()),
        "price": {"max": data.price.max(), "mean": data.price.mean(),
                  "median": data.price.median(), "q1": data.price.quantile(.25),
                  "q3": data.price.quantile(.75), "histogram": histogram.tolist(), "edges": edges.tolist()},
        "relations": relations,
        "partition": partition, "metrics": records(metrics), "cv": records(cv),
        "errors": records(pd.read_csv(RESULTS / "errores_segmentos.csv")),
        "cases": records(highlighted[["id", "brand", "model", "car_year", "price", "precio_estimado", "error"]]),
        "testPoints": cases[["price", "precio_estimado"]].to_numpy().tolist(),
        "options": saved["opciones"], "examples": demo_examples(saved["train"]),
        "model": winner, "knn": None if winner["kind"] == "knn" else export_model(saved["comparacion_knn"]),
        "neighbors": records(saved["train"][["brand", "model", "car_year", "km"]]),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--modelo", type=Path, help="Modelo joblib local; por defecto resultados/modelo.joblib")
    args = parser.parse_args()
    data = json.dumps(payload(args.modelo), ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    template = (HERE / "layout.html.in").read_text(encoding="utf-8")
    for token, content in {
        "/* ESTILOS */": (HERE / "estilos.css").read_text(encoding="utf-8"),
        "/* DATOS */": data.replace("<", r"\u003c"),
        "/* MODELO */": (HERE / "modelo.js").read_text(encoding="utf-8"),
        "/* INTERACCIONES */": (HERE / "app.js").read_text(encoding="utf-8"),
    }.items():
        template = template.replace(token, content)
    output = ROOT / "presentacion/presentacion.html"
    output.write_text(template, encoding="utf-8")
    print(f"{output.name} · {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
