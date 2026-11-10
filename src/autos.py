"""Limpieza, evaluación y estimación de precios publicados en USD."""

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy.spatial.distance import cdist
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import GridSearchCV, GroupKFold, GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/MeliCarPublicactions.csv"
META = ROOT / "docs/dataset_metadata.json"
RESULTS = ROOT / "resultados"
YEAR = 2024
SEED = 42
NUM = ["car_year", "km", "engine_l", "power_hp", "doors", "passenger_capacity"]
CAT = ["brand", "model", "fuel_type", "transmission", "traction_control"]
FEATURES = NUM + CAT
REQUIRED = NUM[:2] + CAT[:4]
GROUP = ["brand", "model", "version", "car_year"]
SPEC_LIMITS = {
    "engine_l": (0.5, 10),
    "power_hp": (20, 1500),
    "doors": (2, 6),
    "passenger_capacity": (1, 12),
}
LABELS = dict(zip(FEATURES, [
    "Año", "Kilómetros", "Motor (L)", "Potencia (hp)", "Puertas", "Plazas",
    "Marca", "Modelo", "Combustible", "Transmisión", "Tracción",
]))
NUMBER = r"[+-]?\d+(?:[.,]\d+)?"
AMOUNT = r"(?:U\$S?|USD|US\$|\$)\s*\d"
FINANCE = r"\b(?:financi\w*|anticipos?|cuotas?)\b"
PARTIAL = (
    rf"\b(?:anticipo|cuota)\s*(?:de\s+|[:=]\s*)?{AMOUNT}"
    rf"|{AMOUNT}[\d.,]*\s+(?:de\s+)?(?:anticipo|cuota)\b"
    r"|\bprecio\s+(?:por|de)\s+(?:la\s+)?cuota\b"
)


def cargar():
    metadata = json.loads(META.read_text(encoding="utf-8"))
    if hashlib.sha256(RAW.read_bytes()).hexdigest() != metadata["sha256"]:
        raise ValueError("El CSV no coincide con la huella SHA-256 de la descarga.")
    return pd.read_csv(RAW, sep=";", dtype="string", keep_default_na=False)


def _numeric(values, unit=""):
    suffix = rf"(?:\s*{unit})?" if unit else ""
    parsed = values.str.extract(rf"^({NUMBER}){suffix}$", flags=re.I, expand=False)
    return pd.to_numeric(parsed.str.replace(",", ".", regex=False), errors="coerce").astype(float)


def _engine(values):
    plain = _numeric(values, "l")
    cc = _numeric(values, r"(?:cc|cm³)")
    cc_only = values.str.fullmatch(r"\d{3,5}(?:\s*(?:cc|cm³))?", flags=re.I)
    liters = plain.mask(cc_only, cc / 1000)
    # A decimal in a description such as "1.6 110CV" identifies displacement.
    # An isolated integer in "4 cilindros" does not.
    described = values.str.extract(r"(?<![\d.,])([1-9][.,]\d{1,2})(?![\d.,])", expand=False)
    return liters.fillna(_numeric(described))


def limpiar(raw):
    """Devuelve la muestra y una auditoría con cantidades e IDs por regla."""
    counts = []

    def log(action, reason, count, ids=()):
        counts.append({"accion": action, "motivo": reason, "cantidad": int(count),
                       "ids": ", ".join(ids)})

    def exclude(frame, mask, reason):
        log("exclusión", reason, mask.sum(), frame.loc[mask, "id"])
        return frame.loc[~mask].copy()

    used = raw["condition"].eq("Usado")
    selected = used & raw["currency"].eq("USD")
    log("origen", "Publicaciones en el CSV original", len(raw))
    log("fuera del alcance", "Usados en ARS", (used & ~selected).sum())
    log("fuera del alcance", "Publicaciones de vehículos nuevos", (~used).sum())
    d = raw.loc[selected].copy()
    log("selección", "Usados publicados directamente en USD", len(d))

    d = exclude(d, d["id"].duplicated(), "ID de publicación repetido")
    for field in ["title", "version", *CAT]:
        values = d[field].str.strip()
        d[field] = values.astype(object).where(values.ne(""), np.nan)
    engine_text = d["engine"].str.strip()
    d["engine_l"] = _engine(engine_text)
    engine_variant = d["engine_l"].notna() & (
        ~engine_text.str.fullmatch(r"[+-]?\d+(?:\.\d+)?") | engine_text.str.fullmatch(r"\d{3,5}")
    )
    log("normalización", "Cilindrada recuperada de texto o unidades", engine_variant.sum(),
        d.loc[engine_variant, "id"])
    for source, target, unit in [
        ("car_year", "car_year", ""), ("price", "price", ""),
        ("km", "km", "km"), ("engine_power", "power_hp", "hp"),
        ("doors", "doors", ""), ("passenger_capacity", "passenger_capacity", ""),
    ]:
        d[target] = _numeric(d[source].str.strip(), unit)
        if unit:
            log("normalización", f"{LABELS[target]} convertido a número", d[target].notna().sum())
    # Audit specifications on the deduplicated input, including rows excluded later.
    for field, (low, high) in SPEC_LIMITS.items():
        source = {"engine_l": "engine", "power_hp": "engine_power"}.get(field, field)
        original = raw.loc[d.index, source].str.strip()
        valid = d[field].between(low, high)
        if field in ("doors", "passenger_capacity"):
            valid &= d[field].mod(1).eq(0)
        invalid = original.ne("") & ~valid
        log("corrección", f"{LABELS[field]} imposible o no interpretable a faltante",
            invalid.sum(), d.loc[invalid, "id"])
        d.loc[invalid, field] = np.nan

    d = exclude(d, ~np.isfinite(d["price"]) | d["price"].le(0), "Precio inválido")
    d = exclude(d, ~np.isfinite(d["km"]) | d["km"].lt(0), "Kilometraje inválido o negativo")
    valid_year = d["car_year"].between(1886, YEAR) & d["car_year"].mod(1).eq(0)
    d = exclude(d, ~valid_year, f"Año de fabricación imposible para el corte de {YEAR}")
    partial = d["title"].str.contains(PARTIAL, case=False, regex=True, na=False)
    finance = d["title"].str.contains(FINANCE, case=False, regex=True, na=False)
    mentioned = finance | partial
    log("revisión", "Títulos con mención de financiación, anticipo o cuotas", mentioned.sum(),
        d.loc[mentioned, "id"])
    d = exclude(d, partial, "Importe identificado como anticipo o cuota en el título")
    log("conservación", "Títulos que ofrecen financiación sin identificar el importe como parcial",
        (finance & ~partial).sum())
    log("conservación", "Precios descartados solo por ser extremos", 0)
    log("resultado", "Publicaciones aptas para el análisis", len(d))
    return d.reset_index(drop=True), pd.DataFrame(counts)


class VecinosRegresor(RegressorMixin, BaseEstimator):
    """k-NN euclídeo con el mismo desempate por orden de filas que modelo.js."""

    def __init__(self, n_neighbors=5, weights="uniform"):
        self.n_neighbors = n_neighbors
        self.weights = weights

    def fit(self, X, y):
        self.vectors_ = np.asarray(X, dtype=float)
        self.prices_ = np.asarray(y, dtype=float)
        return self

    def neighbors(self, X):
        squared = cdist(X, self.vectors_, metric="sqeuclidean")
        # La raíz conserva el orden, así que se calcula solo para los vecinos elegidos.
        indices = np.argsort(squared, axis=1, kind="stable")[:, :self.n_neighbors]
        distances = np.sqrt(np.take_along_axis(squared, indices, axis=1))
        weights = np.ones_like(distances)
        if self.weights == "distance":
            zero = distances == 0
            weights = np.divide(1, distances, out=np.zeros_like(distances), where=~zero)
            # Una coincidencia exacta tiene prioridad sobre cualquier distancia positiva.
            weights = np.where(zero.any(axis=1, keepdims=True), zero, weights)
        weights /= weights.sum(axis=1, keepdims=True)
        return indices, distances, weights

    def predict(self, X):
        indices, _, weights = self.neighbors(X)
        return (self.prices_[indices] * weights).sum(axis=1)


def preprocesador():
    return ColumnTransformer([
        ("num", Pipeline([
            ("imputar", SimpleImputer(strategy="median")),
            ("escalar", StandardScaler()),
        ]), NUM),
        ("cat", Pipeline([
            ("imputar", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]), CAT),
    ])


@dataclass
class Particiones:
    train: pd.DataFrame
    test: pd.DataFrame
    folds: list
    detalle: dict


def separar(d):
    keys = d[GROUP].fillna("").map(lambda value: str(value).casefold())
    groups = pd.MultiIndex.from_frame(keys).factorize()[0]
    train, test = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEED)
                       .split(d, groups=groups))
    train_groups, test_groups = groups[train], groups[test]
    shared = len(np.intersect1d(train_groups, test_groups))
    assert shared == 0
    # Mezclar grupos con semilla evita depender del orden de empates de tamaños
    # de la asignación sin shuffle. No se mezclan filas de un mismo grupo.
    folds = list(GroupKFold(n_splits=5, shuffle=True, random_state=SEED)
                 .split(d.iloc[train], groups=train_groups))
    fold_details = []
    for i, (fit, val) in enumerate(folds, start=1):
        overlap = len(np.intersect1d(train_groups[fit], train_groups[val]))
        assert overlap == 0
        fold_details.append({"fold": i, "ajuste": len(fit), "validacion": len(val),
                             "grupos_compartidos": overlap,
                             "ids_ajuste": d.iloc[train[fit]]["id"].tolist(),
                             "ids_validacion": d.iloc[train[val]]["id"].tolist()})
    detail = {
        "semilla": SEED, "variables_grupo": GROUP,
        "train": len(train), "test": len(test), "fraccion_test": len(test) / len(d),
        "grupos_train": len(np.unique(train_groups)), "grupos_test": len(np.unique(test_groups)),
        "grupos_compartidos": shared, "folds": fold_details,
        "estrategia_cv": "GroupKFold con shuffle=True y random_state=42",
        "ids_train": d.iloc[train]["id"].tolist(),
        "ids_test": d.iloc[test]["id"].tolist(),
    }
    return Particiones(d.iloc[train].reset_index(drop=True),
                       d.iloc[test].reset_index(drop=True), folds, detail)


def seleccionar(partitions):
    """Compara el MAE de validación y reajusta cada finalista solo con train."""
    X_train = partitions.train[FEATURES]
    y_train = partitions.train["price"]
    choices = {
        "Baseline mediana": (DummyRegressor(strategy="median"), {}),
        "Regresión lineal": (LinearRegression(), {}),
        "k-NN": (VecinosRegresor(), {"modelo__n_neighbors": [5, 15, 35],
                                    "modelo__weights": ["uniform", "distance"]}),
    }
    searches = {}
    rows = []
    for name, (model, grid) in choices.items():
        pipeline = Pipeline([("preparar", preprocesador()), ("modelo", model)])
        search = GridSearchCV(pipeline, grid, cv=partitions.folds,
                              scoring="neg_mean_absolute_error", error_score="raise")
        search.fit(X_train, y_train)
        searches[name] = search
        for i, params in enumerate(search.cv_results_["params"]):
            fold_scores = {
                f"MAE_fold_{fold + 1}": -search.cv_results_[f"split{fold}_test_score"][i]
                for fold in range(search.n_splits_)
            }
            rows.append({"modelo": name, "vecinos": params.get("modelo__n_neighbors"),
                         "pesos": params.get("modelo__weights"),
                         "MAE_CV": -search.cv_results_["mean_test_score"][i], **fold_scores})
    winner = max(searches, key=lambda name: searches[name].best_score_)
    return winner, searches, pd.DataFrame(rows).sort_values("MAE_CV", ignore_index=True)


def evaluar(partitions, winner, searches):
    test = partitions.test
    X_test = test[FEATURES]
    y_test = test["price"]
    rows = []
    cases = test[["id", *FEATURES, "version", "price"]].copy()
    for name, search in searches.items():
        pred = search.predict(X_test)
        if name == winner:
            cases["precio_estimado"] = pred
        rows.append({
            "modelo": name, "MAE_CV": -search.best_score_,
            "MAE_test": mean_absolute_error(y_test, pred),
            "RMSE_test": root_mean_squared_error(y_test, pred),
            "R2_test": r2_score(y_test, pred), "elegido_por_CV": name == winner,
        })
    cases["error"] = cases["precio_estimado"] - cases["price"]
    cases["error_abs"] = cases["error"].abs()
    cases["antiguedad"] = pd.cut(YEAR - cases["car_year"], [-1, 5, 10, np.inf],
                                 labels=["0 a 5 años", "6 a 10 años", "11 años o más"])
    cuts = partitions.train["price"].quantile([1/3, 2/3]).tolist()
    cases["nivel_precio"] = pd.cut(cases["price"], [-np.inf, *cuts, np.inf],
                                  labels=["Bajo", "Medio", "Alto"])
    segments = []
    for field in ["brand", "antiguedad", "nivel_precio"]:
        part = cases.groupby(field, observed=True).agg(
            n=("id", "size"), MAE=("error_abs", "mean"), sesgo=("error", "mean"),
        ).rename_axis("segmento").reset_index()
        part.insert(0, "variable", field)
        segments.append(part)
    return pd.DataFrame(rows), cases, pd.concat(segments, ignore_index=True), cuts


def opciones(train):
    models = train.groupby("brand")["model"].agg(lambda values: sorted(values.dropna().unique()))
    categories = {field: sorted(train[field].dropna().unique()) for field in CAT[2:]}
    limits = {"car_year": [int(train.car_year.min()), int(train.car_year.max())],
              "km": [0, int(train.km.max())], **SPEC_LIMITS}
    return {"modelos": models.to_dict(), "categorias": categories, "rangos": limits,
            "obligatorios": REQUIRED, "enteros": ["car_year", "km", "doors", "passenger_capacity"],
            "etiquetas": LABELS}


def ficha(values, options):
    choices = {"brand": options["modelos"],
               "model": options["modelos"].get(str(values.get("brand", "")).strip(), []),
               **options["categorias"]}
    data = {}
    for field in FEATURES:
        value = values.get(field)
        if isinstance(value, str):
            value = value.strip()
        if value is None or (isinstance(value, str) and value == ""):
            if field in options["obligatorios"]:
                raise ValueError(f"Completá {LABELS[field].lower()}.")
            data[field] = np.nan
            continue
        if field in NUM:
            if not re.fullmatch(r"[+-]?[0-9]+(?:\.[0-9]+)?", str(value)):
                raise ValueError(f"{LABELS[field]} debe ser un número.")
            value = float(value)
            low, high = options["rangos"][field]
            if not low <= value <= high or (field in options["enteros"] and not value.is_integer()):
                raise ValueError(f"{LABELS[field]} debe estar entre {low} y {high}."
                                 + (" Ingresá un entero." if field in options["enteros"] else ""))
        else:
            if value not in choices[field]:
                raise ValueError(f"{LABELS[field]} no es compatible con las opciones disponibles.")
        data[field] = value
    return pd.DataFrame([data], columns=FEATURES)


def estimar(model, options, values):
    return float(model.predict(ficha(values, options))[0])


def ejemplos(train):
    """Fichas de la defensa fijadas por ID, compartidas con el exportador."""
    ids = ["MLA1402454175", "MLA1546276856", "MLA1640255410"]
    rows = train.set_index("id")
    if not set(ids).issubset(rows.index):
        raise ValueError("Una ficha de demostración ya no está en train; revisá sus IDs.")
    return [{"id": identifier,
             "vehiculo": rows.loc[identifier, FEATURES if i != 1 else REQUIRED].to_dict()}
            for i, identifier in enumerate(ids)]


def guardar(calidad, partitions, winner, searches, cv, metrics, cases, segments, cuts):
    RESULTS.mkdir(exist_ok=True)
    for name, frame in [("calidad", calidad), ("validacion_cruzada", cv), ("metricas", metrics),
                        ("catalogo_evaluacion", cases), ("errores_segmentos", segments)]:
        frame.to_csv(RESULTS / f"{name}.csv", index=False)
    detail = {**partitions.detalle, "modelo_elegido": winner,
              "parametros": searches[winner].best_params_, "cortes_precio_USD": cuts}
    (RESULTS / "particiones.json").write_text(json.dumps(detail, ensure_ascii=False, indent=2),
                                              encoding="utf-8")
    joblib.dump({
        "nombre": winner, "modelo": searches[winner].best_estimator_,
        "comparacion_knn": searches["k-NN"].best_estimator_,
        "opciones": opciones(partitions.train), "train": partitions.train[["id", *FEATURES, "price"]],
        "ejemplos": ejemplos(partitions.train),
    }, RESULTS / "modelo.joblib", compress=3)
