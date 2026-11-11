"""Reproduce el modelo y compara los resultados con los guardados"""
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

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))
from src.autos import PREDICTORAS, cargar, ejemplos, evaluar, limpiar, opciones, seleccionar, separar


def main():
    opciones_terminal = argparse.ArgumentParser(description=__doc__)
    opciones_terminal.add_argument('--salida', type=Path, required=True)
    argumentos = opciones_terminal.parse_args()
    if (RAIZ / 'resultados').resolve() in argumentos.salida.resolve().parents:
        opciones_terminal.error('Elegí una salida temporal fuera de resultados para preservar la base.')
    avisos, _ = limpiar(cargar())
    particiones = separar(avisos)
    ganador, busquedas, _ = seleccionar(particiones)
    metricas, casos, _, _ = evaluar(particiones, ganador, busquedas)
    referencia = pd.read_csv(RAIZ / 'resultados/metricas.csv')
    casos_referencia = pd.read_csv(RAIZ / 'resultados/catalogo_evaluacion.csv')
    particion = json.loads((RAIZ / 'resultados/particiones.json').read_text(encoding="utf-8"))
    assert ganador == particion['modelo_elegido']
    assert busquedas[ganador].best_params_ == particion['parametros']
    assert casos.id.tolist() == casos_referencia.id.tolist()
    np.testing.assert_allclose(metricas[['MAE_test', 'RMSE_test', 'R2_test']],
                               referencia[['MAE_test', 'RMSE_test', 'R2_test']], atol=1e-8, rtol=0)
    np.testing.assert_allclose(casos.precio_estimado, casos_referencia.precio_estimado, atol=1e-8, rtol=0)
    argumentos.salida.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({'nombre': ganador, 'modelo': busquedas[ganador].best_estimator_,
                 'comparacion_knn': busquedas['k-NN'].best_estimator_, 'opciones': opciones(particiones.entrenamiento),
                 'train': particiones.entrenamiento[['id', *PREDICTORAS, 'price']], 'ejemplos': ejemplos(particiones.entrenamiento)}, argumentos.salida)
    informe = {'python': platform.python_version(), 'platform': platform.platform(),
              'numpy': np.__version__, 'pandas': pd.__version__, 'scipy': scipy.__version__,
              'sklearn': sklearn.__version__, 'winner': ganador, 'params': busquedas[ganador].best_params_,
              'test_predictions_checked': len(casos), 'test_tolerance_USD': 1e-8,
              'CV_reproduced': bool(np.allclose(metricas.MAE_CV, referencia.MAE_CV, atol=1e-8, rtol=0)),
              'CV': [{'model': nombre, 'stored': anterior, 'local': actual}
                     for nombre, anterior, actual in zip(metricas.modelo, referencia.MAE_CV, metricas.MAE_CV)]}
    argumentos.salida.with_suffix('.validacion.json').write_text(json.dumps(informe, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(informe, indent=2, ensure_ascii=False))
    print(f'Modelo local {argumentos.salida}')


if __name__ == '__main__':
    main()
