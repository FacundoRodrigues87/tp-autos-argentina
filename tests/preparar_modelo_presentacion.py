"""Reproduce el modelo en memoria y lo guarda fuera de resultados para revisar el HTML.

No ejecuta ni modifica el notebook. Compara el ganador, métricas y predicciones
con los CSV de esta base. Informa diferencias de CV sin sobrescribirlas.
"""
import argparse
import json
import platform
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import scipy
import sklearn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from presentacion.exportar import demo_examples
from src.autos import FEATURES, cargar, evaluar, limpiar, opciones, seleccionar, separar


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--salida', type=Path, required=True)
    args = parser.parse_args()
    if (ROOT / 'resultados').resolve() in args.salida.resolve().parents:
        parser.error('Elegí una salida temporal fuera de resultados para preservar la base.')
    data, _ = limpiar(cargar())
    parts = separar(data)
    winner, searches, cv = seleccionar(parts)
    metrics, cases, _, _ = evaluar(parts, winner, searches)
    reference = pd.read_csv(ROOT / 'resultados/metricas.csv')
    reference_cases = pd.read_csv(ROOT / 'resultados/catalogo_evaluacion.csv')
    partition = json.loads((ROOT / 'resultados/particiones.json').read_text())
    assert winner == partition['modelo_elegido']
    assert searches[winner].best_params_ == partition['parametros']
    assert cases.id.tolist() == reference_cases.id.tolist()
    np.testing.assert_allclose(metrics[['MAE_test', 'RMSE_test', 'R2_test']],
                               reference[['MAE_test', 'RMSE_test', 'R2_test']], atol=1e-8, rtol=0)
    np.testing.assert_allclose(cases.precio_estimado, reference_cases.precio_estimado, atol=1e-8, rtol=0)
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({'nombre': winner, 'modelo': searches[winner].best_estimator_,
                 'comparacion_knn': searches['k-NN'].best_estimator_, 'opciones': opciones(parts.train),
                 'train': parts.train[['id', *FEATURES, 'price']], 'ejemplos': demo_examples(parts.train)}, args.salida)
    report = {'python': platform.python_version(), 'platform': platform.platform(),
              'numpy': np.__version__, 'pandas': pd.__version__, 'scipy': scipy.__version__,
              'sklearn': sklearn.__version__, 'winner': winner, 'params': searches[winner].best_params_,
              'test_predictions_checked': len(cases), 'test_tolerance_USD': 1e-8,
              'CV_reproduced': bool(np.allclose(metrics.MAE_CV, reference.MAE_CV, atol=1e-8, rtol=0)),
              'CV': [{'model': name, 'stored': old, 'local': new}
                     for name, old, new in zip(metrics.modelo, reference.MAE_CV, metrics.MAE_CV)]}
    args.salida.with_suffix('.validacion.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f'Modelo local: {args.salida}')


if __name__ == '__main__':
    main()
