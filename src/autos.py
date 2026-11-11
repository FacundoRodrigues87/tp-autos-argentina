"""Limpieza de avisos y estimacion de precios en dolares"""

import hashlib
import json
import re
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

RAIZ = Path(__file__).resolve().parents[1]
ARCHIVO_AVISOS = RAIZ / "data/raw/MeliCarPublicactions.csv"
ARCHIVO_FUENTE = RAIZ / "docs/dataset_metadata.json"
RESULTADOS = RAIZ / "resultados"
ANIO_CORTE = 2024
SEMILLA = 42
NUMERICAS = ["car_year", "km", "engine_l", "power_hp", "doors", "passenger_capacity"]
CATEGORICAS = ["brand", "model", "fuel_type", "transmission", "traction_control"]
PREDICTORAS = NUMERICAS + CATEGORICAS
OBLIGATORIAS = ["car_year", "km", "brand", "model", "fuel_type", "transmission"]
COLUMNAS_GRUPO = ["brand", "model", "version", "car_year"]
RANGOS_ESPECIFICACIONES = {
    "engine_l": (0.5, 10),
    "power_hp": (20, 1500),
    "doors": (2, 6),
    "passenger_capacity": (1, 12),
}
ETIQUETAS = {
    "car_year": "Año",
    "km": "Kilómetros",
    "engine_l": "Motor (L)",
    "power_hp": "Potencia (hp)",
    "doors": "Puertas",
    "passenger_capacity": "Plazas",
    "brand": "Marca",
    "model": "Modelo",
    "fuel_type": "Combustible",
    "transmission": "Transmisión",
    "traction_control": "Tracción",
}

PATRON_NUMERO = r"[+-]?\d+(?:[.,]\d+)?"
PATRON_IMPORTE = r"(?:U\$S?|USD|US\$|\$)\s*\d"
PATRON_FINANCIACION = r"\b(?:financi\w*|anticipos?|cuotas?)\b"
PATRON_ANTICIPO_ANTES = rf"\b(?:anticipo|cuota)\s*(?:de\s+|[:=]\s*)?{PATRON_IMPORTE}"
PATRON_ANTICIPO_DESPUES = rf"{PATRON_IMPORTE}[\d.,]*\s+(?:de\s+)?(?:anticipo|cuota)\b"
PATRON_PRECIO_POR_CUOTA = r"\bprecio\s+(?:por|de)\s+(?:la\s+)?cuota\b"


def cargar():
    fuente = json.loads(ARCHIVO_FUENTE.read_text(encoding="utf-8"))
    huella = hashlib.sha256(ARCHIVO_AVISOS.read_bytes()).hexdigest()
    if huella != fuente["sha256"]:
        raise ValueError("El CSV no coincide con la huella SHA-256 de la descarga.")
    return pd.read_csv(ARCHIVO_AVISOS, sep=";", dtype="string", keep_default_na=False)


def convertir_numeros(textos, unidad=""):
    patron = rf"^({PATRON_NUMERO})$"
    if unidad:
        patron = rf"^({PATRON_NUMERO})(?:\s*{unidad})?$"
    numeros = textos.str.extract(patron, flags=re.IGNORECASE, expand=False)
    numeros = numeros.str.replace(",", ".", regex=False)
    return pd.to_numeric(numeros, errors="coerce").astype(float)


def convertir_motor(textos):
    litros = convertir_numeros(textos, "l")
    centimetros_cubicos = convertir_numeros(textos, r"(?:cc|cm³)")
    tiene_centimetros_cubicos = textos.str.fullmatch(
        r"\d{3,5}(?:\s*(?:cc|cm³))?", flags=re.IGNORECASE
    )
    litros.loc[tiene_centimetros_cubicos] = (
        centimetros_cubicos.loc[tiene_centimetros_cubicos] / 1000
    )

    # Un decimal puede indicar litros aunque el campo tenga mas texto
    # Un entero en la descripcion de los cilindros no indica litros
    decimales = textos.str.extract(r"(?<![\d.,])([1-9][.,]\d{1,2})(?![\d.,])", expand=False)
    return litros.fillna(convertir_numeros(decimales))


def registrar(auditoria, accion, motivo, cantidad, ids=()):
    auditoria.append({
        "accion": accion,
        "motivo": motivo,
        "cantidad": int(cantidad),
        "ids": ", ".join(ids),
    })


def quitar_avisos(avisos, excluir, motivo, auditoria):
    ids = avisos.loc[excluir, "id"]
    registrar(auditoria, "exclusión", motivo, len(ids), ids)
    return avisos.loc[~excluir].copy()


def limpiar(original):
    """Devuelve los avisos limpios y las decisiones de limpieza"""

    auditoria = []
    es_usado = original["condition"].eq("Usado")
    esta_en_dolares = original["currency"].eq("USD")
    seleccionados = es_usado & esta_en_dolares

    registrar(auditoria, "origen", "Publicaciones en el CSV original", len(original))
    registrar(auditoria, "fuera del alcance", "Usados en ARS", (es_usado & ~esta_en_dolares).sum())
    registrar(auditoria, "fuera del alcance", "Publicaciones de vehículos nuevos", (~es_usado).sum())
    avisos = original.loc[seleccionados].copy()
    registrar(auditoria, "selección", "Usados publicados directamente en USD", len(avisos))

    repetidos = avisos["id"].duplicated()
    avisos = quitar_avisos(avisos, repetidos, "ID de publicación repetido", auditoria)
    columnas_texto = ["title", "version"] + CATEGORICAS
    for columna in columnas_texto:
        textos = avisos[columna].str.strip()
        avisos[columna] = textos.astype(object).replace("", np.nan)

    texto_motor = avisos["engine"].str.strip()
    avisos["engine_l"] = convertir_motor(texto_motor)
    formato_simple = texto_motor.str.fullmatch(r"[+-]?\d+(?:\.\d+)?")
    formato_entero_largo = texto_motor.str.fullmatch(r"\d{3,5}")
    motor_recuperado = avisos["engine_l"].notna() & (~formato_simple | formato_entero_largo)
    ids_motor = avisos.loc[motor_recuperado, "id"]
    registrar(auditoria, "normalización", "Cilindrada recuperada de texto o unidades", len(ids_motor), ids_motor)

    avisos["car_year"] = convertir_numeros(avisos["car_year"].str.strip())
    avisos["price"] = convertir_numeros(avisos["price"].str.strip())
    avisos["km"] = convertir_numeros(avisos["km"].str.strip(), "km")
    avisos["power_hp"] = convertir_numeros(avisos["engine_power"].str.strip(), "hp")
    avisos["doors"] = convertir_numeros(avisos["doors"].str.strip())
    avisos["passenger_capacity"] = convertir_numeros(avisos["passenger_capacity"].str.strip())
    registrar(auditoria, "normalización", f"{ETIQUETAS['km']} convertido a número", avisos["km"].count())
    registrar(auditoria, "normalización", f"{ETIQUETAS['power_hp']} convertido a número", avisos["power_hp"].count())

    # Registramos las especificaciones invalidas antes de quitar mas avisos
    columnas_originales = {
        "engine_l": "engine",
        "power_hp": "engine_power",
        "doors": "doors",
        "passenger_capacity": "passenger_capacity",
    }
    for columna in RANGOS_ESPECIFICACIONES:
        minimo, maximo = RANGOS_ESPECIFICACIONES[columna]
        textos = original.loc[avisos.index, columnas_originales[columna]].str.strip()
        es_valido = avisos[columna].between(minimo, maximo)
        if columna in ("doors", "passenger_capacity"):
            es_entero = avisos[columna].mod(1).eq(0)
            es_valido = es_valido & es_entero
        es_invalido = textos.ne("") & ~es_valido
        ids_invalidos = avisos.loc[es_invalido, "id"]
        motivo = f"{ETIQUETAS[columna]} imposible o no interpretable a faltante"
        registrar(auditoria, "corrección", motivo, len(ids_invalidos), ids_invalidos)
        avisos.loc[es_invalido, columna] = np.nan

    precio_invalido = ~np.isfinite(avisos["price"]) | avisos["price"].le(0)
    avisos = quitar_avisos(avisos, precio_invalido, "Precio inválido", auditoria)

    km_invalidos = ~np.isfinite(avisos["km"]) | avisos["km"].lt(0)
    avisos = quitar_avisos(avisos, km_invalidos, "Kilometraje inválido o negativo", auditoria)

    anio_en_rango = avisos["car_year"].between(1886, ANIO_CORTE)
    anio_entero = avisos["car_year"].mod(1).eq(0)
    anio_invalido = ~(anio_en_rango & anio_entero)
    motivo = f"Año de fabricación imposible para el corte de {ANIO_CORTE}"
    avisos = quitar_avisos(avisos, anio_invalido, motivo, auditoria)

    titulos = avisos["title"]
    anticipo_antes = titulos.str.contains(PATRON_ANTICIPO_ANTES, case=False, na=False)
    anticipo_despues = titulos.str.contains(PATRON_ANTICIPO_DESPUES, case=False, na=False)
    precio_por_cuota = titulos.str.contains(PATRON_PRECIO_POR_CUOTA, case=False, na=False)
    es_pago_parcial = anticipo_antes | anticipo_despues | precio_por_cuota
    ofrece_financiacion = titulos.str.contains(PATRON_FINANCIACION, case=False, na=False)
    ids_para_revisar = avisos.loc[es_pago_parcial | ofrece_financiacion, "id"]
    motivo = "Títulos con mención de financiación, anticipo o cuotas"
    registrar(auditoria, "revisión", motivo, len(ids_para_revisar), ids_para_revisar)
    avisos = quitar_avisos(avisos, es_pago_parcial, "Importe identificado como anticipo o cuota en el título", auditoria)
    motivo = "Títulos que ofrecen financiación sin identificar el importe como parcial"
    registrar(auditoria, "conservación", motivo, (ofrece_financiacion & ~es_pago_parcial).sum())
    registrar(auditoria, "conservación", "Precios descartados solo por ser extremos", 0)
    registrar(auditoria, "resultado", "Publicaciones aptas para el análisis", len(avisos))

    return avisos.reset_index(drop=True), pd.DataFrame(auditoria)


class VecinosRegresor(RegressorMixin, BaseEstimator):
    """Estima el precio con los avisos mas parecidos"""

    def __init__(self, n_neighbors=5, weights="uniform"):
        self.n_neighbors = n_neighbors
        self.weights = weights

    def fit(self, X, y):
        fichas = X
        precios = y
        self.vectors_ = np.asarray(fichas, dtype=float)
        self.prices_ = np.asarray(precios, dtype=float)
        return self

    def vecinos(self, fichas):
        # Calculamos una distancia al cuadrado para cada par de fichas
        distancias_cuadradas = cdist(fichas, self.vectors_, metric="sqeuclidean")
        cantidad = min(self.n_neighbors, len(self.vectors_))
        indices = np.empty((len(distancias_cuadradas), cantidad), dtype=int)
        distancias = np.empty_like(indices, dtype=float)
        pesos = np.empty_like(distancias)

        for fila, distancias_de_ficha in enumerate(distancias_cuadradas):
            # En un empate conservamos el orden original de los avisos
            orden = np.argsort(distancias_de_ficha, kind="stable")
            indices_cercanos = orden[:cantidad]
            distancias_cercanas = np.sqrt(distancias_de_ficha[indices_cercanos])
            pesos_sin_normalizar = np.ones(cantidad)

            if self.weights == "distance":
                hay_coincidencias = (distancias_cercanas == 0).any()
                for posicion, distancia in enumerate(distancias_cercanas):
                    if hay_coincidencias:
                        # Cuando hay coincidencias exactas solo cuentan esas fichas
                        pesos_sin_normalizar[posicion] = float(distancia == 0)
                    else:
                        pesos_sin_normalizar[posicion] = 1 / distancia

            indices[fila] = indices_cercanos
            distancias[fila] = distancias_cercanas
            pesos[fila] = pesos_sin_normalizar / pesos_sin_normalizar.sum()
        return indices, distancias, pesos

    def predict(self, X):
        fichas = X
        indices, _, pesos = self.vecinos(fichas)
        estimaciones = []
        for indices_cercanos, pesos_cercanos in zip(indices, pesos):
            precios_cercanos = self.prices_[indices_cercanos]
            aportes = precios_cercanos * pesos_cercanos
            estimaciones.append(aportes.sum())
        return np.asarray(estimaciones)


def preprocesador():
    preparar_numeros = Pipeline([
        ("imputar", SimpleImputer(strategy="median")),
        ("escalar", StandardScaler()),
    ])
    preparar_categorias = Pipeline([
        ("imputar", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer([
        ("num", preparar_numeros, NUMERICAS),
        ("cat", preparar_categorias, CATEGORICAS),
    ])


class Particiones:
    def __init__(self, entrenamiento, prueba, rondas, detalle):
        self.entrenamiento = entrenamiento
        self.prueba = prueba
        self.rondas = rondas
        self.detalle = detalle


def separar(avisos):
    claves = avisos[COLUMNAS_GRUPO].fillna("").astype(str)
    for columna in COLUMNAS_GRUPO:
        claves[columna] = claves[columna].str.casefold()
    grupos, _ = pd.MultiIndex.from_frame(claves).factorize()

    separador = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEMILLA)
    indices_entrenamiento, indices_prueba = next(separador.split(avisos, groups=grupos))
    entrenamiento = avisos.iloc[indices_entrenamiento].reset_index(drop=True)
    prueba = avisos.iloc[indices_prueba].reset_index(drop=True)
    grupos_entrenamiento = grupos[indices_entrenamiento]
    grupos_prueba = grupos[indices_prueba]
    compartidos = set(grupos_entrenamiento) & set(grupos_prueba)
    assert not compartidos

    # Mezclamos grupos completos y guardamos los ids de cada ronda
    separador_rondas = GroupKFold(n_splits=5, shuffle=True, random_state=SEMILLA)
    rondas = list(separador_rondas.split(entrenamiento, groups=grupos_entrenamiento))
    detalle_rondas = []
    for numero, (ajuste, validacion) in enumerate(rondas, start=1):
        grupos_ajuste = set(grupos_entrenamiento[ajuste])
        grupos_validacion = set(grupos_entrenamiento[validacion])
        compartidos_ronda = grupos_ajuste & grupos_validacion
        assert not compartidos_ronda
        detalle_rondas.append({
            "fold": numero,
            "ajuste": len(ajuste),
            "validacion": len(validacion),
            "grupos_compartidos": len(compartidos_ronda),
            "ids_ajuste": entrenamiento.iloc[ajuste]["id"].tolist(),
            "ids_validacion": entrenamiento.iloc[validacion]["id"].tolist(),
        })
    detalle = {
        "semilla": SEMILLA,
        "variables_grupo": COLUMNAS_GRUPO,
        "train": len(entrenamiento),
        "test": len(prueba),
        "fraccion_test": len(prueba) / len(avisos),
        "grupos_train": len(set(grupos_entrenamiento)),
        "grupos_test": len(set(grupos_prueba)),
        "grupos_compartidos": len(compartidos),
        "folds": detalle_rondas,
        "estrategia_cv": "GroupKFold con shuffle=True y random_state=42",
        "ids_train": entrenamiento["id"].tolist(),
        "ids_test": prueba["id"].tolist(),
    }
    return Particiones(entrenamiento, prueba, rondas, detalle)


def seleccionar(particiones):
    """Elige el modelo que tiene el menor error de validacion"""

    caracteristicas = particiones.entrenamiento[PREDICTORAS]
    precios = particiones.entrenamiento["price"]
    candidatos = [
        ("Baseline mediana", DummyRegressor(strategy="median"), {}),
        ("Regresión lineal", LinearRegression(), {}),
        ("k-NN", VecinosRegresor(), {
            "modelo__n_neighbors": [5, 15, 35],
            "modelo__weights": ["uniform", "distance"],
        }),
    ]
    busquedas = {}
    filas = []
    for nombre, modelo, parametros in candidatos:
        preparacion_y_modelo = Pipeline([
            ("preparar", preprocesador()),
            ("modelo", modelo),
        ])
        busqueda = GridSearchCV(
            preparacion_y_modelo,
            parametros,
            cv=particiones.rondas,
            scoring="neg_mean_absolute_error",
            error_score="raise",
        )
        busqueda.fit(caracteristicas, precios)
        busquedas[nombre] = busqueda
        resultados = busqueda.cv_results_
        for posicion, combinacion in enumerate(resultados["params"]):
            fila = {
                "modelo": nombre,
                "vecinos": combinacion.get("modelo__n_neighbors"),
                "pesos": combinacion.get("modelo__weights"),
                "MAE_CV": -resultados["mean_test_score"][posicion],
            }
            for ronda in range(busqueda.n_splits_):
                clave = f"split{ronda}_test_score"
                fila[f"MAE_fold_{ronda + 1}"] = -resultados[clave][posicion]
            filas.append(fila)

    ganador = None
    menor_error = float("inf")
    for nombre, busqueda in busquedas.items():
        error = -busqueda.best_score_
        if error < menor_error:
            menor_error = error
            ganador = nombre

    tabla_validacion = pd.DataFrame(filas).sort_values("MAE_CV", ignore_index=True)
    return ganador, busquedas, tabla_validacion


def evaluar(particiones, ganador, busquedas):
    prueba = particiones.prueba
    caracteristicas = prueba[PREDICTORAS]
    precios = prueba["price"]
    columnas = ["id"] + PREDICTORAS + ["version", "price"]
    casos = prueba[columnas].copy()
    filas_metricas = []

    for nombre, busqueda in busquedas.items():
        estimaciones = busqueda.predict(caracteristicas)
        if nombre == ganador:
            casos["precio_estimado"] = estimaciones
        filas_metricas.append({
            "modelo": nombre,
            "MAE_CV": -busqueda.best_score_,
            "MAE_test": mean_absolute_error(precios, estimaciones),
            "RMSE_test": root_mean_squared_error(precios, estimaciones),
            "R2_test": r2_score(precios, estimaciones),
            "elegido_por_CV": nombre == ganador,
        })

    casos["error"] = casos["precio_estimado"] - casos["price"]
    casos["error_abs"] = casos["error"].abs()
    antiguedad = ANIO_CORTE - casos["car_year"]
    casos["antiguedad"] = pd.cut(
        antiguedad, [-1, 5, 10, np.inf], labels=["0 a 5 años", "6 a 10 años", "11 años o más"]
    )
    cortes = particiones.entrenamiento["price"].quantile([1 / 3, 2 / 3]).tolist()
    casos["nivel_precio"] = pd.cut(
        casos["price"], [-np.inf, cortes[0], cortes[1], np.inf], labels=["Bajo", "Medio", "Alto"]
    )

    segmentos = []
    for columna in ["brand", "antiguedad", "nivel_precio"]:
        resumen = casos.groupby(columna, observed=True).agg(
            n=("id", "size"), MAE=("error_abs", "mean"), sesgo=("error", "mean"),
        )
        resumen = resumen.rename_axis("segmento").reset_index()
        resumen.insert(0, "variable", columna)
        segmentos.append(resumen)

    metricas = pd.DataFrame(filas_metricas)
    tabla_segmentos = pd.concat(segmentos, ignore_index=True)
    return metricas, casos, tabla_segmentos, cortes


def opciones(entrenamiento):
    modelos = {}
    for marca, avisos_marca in entrenamiento.groupby("brand"):
        modelos[marca] = sorted(avisos_marca["model"].dropna().unique())

    categorias = {}
    for columna in ["fuel_type", "transmission", "traction_control"]:
        categorias[columna] = sorted(entrenamiento[columna].dropna().unique())

    rangos = {
        "car_year": [int(entrenamiento["car_year"].min()), int(entrenamiento["car_year"].max())],
        "km": [0, int(entrenamiento["km"].max())],
    }
    rangos.update(RANGOS_ESPECIFICACIONES)
    return {
        "modelos": modelos,
        "categorias": categorias,
        "rangos": rangos,
        "obligatorios": OBLIGATORIAS,
        "enteros": ["car_year", "km", "doors", "passenger_capacity"],
        "etiquetas": ETIQUETAS,
    }


def ficha(valores, opciones_validas):
    marca = str(valores.get("brand", "")).strip()
    categorias_validas = opciones_validas["categorias"].copy()
    categorias_validas["brand"] = opciones_validas["modelos"]
    categorias_validas["model"] = opciones_validas["modelos"].get(marca, [])
    datos_ficha = {}

    for columna in PREDICTORAS:
        valor = valores.get(columna)
        etiqueta = ETIQUETAS[columna]
        if isinstance(valor, str):
            valor = valor.strip()
        if valor is None or (isinstance(valor, str) and valor == ""):
            if columna in opciones_validas["obligatorios"]:
                raise ValueError(f"Completá {etiqueta.lower()}.")
            datos_ficha[columna] = np.nan
            continue

        if columna in NUMERICAS:
            if not re.fullmatch(r"[+-]?[0-9]+(?:\.[0-9]+)?", str(valor)):
                raise ValueError(f"{etiqueta} debe ser un número.")
            valor = float(valor)
            minimo, maximo = opciones_validas["rangos"][columna]
            requiere_entero = columna in opciones_validas["enteros"]
            fuera_de_rango = not minimo <= valor <= maximo
            entero_invalido = requiere_entero and not valor.is_integer()
            if fuera_de_rango or entero_invalido:
                mensaje = f"{etiqueta} debe estar entre {minimo} y {maximo}."
                if requiere_entero:
                    mensaje += " Ingresá un entero."
                raise ValueError(mensaje)
        elif valor not in categorias_validas[columna]:
            raise ValueError(f"{etiqueta} no es compatible con las opciones disponibles.")

        datos_ficha[columna] = valor

    return pd.DataFrame([datos_ficha], columns=PREDICTORAS)


def estimar(modelo, opciones_validas, valores):
    ficha_validada = ficha(valores, opciones_validas)
    estimaciones = modelo.predict(ficha_validada)
    return float(estimaciones[0])


def ejemplos(entrenamiento):
    """Elige las mismas fichas de demostracion por su id"""

    ids = ["MLA1402454175", "MLA1546276856", "MLA1640255410"]
    avisos = entrenamiento.set_index("id")
    fichas = []
    for posicion, id_aviso in enumerate(ids):
        if id_aviso not in avisos.index:
            raise ValueError("Una ficha de demostración ya no está en train; revisá sus IDs.")
        columnas = PREDICTORAS
        if posicion == 1:
            columnas = OBLIGATORIAS
        vehiculo = avisos.loc[id_aviso, columnas].to_dict()
        fichas.append({"id": id_aviso, "vehiculo": vehiculo})
    return fichas


def guardar(calidad, particiones, ganador, busquedas, validacion, metricas, casos, segmentos, cortes):
    RESULTADOS.mkdir(exist_ok=True)
    calidad.to_csv(RESULTADOS / "calidad.csv", index=False)
    validacion.to_csv(RESULTADOS / "validacion_cruzada.csv", index=False)
    metricas.to_csv(RESULTADOS / "metricas.csv", index=False)
    casos.to_csv(RESULTADOS / "catalogo_evaluacion.csv", index=False)
    segmentos.to_csv(RESULTADOS / "errores_segmentos.csv", index=False)

    detalle = particiones.detalle.copy()
    detalle["modelo_elegido"] = ganador
    detalle["parametros"] = busquedas[ganador].best_params_
    detalle["cortes_precio_USD"] = cortes
    texto = json.dumps(detalle, ensure_ascii=False, indent=2)
    (RESULTADOS / "particiones.json").write_text(texto, encoding="utf-8")

    entrenamiento = particiones.entrenamiento
    modelo_guardado = {
        "nombre": ganador,
        "modelo": busquedas[ganador].best_estimator_,
        "comparacion_knn": busquedas["k-NN"].best_estimator_,
        "opciones": opciones(entrenamiento),
        "train": entrenamiento[["id"] + PREDICTORAS + ["price"]],
        "ejemplos": ejemplos(entrenamiento),
    }
    joblib.dump(modelo_guardado, RESULTADOS / "modelo.joblib", compress=3)
