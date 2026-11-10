# Fuente y decisiones sobre los datos

**Cars publications prices - MercadoLibreARG** contiene avisos recopilados por Ariel Rasgido mediante la API pública de Mercado Libre Argentina. Kaggle registra la actualización de la versión 1 el 6 de febrero de 2024 y la licencia declarada MIT. El CSV se descargó el 9 de noviembre de 2026. [Ficha del dataset](https://www.kaggle.com/datasets/arielras/cars-publications-prices-mercadolibrearg) · [Metadata de la fuente](https://www.kaggle.com/api/v1/datasets/view/arielras/cars-publications-prices-mercadolibrearg)

El miembro `MeliCarPublicactionsCSV/MeliCarPublicactions.csv` del ZIP oficial se guarda byte por byte en `data/raw/MeliCarPublicactions.csv`. El código comprueba su SHA-256 al cargarlo. El registro de procedencia está en [dataset_metadata.json](dataset_metadata.json).

```text
0bce5fcc04bc320713a750ebdf4512f35c638c96dcf6dedab8059e8bcc91f25f
```

| Estado | ARS | USD | Total |
| --- | ---: | ---: | ---: |
| Usado | 4.015 | 4.047 | 8.062 |
| Nuevo | 2.072 | 57 | 2.129 |
| Total | 6.087 | 4.104 | 10.191 |

La muestra conserva solo avisos de usados publicados directamente en USD. El campo `car_year` mide el año del vehículo. Febrero de 2024 identifica la actualización del dataset.

## Reglas de calidad

- **ID repetido.** Se conserva la primera aparición. `MLA1404982421` figura como Ford Ka en el campo `model` y como Focus III en el título. Se deduplicó por ID y se conservó el campo de modelo declarado.
- **Importes y kilometraje.** Se excluyen precios inválidos o no positivos y kilometrajes inválidos o negativos. En la muestra estas reglas no eliminaron filas.
- **Año.** Se exige un entero entre 1886 y 2024. El año `436673` de `MLA1639157994` excluyó ese aviso.
- **Especificaciones.** Convertimos cilindrada a litros, potencia a hp y puertas y plazas a conteos. Se aceptan 0,5–10 L, 20–1.500 hp, 2–6 puertas y 1–12 plazas. Las especificaciones no interpretables o fuera de rango pasan a faltantes. Por ejemplo, `2000` se interpreta como 2 L y `4 cilindros` queda faltante. El Corsa excluido por el año también tenía `60252` puertas y figura en ambas reglas.
- **Financiación.** Entre los 24 títulos con menciones, el Fiat Uno `MLA1403304889` identifica USD 3.400 como anticipo. Los otros 23 avisos se conservan porque ofrecen financiación sin identificar el importe como parcial.
- **Extremos.** Se conservaron los precios alejados de la distribución central cuando las reglas anteriores no aportaron evidencia para excluirlos.

Quedan **4.044** publicaciones. Las correcciones de especificaciones se cuentan sobre el recorte deduplicado, de modo que pueden coincidir con una exclusión posterior. [Registro de calidad](../resultados/calidad.csv)

## Alcance

Son precios publicados de un recorte de modelos y marcas. El modelo usa las características registradas y trata los datos opcionales desconocidos mediante imputación. Estado, historial de mantenimiento, precio de venta final y condiciones actuales de mercado quedan fuera del estimador.
