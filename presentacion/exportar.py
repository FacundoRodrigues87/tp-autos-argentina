"""Arma la presentacion con los resultados del notebook"""

import argparse
import base64
import inspect
import json
import textwrap
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from src.autos import (
    ARCHIVO_FUENTE, CATEGORICAS, NUMERICAS, RAIZ, RESULTADOS,
    VecinosRegresor, cargar, ejemplos, limpiar, preprocesador,
)

CARPETA_PRESENTACION = Path(__file__).resolve().parent


def registros(tabla):
    texto = tabla.to_json(orient="records", double_precision=15)
    return json.loads(texto)


def exportar_modelo(preparacion_y_modelo):
    preparacion = preparacion_y_modelo.named_steps["preparar"].named_transformers_
    pasos_numericos = preparacion["num"].named_steps
    pasos_categoricos = preparacion["cat"].named_steps
    escalador = pasos_numericos["escalar"]

    categorias = []
    for columna in pasos_categoricos["onehot"].categories_:
        categorias.append(columna.tolist())

    estado = {
        "numeric": NUMERICAS,
        "categorical": CATEGORICAS,
        "median": pasos_numericos["imputar"].statistics_.tolist(),
        "mean": escalador.mean_.tolist(),
        "scale": escalador.scale_.tolist(),
        "mode": pasos_categoricos["imputar"].statistics_.tolist(),
        "categories": categorias,
    }
    modelo = preparacion_y_modelo.named_steps["modelo"]
    if isinstance(modelo, VecinosRegresor):
        vectores = []
        cantidad_numeros = len(NUMERICAS)
        for fila in modelo.vectors_:
            # Guardamos los numeros completos y las posiciones de los unos
            numeros = fila[:cantidad_numeros].tolist()
            columnas_activas = np.flatnonzero(fila[cantidad_numeros:]).tolist()
            vectores.append([numeros, columnas_activas])
        estado["kind"] = "knn"
        estado["k"] = modelo.n_neighbors
        estado["weights"] = modelo.weights
        estado["vectors"] = vectores
        estado["prices"] = modelo.prices_.tolist()
    elif hasattr(modelo, "coef_"):
        estado["kind"] = "linear"
        estado["coef"] = modelo.coef_.tolist()
        estado["intercept"] = modelo.intercept_
    else:
        estado["kind"] = "median"
        estado["value"] = float(modelo.constant_.item())
    return estado


def datos_presentacion(archivo_modelo=None):
    if archivo_modelo is None:
        archivo_modelo = RESULTADOS / "modelo.joblib"
    guardado = joblib.load(archivo_modelo)
    original = cargar()
    avisos, _ = limpiar(original)

    casos = pd.read_csv(RESULTADOS / "catalogo_evaluacion.csv")
    error_mediano = casos["error_abs"].median()
    distancia_a_la_mediana = (casos["error_abs"] - error_mediano).abs()
    caso_tipico = casos.loc[[distancia_a_la_mediana.idxmin()]]
    casos_mayores = casos.nlargest(2, "error_abs")
    destacados = pd.concat([caso_tipico, casos_mayores])

    metricas = pd.read_csv(RESULTADOS / "metricas.csv")
    validacion = pd.read_csv(RESULTADOS / "validacion_cruzada.csv")
    segmentos = pd.read_csv(RESULTADOS / "errores_segmentos.csv")
    auditoria = pd.read_csv(RESULTADOS / "calidad.csv")
    seleccion = auditoria.loc[auditoria["accion"].eq("selección"), "cantidad"]
    particiones = json.loads((RESULTADOS / "particiones.json").read_text(encoding="utf-8"))

    cantidades, bordes = np.histogram(avisos["price"], bins=np.arange(0, 85001, 5000))
    precios = {
        "max": avisos["price"].max(),
        "mean": avisos["price"].mean(),
        "median": avisos["price"].median(),
        "q1": avisos["price"].quantile(0.25),
        "q3": avisos["price"].quantile(0.75),
        "histogram": cantidades.tolist(),
        "edges": bordes.tolist(),
    }
    relaciones = {}
    for columna in ["car_year", "km", "power_hp"]:
        pares = avisos[[columna, "price"]].dropna()
        relaciones[columna] = {
            "points": pares.to_numpy().tolist(),
            "r": pares[columna].corr(pares["price"]),
        }

    ids_auditados = ["MLA1404982421", "MLA1639157994", "MLA1403304889"]
    por_id = original.drop_duplicates("id").set_index("id")
    avisos_auditados = por_id.loc[ids_auditados, ["title", "model", "car_year", "doors", "price"]]
    imagenes = {}
    archivos_imagenes = {
        "univariate": "01_univariado.png",
        "correlation": "03_correlacion.png",
        "brands": "04_marcas.png",
    }
    for nombre, archivo in archivos_imagenes.items():
        contenido = (RESULTADOS / archivo).read_bytes()
        texto = base64.b64encode(contenido).decode("ascii")
        imagenes[nombre] = "data:image/png;base64," + texto

    marcas = avisos.groupby("brand").agg(n=("price", "size"), mediana=("price", "median"))
    marcas = marcas.sort_values("mediana").reset_index()
    ganador = exportar_modelo(guardado["modelo"])
    comparacion_vecinos = None
    funcion_mostrada = VecinosRegresor.predict
    if ganador["kind"] != "knn":
        comparacion_vecinos = exportar_modelo(guardado["comparacion_knn"])
        funcion_mostrada = preprocesador
    codigo = textwrap.dedent(inspect.getsource(funcion_mostrada)).strip()
    columnas_destacadas = ["id", "brand", "model", "car_year", "price", "precio_estimado", "error"]
    return {
        "implementation": {
            "file": "src/autos.py",
            "function": funcion_mostrada.__qualname__,
            "code": codigo,
        },
        "edaImages": imagenes,
        "brandSummary": registros(marcas),
        "source": json.loads(ARCHIVO_FUENTE.read_text(encoding="utf-8")),
        "raw": {"rows": len(original), "cols": len(original.columns)},
        "selected": int(seleccion.iloc[0]),
        "clean": len(avisos),
        "brands": avisos["brand"].nunique(),
        "models": avisos["model"].nunique(),
        "audit": registros(auditoria),
        "auditExamples": registros(avisos_auditados.reset_index()),
        "price": precios,
        "relations": relaciones,
        "partition": particiones,
        "metrics": registros(metricas),
        "cv": registros(validacion),
        "errors": registros(segmentos),
        "cases": registros(destacados[columnas_destacadas]),
        "testPoints": casos[["price", "precio_estimado"]].to_numpy().tolist(),
        "options": guardado["opciones"],
        "examples": ejemplos(guardado["train"]),
        "model": ganador,
        "knn": comparacion_vecinos,
        "neighbors": registros(guardado["train"][["brand", "model", "car_year", "km"]]),
    }


def main(argumentos=None):
    opciones = argparse.ArgumentParser(description=__doc__)
    opciones.add_argument("--modelo", type=Path, help="Ruta del modelo joblib")
    entrada = opciones.parse_args(argumentos)
    datos = datos_presentacion(entrada.modelo)
    texto_datos = json.dumps(datos, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    # Evitamos que un texto del CSV pueda cerrar la etiqueta de datos
    texto_datos = texto_datos.replace("<", r"\u003c")
    pagina = (CARPETA_PRESENTACION / "layout.html.in").read_text(encoding="utf-8")
    estilos = (CARPETA_PRESENTACION / "estilos.css").read_text(encoding="utf-8")
    modelo = (CARPETA_PRESENTACION / "modelo.js").read_text(encoding="utf-8")
    interacciones = (CARPETA_PRESENTACION / "app.js").read_text(encoding="utf-8")

    pagina = pagina.replace("/* ESTILOS */", estilos)
    pagina = pagina.replace("/* MODELO */", modelo)
    pagina = pagina.replace("/* INTERACCIONES */", interacciones)
    pagina = pagina.replace("/* DATOS */", texto_datos)
    salida = RAIZ / "presentacion/presentacion.html"
    salida.write_text(pagina, encoding="utf-8")
    print(f"{salida.name} · {salida.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
