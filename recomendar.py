import argparse
from pathlib import Path
import pandas as pd
from src.autos import recomendar
if __name__=='__main__':
    p=argparse.ArgumentParser(description='Recomendador sobre un catálogo histórico de India. Presupuesto en unidades de Price.')
    p.add_argument('--presupuesto',type=float,required=True)
    p.add_argument('--plazas',type=int,default=5)
    p.add_argument('--caja')
    p.add_argument('--combustible')
    p.add_argument('--anio-min',type=int)
    p.add_argument('--km-max',type=float)
    p.add_argument('--pesos',nargs=3,type=float,default=[.4,.3,.3])
    args=vars(p.parse_args())
    archivo=Path(__file__).resolve().parent/'resultados/catalogo_evaluacion.csv'
    if not archivo.exists():p.error('Ejecutá primero TP_autos.ipynb.')
    try:r=recomendar(pd.read_csv(archivo),**args)
    except ValueError as e:p.error(str(e))
    print('Demostración académica: catálogo histórico de India. No son precios argentinos actuales.')
    print('Sin opciones compatibles.' if r.empty else r[['Make','Model','Price','precio_estimado','puntaje','explicacion']].to_string(index=False))
