"""Estimá el precio de publicación de un vehículo desde la terminal."""

import argparse

import joblib

from src.autos import RESULTS, estimar


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--marca", dest="brand", required=True)
    parser.add_argument("--modelo", dest="model", required=True)
    parser.add_argument("--anio", dest="car_year", required=True)
    parser.add_argument("--km", required=True)
    parser.add_argument("--combustible", dest="fuel_type", required=True)
    parser.add_argument("--transmision", dest="transmission", required=True)
    parser.add_argument("--motor", dest="engine_l", help="Cilindrada en litros")
    parser.add_argument("--potencia", dest="power_hp", help="Potencia en hp")
    parser.add_argument("--puertas", dest="doors")
    parser.add_argument("--plazas", dest="passenger_capacity")
    parser.add_argument("--traccion", dest="traction_control")
    values = vars(parser.parse_args())
    path = RESULTS / "modelo.joblib"
    if not path.is_file():
        parser.error("Ejecutá primero TP_autos.ipynb para entrenar y guardar el modelo.")
    saved = joblib.load(path)
    try:
        price = estimar(saved["modelo"], saved["opciones"], values)
    except ValueError as error:
        parser.error(str(error))
    amount = f"{price:,.2f}".translate(str.maketrans(",.", ".,"))
    print(f"Precio de publicación estimado · USD {amount}")
    print(f"{saved['nombre']} · Avisos históricos de Mercado Libre Argentina")


if __name__ == "__main__":
    main()
