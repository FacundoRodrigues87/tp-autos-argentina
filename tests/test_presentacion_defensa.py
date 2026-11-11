"""Prepara los datos de prueba para la presentacion"""
import argparse
import copy
import inspect
import json
import sys
import textwrap
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))
from presentacion.exportar import exportar_modelo
from src.autos import PREDICTORAS, VecinosRegresor, ejemplos, ficha, preprocesador


def main():
    opciones_terminal = argparse.ArgumentParser(description=__doc__)
    opciones_terminal.add_argument('--modelo', type=Path, default=RAIZ / 'resultados/modelo.joblib')
    opciones_terminal.add_argument('--salida', type=Path, required=True)
    argumentos = opciones_terminal.parse_args()
    guardado = joblib.load(argumentos.modelo)
    modelo = guardado['modelo']
    opciones_validas = guardado['opciones']
    entrenamiento = guardado['train']
    guardado['ejemplos'] = ejemplos(entrenamiento)
    vehiculos = []
    # Probamos los avisos de prueba una muestra de entrenamiento y los opcionales
    casos = pd.read_csv(RAIZ / 'resultados/catalogo_evaluacion.csv')
    vehiculos.extend(casos[PREDICTORAS].replace({np.nan: None}).to_dict('records'))
    vehiculos.extend(entrenamiento[PREDICTORAS].sample(51, random_state=42).replace({np.nan: None}).to_dict('records'))
    ficha_completa = copy.deepcopy(guardado['ejemplos'][0]['vehiculo'])
    combinaciones = [[]]
    for campo in PREDICTORAS:
        if campo in opciones_validas['obligatorios']:
            continue
        con_este_campo = []
        for combinacion in combinaciones:
            con_este_campo.append(combinacion + [campo])
        combinaciones.extend(con_este_campo)

    for combinacion in combinaciones:
        vehiculo = ficha_completa.copy()
        for campo in combinacion:
            vehiculo.pop(campo, None)
        vehiculos.append(vehiculo)
    volkswagen = dict(brand='Volkswagen', model='Up!', car_year=2014, km=108000,
              fuel_type='Nafta', transmission='Manual')
    vehiculos.append(volkswagen)
    vehiculos_prueba = vehiculos[:len(casos)]
    estimaciones_prueba = modelo.predict(casos[PREDICTORAS]).tolist()
    np.testing.assert_allclose(estimaciones_prueba, casos.precio_estimado, atol=1e-8, rtol=0)
    aceptados = []
    for vehiculo in vehiculos:
        try:
            ficha(vehiculo, opciones_validas)
        except ValueError:
            continue
        aceptados.append(vehiculo)
    vehiculos = aceptados
    esperados = [float(modelo.predict(ficha(v, opciones_validas))[0]) for v in vehiculos]
    invalidos = []
    cambios = [(campo, '') for campo in opciones_validas['obligatorios']]
    cambios += [('brand', 'Marca inexistente'), ('model', 'Modelo inexistente'),
                  ('fuel_type', 'categoría ajena'), ('transmission', 'categoría ajena'),
                  ('traction_control', 'categoría ajena'), ('car_year', '2025'),
                  ('car_year', '2014.5'), ('km', '-1'), ('km', '1.5'),
                  ('km', '1e3'), ('engine_l', '1,6'), ('engine_l', 'NaN'),
                  ('engine_l', 'Infinity'), ('engine_l', '2000'),
                  ('power_hp', '0'), ('doors', '4.5'), ('passenger_capacity', '0')]
    for campo, valor in cambios:
        vehiculo = {**ficha_completa, campo: valor}
        try:
            ficha(vehiculo, opciones_validas)
        except ValueError as error:
            invalidos.append({'vehicle': vehiculo, 'field': campo, 'message': str(error)})
        else:
            raise AssertionError(f'Python aceptó el caso inválido: {campo}={valor}')
    # Probamos un modelo real de otra marca
    otra_marca = next(b for b in opciones_validas['modelos'] if b != ficha_completa['brand'])
    otro_modelo = next(m for m in opciones_validas['modelos'][otra_marca] if m not in opciones_validas['modelos'][ficha_completa['brand']])
    vehiculo = {**ficha_completa, 'model': otro_modelo}
    try:
        ficha(vehiculo, opciones_validas)
    except ValueError as error:
        invalidos.append({'vehicle': vehiculo, 'field': 'model', 'message': str(error)})
    # Probamos coincidencias exactas y empates en el ultimo vecino
    casos_limite = []
    vector = modelo.named_steps['preparar'].transform(ficha(ficha_completa, opciones_validas))[0]
    for nombre, desplazamientos, cantidad_vecinos in [('zero', [0, 0, 0, 1, -1], 4), ('ties', [1, -1, 1, -1, 2], 3)]:
        for pesos in ['uniform', 'distance']:
            copia = copy.deepcopy(modelo)
            vectores = np.repeat(vector[None, :], len(desplazamientos), axis=0)
            vectores[:, 0] += desplazamientos
            regresor = VecinosRegresor(n_neighbors=cantidad_vecinos, weights=pesos).fit(vectores, [5000, 10000, 15000, 20000, 25000])
            copia.steps[-1] = ('modelo', regresor)
            indices, distancias, normalizados = regresor.vecinos(vector[None, :])
            casos_limite.append({'name': f'{nombre}-{pesos}', 'model': exportar_modelo(copia), 'vehicle': ficha_completa,
                             'price': float(copia.predict(ficha(ficha_completa, opciones_validas))[0]),
                             'indices': indices[0].tolist(), 'distances': distancias[0].tolist(),
                             'weights': normalizados[0].tolist()})
    alternativas = []
    for regresor in [DummyRegressor(strategy='median'), LinearRegression()]:
        modelo_alternativo = Pipeline([('preparar', preprocesador()), ('modelo', regresor)]).fit(entrenamiento[PREDICTORAS], entrenamiento.price)
        alternativas.append({'model': exportar_modelo(modelo_alternativo), 'vehicles': vehiculos[-33:],
                             'expected': [float(modelo_alternativo.predict(ficha(v, opciones_validas))[0]) for v in vehiculos[-33:]]})
    resultado = {'testVehicles': vehiculos_prueba, 'testExpected': estimaciones_prueba, 'options': opciones_validas, 'model': exportar_modelo(modelo), 'vehicles': vehiculos, 'expected': esperados,
              'invalid': invalidos, 'boundary': casos_limite, 'alternatives': alternativas,
              'samples': [{'vehicle': fila['vehiculo'], 'price': float(modelo.predict(ficha(fila['vehiculo'], opciones_validas))[0])} for fila in guardado['ejemplos']],
              'implementation': textwrap.dedent(inspect.getsource(VecinosRegresor.predict)).strip()}
    argumentos.salida.parent.mkdir(parents=True, exist_ok=True)
    argumentos.salida.write_text(json.dumps(resultado, ensure_ascii=False, allow_nan=False), encoding='utf-8')
    print(f'{len(vehiculos_prueba)} predicciones de prueba {len(vehiculos)} fichas validas {len(invalidos)} invalidas {len(casos_limite)} casos de coincidencias y empates y 2 modelos alternativos')


if __name__ == '__main__':
    main()
