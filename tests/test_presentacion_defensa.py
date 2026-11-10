"""Fixtures Python para comprobar el HTML real: no modifica notebook ni resultados.

python tests/test_presentacion_defensa.py --modelo /ruta/modelo.joblib --salida /tmp/defensa.json
"""
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

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from presentacion.exportar import demo_examples, export_model
from src.autos import CAT, FEATURES, NUM, VecinosRegresor, ficha, preprocesador


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--modelo', type=Path, default=ROOT / 'resultados/modelo.joblib')
    parser.add_argument('--salida', type=Path, required=True)
    args = parser.parse_args()
    saved = joblib.load(args.modelo)
    pipeline, options, train = saved['modelo'], saved['opciones'], saved['train']
    saved['ejemplos'] = demo_examples(train)
    vehicles = []
    # All held-out records, deterministic training sample, and every mask of optional fields.
    cases = pd.read_csv(ROOT / 'resultados/catalogo_evaluacion.csv')
    vehicles.extend(cases[FEATURES].replace({np.nan: None}).to_dict('records'))
    vehicles.extend(train[FEATURES].sample(51, random_state=42).replace({np.nan: None}).to_dict('records'))
    complete = copy.deepcopy(saved['ejemplos'][0]['vehiculo'])
    optional = [f for f in FEATURES if f not in options['obligatorios']]
    for mask in range(2 ** len(optional)):
        vehicle = copy.deepcopy(complete)
        for i, field in enumerate(optional):
            if mask & (1 << i):
                vehicle.pop(field, None)
        vehicles.append(vehicle)
    up = dict(brand='Volkswagen', model='Up!', car_year=2014, km=108000,
              fuel_type='Nafta', transmission='Manual')
    vehicles.append(up)
    test_vehicles = vehicles[:len(cases)]
    test_expected = pipeline.predict(cases[FEATURES]).tolist()
    np.testing.assert_allclose(test_expected, cases.precio_estimado, atol=1e-8, rtol=0)
    accepted = []
    for vehicle in vehicles:
        try:
            ficha(vehicle, options)
        except ValueError:
            continue
        accepted.append(vehicle)
    vehicles = accepted
    expected = [float(pipeline.predict(ficha(v, options))[0]) for v in vehicles]
    invalid = []
    mutations = [(field, '') for field in options['obligatorios']]
    mutations += [('brand', 'Marca inexistente'), ('model', 'Modelo inexistente'),
                  ('fuel_type', 'categoría ajena'), ('transmission', 'categoría ajena'),
                  ('traction_control', 'categoría ajena'), ('car_year', '2025'),
                  ('car_year', '2014.5'), ('km', '-1'), ('km', '1.5'),
                  ('km', '1e3'), ('engine_l', '1,6'), ('engine_l', 'NaN'),
                  ('engine_l', 'Infinity'), ('engine_l', '2000'),
                  ('power_hp', '0'), ('doors', '4.5'), ('passenger_capacity', '0')]
    for field, value in mutations:
        vehicle = {**complete, field: value}
        try:
            ficha(vehicle, options)
        except ValueError as error:
            invalid.append({'vehicle': vehicle, 'field': field, 'message': str(error)})
        else:
            raise AssertionError(f'Python aceptó el caso inválido: {field}={value}')
    # A real model from a different brand, not merely an unknown string.
    other = next(b for b in options['modelos'] if b != complete['brand'])
    incompatible = next(m for m in options['modelos'][other] if m not in options['modelos'][complete['brand']])
    vehicle = {**complete, 'model': incompatible}
    try:
        ficha(vehicle, options)
    except ValueError as error:
        invalid.append({'vehicle': vehicle, 'field': 'model', 'message': str(error)})
    # Exact matches and ties at the kth neighbor use Python's actual regressor and exporter.
    boundary = []
    vector = pipeline.named_steps['preparar'].transform(ficha(complete, options))[0]
    for name, offsets, k in [('zero', [0, 0, 0, 1, -1], 4), ('ties', [1, -1, 1, -1, 2], 3)]:
        for weights in ['uniform', 'distance']:
            clone = copy.deepcopy(pipeline)
            vectors = np.repeat(vector[None, :], len(offsets), axis=0)
            vectors[:, 0] += offsets
            regressor = VecinosRegresor(n_neighbors=k, weights=weights).fit(vectors, [5000, 10000, 15000, 20000, 25000])
            clone.steps[-1] = ('modelo', regressor)
            indices, distances, normalized = regressor.neighbors(vector[None, :])
            boundary.append({'name': f'{name}-{weights}', 'model': export_model(clone), 'vehicle': complete,
                             'price': float(clone.predict(ficha(complete, options))[0]),
                             'indices': indices[0].tolist(), 'distances': distances[0].tolist(),
                             'weights': normalized[0].tolist()})
    alternatives = []
    for regressor in [DummyRegressor(strategy='median'), LinearRegression()]:
        alternate = Pipeline([('preparar', preprocesador()), ('modelo', regressor)]).fit(train[FEATURES], train.price)
        alternatives.append({'model': export_model(alternate), 'vehicles': vehicles[-33:],
                             'expected': [float(alternate.predict(ficha(v, options))[0]) for v in vehicles[-33:]]})
    result = {'testVehicles': test_vehicles, 'testExpected': test_expected, 'options': options, 'model': export_model(pipeline), 'vehicles': vehicles, 'expected': expected,
              'invalid': invalid, 'boundary': boundary, 'alternatives': alternatives,
              'samples': [{'vehicle': row['vehiculo'], 'price': float(pipeline.predict(ficha(row['vehiculo'], options))[0])} for row in saved['ejemplos']],
              'implementation': textwrap.dedent(inspect.getsource(VecinosRegresor.predict)).strip()}
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    args.salida.write_text(json.dumps(result, ensure_ascii=False, allow_nan=False), encoding='utf-8')
    print(f'{len(test_vehicles)} predicciones de test; {len(vehicles)} fichas válidas; {len(invalid)} inválidas; {len(boundary)} casos de coincidencias/empates; 2 modelos alternativos.')


if __name__ == '__main__':
    main()
