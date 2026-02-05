import json
from pathlib import Path

import pandas as pd
import streamlit as st
import folium
from streamlit_folium import st_folium

st.set_page_config(page_title="Autorizaciones por país", layout="wide")

DATA_PATH = Path("data/autorizaciones_mock.xlsx")
GEOJSON_PATH = Path("assets/countries.geojson")

REQUIRED_COLS = ["country_iso3", "country_name", "distributor", "product", "category"]


@st.cache_data
def load_data(xlsx_path: Path) -> pd.DataFrame:
    df = pd.read_excel(xlsx_path, sheet_name="data")
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Faltan columnas en Excel: {missing}. Deben existir: {REQUIRED_COLS}")
    # Normaliza strings
    for c in ["country_iso3", "country_name", "distributor", "product", "category"]:
        df[c] = df[c].astype(str).str.strip()
    df["country_iso3"] = df["country_iso3"].str.upper()
    return df


@st.cache_data
def load_geojson(p: Path) -> dict:
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def build_map(geojson: dict, countries_with_data: set[str]) -> folium.Map:
    m = folium.Map(location=[20, 0], zoom_start=2, tiles="CartoDB positron")

    def style_fn(feature):
        iso3 = (feature.get("properties", {}).get("ISO3166-1-Alpha-3") or "").upper()
        has_data = iso3 in countries_with_data
        return {
            "fillColor": "#2E86DE" if has_data else "#D5D8DC",
            "color": "#566573",
            "weight": 0.8,
            "fillOpacity": 0.55 if has_data else 0.25,
        }

    def highlight_fn(_):
        return {"weight": 2.0, "fillOpacity": 0.75}

    gj = folium.GeoJson(
        geojson,
        name="countries",
        style_function=style_fn,
        highlight_function=highlight_fn,
        tooltip=folium.GeoJsonTooltip(
            fields=["name", "ISO3166-1-Alpha-3"],
            aliases=["País", "ISO3"],
            sticky=False,
        ),
    )
    gj.add_to(m)

    # Clic: guardamos feature y lo leemos en Streamlit
    folium.LatLngPopup().add_to(m)

    return m

def extract_clicked_iso3(map_state: dict) -> str | None:
    lad = map_state.get("last_active_drawing")
    if not lad:
        return None
    props = lad.get("properties") or {}
    iso3 = props.get("ISO3166-1-Alpha-3")
    if isinstance(iso3, str) and iso3.strip():
        return iso3.strip().upper()
    return None


st.title("Mapa de autorizaciones (País → Distribuidores → Productos)")

# Carga
try:
    df = load_data(DATA_PATH)
except Exception as e:
    st.error(f"No puedo leer {DATA_PATH} (hoja 'data'). Error: {e}")
    st.stop()

try:
    countries_geojson = load_geojson(GEOJSON_PATH)
except Exception as e:
    st.error(f"No puedo leer {GEOJSON_PATH}. Error: {e}")
    st.stop()

countries_with_data = set(df["country_iso3"].unique())

# Layout
left, right = st.columns([1.2, 1.0], gap="large")

with left:
    st.subheader("Mapa (clic en un país)")
    folium_map = build_map(countries_geojson, countries_with_data)
    map_state = st_folium(folium_map, height=560, use_container_width=True)

clicked_iso3 = extract_clicked_iso3(map_state)

with right:
    st.subheader("Detalle por país")

    # Fallback: selector si aún no han clicado
    default_country = clicked_iso3 if clicked_iso3 else None
    country_options = sorted(df["country_iso3"].unique().tolist())
    selected_iso3 = st.selectbox(
        "País (ISO3)",
        options=country_options,
        index=country_options.index(default_country) if default_country in country_options else 0,
        help="Puedes elegir aquí o clicar en el mapa.",
    )

    country_df = df[df["country_iso3"] == selected_iso3].copy()

    # Título país
    country_name = country_df["country_name"].iloc[0] if not country_df.empty else selected_iso3
    st.markdown(f"**{country_name} ({selected_iso3})**")

    # Buscador
    q = st.text_input("Buscar producto (contiene)", value="", placeholder="Ej: Producto A, amino, etc.")

    if q.strip():
        country_df = country_df[country_df["product"].str.contains(q.strip(), case=False, na=False)]

    if country_df.empty:
        st.info("No hay registros para este país con los filtros actuales.")
    else:
        # Acordeones por distribuidor
        for dist, g in country_df.groupby("distributor"):
            with st.expander(f"{dist} — {g['product'].nunique()} productos", expanded=False):
                # Tabla simple y limpia
                show = (
                    g[["product", "category"]]
                    .drop_duplicates()
                    .sort_values(["category", "product"])
                    .reset_index(drop=True)
                )
                st.dataframe(show, use_container_width=True, hide_index=True)

st.caption("MVP: datos desde Excel en el repo. Click en el mapa o selecciona ISO3 para ver distribuidores y productos.")
