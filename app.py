import json
from pathlib import Path

import pandas as pd
import streamlit as st
import folium
from streamlit_folium import st_folium

st.set_page_config(page_title="Autorizaciones por país", layout="wide")

DATA_PATH = Path("data/autorizaciones_mock.csv")
GEOJSON_PATH = Path("assets/countries.geojson")

REQUIRED_COLS = ["country_iso3", "distributor", "product", "category"]


@st.cache_data
def load_data(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    # Normaliza nombres columnas por si acaso
    df.columns = df.columns.str.strip().str.lower()
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Faltan columnas en CSV: {missing}. Detectadas: {list(df.columns)}")

    # Limpieza
    for c in REQUIRED_COLS:
        df[c] = df[c].astype(str).str.strip()
    df["country_iso3"] = df["country_iso3"].str.upper()

    return df


@st.cache_data
def load_geojson(p: Path) -> dict:
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def build_map(geojson: dict, countries_with_data: set[str]) -> folium.Map:
    m = folium.Map(location=[20, 0], zoom_start=2, tiles="CartoDB positron")

    # Geo-countries usa: ISO3166-1-Alpha-3 y name
    def style_fn(feature):
        iso3 = (feature.get("properties", {}).get("ISO3166-1-Alpha-3") or "").upper()
        has_data = iso3 in countries_with_data
        return {
            "fillColor": "#2E86DE" if has_data else "#D5D8DC",
            "color": "#566573",
            "weight": 0.8,
            "fillOpacity": 0.55 if has_data else 0.25,
        }

    gj = folium.GeoJson(
        geojson,
        name="countries",
        style_function=style_fn,
        highlight_function=lambda _: {"weight": 2.0, "fillOpacity": 0.75},
        tooltip=folium.GeoJsonTooltip(
            fields=["name", "ISO3166-1-Alpha-3"],
            aliases=["País", "ISO3"],
            sticky=False,
        ),
    )
    gj.add_to(m)
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


def get_country_name_from_geojson(geojson: dict, iso3: str) -> str:
    iso3 = iso3.upper()
    for f in geojson.get("features", []):
        p = f.get("properties", {})
        if (p.get("ISO3166-1-Alpha-3") or "").upper() == iso3:
            return p.get("name") or iso3
    return iso3


st.title("Mapa de autorizaciones (País → Distribuidores → Productos)")

# Carga datos
try:
    df = load_data(DATA_PATH)
except Exception as e:
    st.error(f"No puedo leer {DATA_PATH}. Error: {e}")
    st.stop()

try:
    countries_geojson = load_geojson(GEOJSON_PATH)
except Exception as e:
    st.error(f"No puedo leer {GEOJSON_PATH}. Error: {e}")
    st.stop()

countries_with_data = set(df["country_iso3"].unique())

left, right = st.columns([1.2, 1.0], gap="large")

with left:
    st.subheader("Mapa (clic en un país)")
    folium_map = build_map(countries_geojson, countries_with_data)
    map_state = st_folium(folium_map, height=560, use_container_width=True)

clicked_iso3 = extract_clicked_iso3(map_state)

with right:
    st.subheader("Detalle por país")

    # Selector como fallback (y también útil aunque haya click)
    country_options = sorted(df["country_iso3"].unique().tolist())
    default_iso3 = clicked_iso3 if clicked_iso3 in country_options else country_options[0]
    selected_iso3 = st.selectbox(
        "País (ISO3)",
        options=country_options,
        index=country_options.index(default_iso3),
        help="Puedes elegir aquí o clicar en el mapa.",
    )

    country_name = get_country_name_from_geojson(countries_geojson, selected_iso3)
    st.markdown(f"**{country_name} ({selected_iso3})**")

    country_df = df[df["country_iso3"] == selected_iso3].copy()

    q = st.text_input("Buscar producto (contiene)", value="", placeholder="Ej: Producto A, amino, etc.")
    if q.strip():
        country_df = country_df[country_df["product"].str.contains(q.strip(), case=False, na=False)]

    if country_df.empty:
        st.info("No hay registros para este país con los filtros actuales.")
    else:
        # Acordeón por distribuidor
        for dist, g in country_df.groupby("distributor"):
            productos_unicos = g[["product", "category"]].drop_duplicates()
            with st.expander(f"{dist} — {len(productos_unicos)} productos", expanded=False):
                show = (
                    productos_unicos
                    .sort_values(["category", "product"])
                    .reset_index(drop=True)
                )
                st.dataframe(show, use_container_width=True, hide_index=True)

st.caption("MVP: datos desde CSV en el repo (Streamlit Cloud). Clic en el mapa o selector ISO3.")
