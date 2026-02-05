import json
from pathlib import Path

import pandas as pd
import streamlit as st
import folium
from streamlit_folium import st_folium

# ----------------------------
# Config
# ----------------------------
st.set_page_config(page_title="Autorizaciones por país", layout="wide")

DATA_PATH = Path("data/autorizaciones_mock.csv")
GEOJSON_PATH = Path("assets/countries.geojson")

REQUIRED_COLS = ["country_iso3", "distributor", "product", "category"]

# Mantener país seleccionado entre reruns
if "selected_iso3" not in st.session_state:
    st.session_state.selected_iso3 = None


# ----------------------------
# Loaders
# ----------------------------
@st.cache_data
def load_data(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    # Normaliza nombres de columnas por si acaso
    df.columns = df.columns.str.strip().str.lower()

    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Faltan columnas en CSV: {missing}. Detectadas: {list(df.columns)}")

    for c in REQUIRED_COLS:
        df[c] = df[c].astype(str).str.strip()
    df["country_iso3"] = df["country_iso3"].str.upper()

    return df


@st.cache_data
def load_geojson(p: Path) -> dict:
    raw = p.read_text(encoding="utf-8", errors="ignore")
    raw2 = raw.lstrip("\ufeff \n\r\t")

    # Mensajes claros por si vuelve a fallar
    if raw2.startswith("<"):
        raise ValueError("countries.geojson parece HTML (no GeoJSON RAW).")
    if raw2.startswith("version https://git-lfs.github.com/spec"):
        raise ValueError("countries.geojson es un puntero Git LFS. Sube el fichero real (sin LFS).")

    return json.loads(raw2)


@st.cache_data
def build_iso3_to_name(geojson: dict) -> dict[str, str]:
    m = {}
    for f in geojson.get("features", []):
        p = f.get("properties", {}) or {}
        iso3 = (p.get("ISO3166-1-Alpha-3") or "").upper()
        name = p.get("name") or iso3
        if iso3:
            m[iso3] = name
    return m


# ----------------------------
# Map (cached resource)
# ----------------------------
@st.cache_resource
def build_map_cached(geojson: dict, countries_with_data: tuple[str, ...]) -> folium.Map:
    # Nota: countries_with_data es tuple para que sea hashable para cache_resource
    countries_set = set(countries_with_data)

    m = folium.Map(location=[20, 0], zoom_start=2, tiles="CartoDB positron")

    def style_fn(feature):
        iso3 = (feature.get("properties", {}).get("ISO3166-1-Alpha-3") or "").upper()
        has_data = iso3 in countries_set
        return {
            "fillColor": "#2E86DE" if has_data else "#D5D8DC",
            "color": "#566573",
            "weight": 0.7,
            "fillOpacity": 0.55 if has_data else 0.20,
        }

    def highlight_fn(_):
        return {"weight": 2.0, "fillOpacity": 0.75}

    folium.GeoJson(
        geojson,
        name="countries",
        style_function=style_fn,
        highlight_function=highlight_fn,
        tooltip=folium.GeoJsonTooltip(
            fields=["name", "ISO3166-1-Alpha-3"],
            aliases=["País", "ISO3"],
            sticky=False,
        ),
    ).add_to(m)

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


# ----------------------------
# UI
# ----------------------------
st.title("Mapa de autorizaciones (País → Distribuidores → Productos)")

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

iso3_to_name = build_iso3_to_name(countries_geojson)

countries_with_data = set(df["country_iso3"].unique())
countries_tuple = tuple(sorted(countries_with_data))

left, right = st.columns([1.2, 1.0], gap="large")

# --- Left: Map (only depends on cached map + click) ---
with left:
    st.subheader("Mapa (clic en un país)")
    folium_map = build_map_cached(countries_geojson, countries_tuple)

    # key fija para que Streamlit gestione mejor el estado del componente
    map_state = st_folium(folium_map, height=560, use_container_width=True, key="map")

clicked_iso3 = extract_clicked_iso3(map_state)
if clicked_iso3:
    st.session_state.selected_iso3 = clicked_iso3

# --- Right: Details (filters/forms here shouldn't rebuild the map due to caching) ---
with right:
    st.subheader("Detalle por país")

    country_options = sorted(df["country_iso3"].unique().tolist())
    # fallback si aún no hay click
    if st.session_state.selected_iso3 not in country_options:
        st.session_state.selected_iso3 = country_options[0]

    selected_iso3 = st.selectbox(
        "País (ISO3)",
        options=country_options,
        index=country_options.index(st.session_state.selected_iso3),
        help="Puedes elegir aquí o clicar en el mapa.",
        key="country_select",
    )
    # sincroniza estado
    st.session_state.selected_iso3 = selected_iso3

    country_name = iso3_to_name.get(selected_iso3, selected_iso3)
    st.markdown(f"**{country_name} ({selected_iso3})**")

    # Form para evitar reruns por cada tecla si te molesta el lag en búsquedas
    with st.form("filters", clear_on_submit=False):
        q = st.text_input(
            "Buscar producto (contiene)",
            value="",
            placeholder="Ej: Producto A, amino, etc.",
        )
        submitted = st.form_submit_button("Aplicar filtro")

    # Si no han aplicado filtro aún, no pares; mostramos todo (MVP cómodo)
    country_df = df[df["country_iso3"] == selected_iso3].copy()
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
                    productos_unicos.sort_values(["category", "product"]).reset_index(drop=True)
                )
                st.dataframe(show, use_container_width=True, hide_index=True)

st.caption("Optimizado: mapa cacheado + país persistente en sesión + filtros en panel derecho.")
