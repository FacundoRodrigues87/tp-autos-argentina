"""Estima el precio de un vehiculo desde la terminal"""

import argparse

import joblib

from src.autos import RESULTADOS, estimar


def main():
    argumentos = argparse.ArgumentParser(description=__doc__)
    argumentos.add_argument("--marca", dest="brand", required=True)
    argumentos.add_argument("--modelo", dest="model", required=True)
    argumentos.add_argument("--anio", dest="car_year", required=True)
    argumentos.add_argument("--km", required=True)
    argumentos.add_argument("--combustible", dest="fuel_type", required=True)
    argumentos.add_argument("--transmision", dest="transmission", required=True)
    argumentos.add_argument("--motor", dest="engine_l", help="Cilindrada en litros")
    argumentos.add_argument("--potencia", dest="power_hp", help="Potencia en hp")
    argumentos.add_argument("--puertas", dest="doors")
    argumentos.add_argument("--plazas", dest="passenger_capacity")
    argumentos.add_argument("--traccion", dest="traction_control")
    valores = vars(argumentos.parse_args())

    archivo_modelo = RESULTADOS / "modelo.joblib"
    if not archivo_modelo.is_file():
        argumentos.error("Ejecutá primero TP_autos.ipynb para entrenar y guardar el modelo.")

    modelo_guardado = joblib.load(archivo_modelo)
    try:
        precio = estimar(modelo_guardado["modelo"], modelo_guardado["opciones"], valores)
    except ValueError as error:
        argumentos.error(str(error))

    precio_formateado = f"{precio:,.2f}"
    precio_formateado = precio_formateado.translate(str.maketrans(",.", ".,"))
    print(f"Precio de publicación estimado · USD {precio_formateado}")
    print(f"{modelo_guardado['nombre']} · Avisos históricos de Mercado Libre Argentina")


if __name__ == "__main__":
    main()
