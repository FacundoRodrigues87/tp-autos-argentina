"""Modelos y recomendaciones del TP sobre Vehicle dataset v4."""
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsRegressor
from sklearn.model_selection import GroupShuffleSplit, GroupKFold, GridSearchCV
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

NUM=['Year','Kilometer','engine_cc','power_bhp','Length','Width','Height','Seating Capacity','Fuel Tank Capacity']
CAT=['Make','Fuel Type','Transmission','Owner','Seller Type','Drivetrain']
FEATURES=NUM+CAT

def limpiar(raw):
    d=raw.copy()
    d['aviso_id']=np.arange(len(d))
    for col in raw.select_dtypes(include=['object','str']).columns:
        d[col]=d[col].astype('string').str.strip().replace('',pd.NA)
        d[col]=d[col].astype(object).where(d[col].notna(),np.nan)
    for source,target in [('Engine','engine_cc'),('Max Power','power_bhp')]:
        d[target]=pd.to_numeric(d[source].str.extract(r'(\d+(?:\.\d+)?)',expand=False),errors='coerce')
    valid=(d.Price.gt(0)&d.Year.between(1886,pd.Timestamp.today().year)&d.Kilometer.ge(0))
    d=d.loc[valid].drop_duplicates(subset=list(raw.columns)).copy()
    for col in ['engine_cc','power_bhp','Length','Width','Height','Seating Capacity','Fuel Tank Capacity']:
        d.loc[d[col].le(0),col]=np.nan
    return d

def preprocesador():
    return ColumnTransformer([
      ('num',Pipeline([('imputar',SimpleImputer(strategy='median')),('escalar',StandardScaler())]),NUM),
      ('cat',Pipeline([('imputar',SimpleImputer(strategy='most_frequent')),('onehot',OneHotEncoder(handle_unknown='ignore',sparse_output=False))]),CAT)])

def evaluar(d):
    # Agrupamos versión y año: el mismo grupo nunca cruza train/test ni los folds.
    groups=d[['Make','Model','Year']].astype(str).agg('|'.join,axis=1)
    train,test=next(GroupShuffleSplit(n_splits=1,test_size=.2,random_state=42).split(d,groups=groups))
    assert set(groups.iloc[train]).isdisjoint(groups.iloc[test])
    folds=list(GroupKFold(5).split(d.iloc[train],groups=groups.iloc[train]))
    choices={'Baseline mediana':(DummyRegressor(strategy='median'),{}),
             'Regresión lineal':(LinearRegression(),{}),
             'k-NN':(KNeighborsRegressor(),{'modelo__n_neighbors':[5,15,35], 'modelo__weights':['uniform','distance']})}
    fitted={}
    for name,(model,grid) in choices.items():
        pipe=Pipeline([('preparar',preprocesador()),('modelo',model)])
        search=GridSearchCV(pipe,grid,cv=folds,scoring='neg_mean_absolute_error',n_jobs=1)
        search.fit(d.iloc[train][FEATURES],d.iloc[train].Price)
        fitted[name]=search
    winner=max(fitted,key=lambda name:fitted[name].best_score_)
    rows=[]
    for name,search in fitted.items():
        pred=search.predict(d.iloc[test][FEATURES])
        rows.append({'modelo':name,'MAE_CV':-search.best_score_,'MAE_test':mean_absolute_error(d.iloc[test].Price,pred),
                     'RMSE_test':root_mean_squared_error(d.iloc[test].Price,pred),'R2_test':r2_score(d.iloc[test].Price,pred),
                     'elegido_por_CV':name==winner})
    catalog=d.iloc[test].copy()
    catalog['precio_estimado']=fitted[winner].predict(catalog[FEATURES])
    detail={'modelo_elegido':winner,'parametros':fitted[winner].best_params_, 'train':len(train),'test':len(test),
            'grupos_train':int(groups.iloc[train].nunique()),'grupos_test':int(groups.iloc[test].nunique()),'grupos_compartidos':0}
    return pd.DataFrame(rows),catalog,detail

def recomendar(catalogo,presupuesto,plazas=5,caja=None,combustible=None,anio_min=None,km_max=None,pesos=(.4,.3,.3),cantidad=5):
    if not np.isfinite(presupuesto) or presupuesto<=0:raise ValueError('Presupuesto positivo requerido.')
    w=np.asarray(pesos,dtype=float)
    if w.shape!=(3,) or not np.isfinite(w).all() or (w<0).any() or w.sum()<=0:raise ValueError('Tres pesos no negativos con suma positiva.')
    if not isinstance(cantidad,int) or cantidad<1:raise ValueError('Cantidad positiva requerida.')
    if not np.isfinite(plazas) or plazas<1:raise ValueError('Cantidad de plazas positiva requerida.')
    d=catalogo.loc[catalogo.Price.le(presupuesto)&catalogo['Seating Capacity'].ge(plazas)].copy()
    for col,val in [('Transmission',caja),('Fuel Type',combustible)]:
        if val is not None:d=d.loc[d[col].str.casefold().eq(str(val).strip().casefold())]
    if anio_min is not None:d=d.loc[d.Year.ge(anio_min)]
    if km_max is not None:d=d.loc[d.Kilometer.le(km_max)]
    if d.empty:return d
    d['puntaje_precio']=1-d.Price/presupuesto
    d['puntaje_anio']=(d.Year-catalogo.Year.min())/max(1,catalogo.Year.max()-catalogo.Year.min())
    d['puntaje_km']=1-d.Kilometer/max(1,catalogo.Kilometer.max())
    d['puntaje']=d[['puntaje_precio','puntaje_anio','puntaje_km']].to_numpy()@(w/w.sum())
    d['explicacion']=d.apply(lambda r:f"{int(r['Seating Capacity'])} plazas; {r.Transmission}; {r['Fuel Type']}; año {int(r.Year)}; {int(r.Kilometer):,} km",axis=1)
    return d.sort_values(['puntaje','aviso_id'],ascending=[False,True]).head(cantidad)
