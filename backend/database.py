"""
KRISHIORBIT Database Module
SQLite persistent storage for Farm Profiles and future agronomic metadata.
"""

import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = Path(__file__).resolve().parent / "krishiorbit.db"


def get_db_connection() -> sqlite3.Connection:
    """Create and return a SQLite database connection with row factory."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables for KRISHIORBIT platform and seed initial crops."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS farm_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farm_name TEXT,
                farmer_name TEXT,
                village TEXT NOT NULL,
                district TEXT NOT NULL,
                state TEXT NOT NULL DEFAULT 'Karnataka',
                latitude REAL,
                longitude REAL,
                total_land_acres REAL NOT NULL,
                soil_type TEXT NOT NULL,
                current_crop TEXT NOT NULL,
                previous_crop TEXT NOT NULL,
                farming_season TEXT NOT NULL,
                irrigation_type TEXT NOT NULL,
                primary_priority TEXT NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crop_name TEXT NOT NULL,
                scientific_name TEXT NOT NULL,
                crop_category TEXT NOT NULL,
                suitable_seasons TEXT NOT NULL,
                growing_duration_days TEXT NOT NULL,
                water_requirement TEXT NOT NULL,
                suitable_soils TEXT NOT NULL,
                temperature_suitability_c TEXT NOT NULL,
                rainfall_suitability_mm TEXT NOT NULL,
                important_growing_conditions TEXT NOT NULL,
                crop_rotation_benefits TEXT NOT NULL,
                nitrogen_fixation_info TEXT,
                source_institution TEXT NOT NULL,
                reference_url TEXT NOT NULL,
                data_reliability_or_limitations TEXT NOT NULL,
                image_url TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS local_mandi_observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crop_name TEXT NOT NULL,
                commodity TEXT NOT NULL,
                state TEXT NOT NULL DEFAULT 'Karnataka',
                district TEXT NOT NULL,
                mandi_name TEXT NOT NULL,
                variety TEXT,
                min_price REAL,
                max_price REAL,
                modal_price REAL NOT NULL,
                arrival_quantity REAL,
                traded_quantity REAL,
                unit TEXT DEFAULT '₹/quintal',
                data_date TEXT NOT NULL,
                source_type TEXT NOT NULL DEFAULT 'farmer_entry',
                notes TEXT,
                created_at TEXT NOT NULL
            );
        """)

        # Auto-seed crops if table is empty
        cursor.execute("SELECT COUNT(*) FROM crops")
        if cursor.fetchone()[0] == 0:
            seed_initial_crops(cursor)

        conn.commit()
    finally:
        conn.close()


def seed_initial_crops(cursor: sqlite3.Cursor):
    """Seed authoritative crop intelligence dataset for Karnataka & Western Ghats ecosystems."""
    initial_crops = [
        (
            "Paddy (Rice)",
            "Oryza sativa L.",
            "Cereal",
            "Kharif, Summer",
            "110–150 days (Short duration: 110–120 days e.g. Jyothi, IET-7191; Medium duration: 130–140 days e.g. Jaya, Tanu; Long duration: 145–155 days e.g. Intan)",
            "1100–1400 mm total season evapotranspiration & percolation (Source: ICAR-IIRR / UAS Bengaluru Package of Practices)",
            "Clay loam, Clayey soil, Alluvial valley basins, Deep laterite soils with low percolation",
            "20–35 °C (Optimum: 22–32 °C; critical minimum < 15 °C at panicle initiation causes spikelet sterility)",
            "1000–2500 mm (Ideal for rainfed lowland Malnad valleys; supplemental irrigation needed if seasonal rainfall < 1000 mm)",
            "Requires saturated soil or shallow standing water (2–5 cm) during vegetative tillering to heading; sensitive to moisture stress at flowering; optimal soil pH 5.5–7.0.",
            "High biomass cereal; heavy nutrient feeder that exhausts soil nitrogen, phosphorus, and potassium. Rotates exceptionally well with short-duration pulses (Black Gram, Green Gram, Cowpea) or green manure (Dhaincha) to fix nitrogen and break anaerobic pathogen cycles.",
            None,
            "ICAR - Indian Institute of Rice Research (IIRR) & UAS Bengaluru",
            "https://icar-iirr.org",
            "Water consumption varies significantly with cultivation method (Transplanted puddled rice requires ~1300 mm vs Aerobic / DSR requiring ~850 mm). Duration varies with altitude and local thermal time in Malnad vs Plains.",
            "/images/crops/paddy.webp"
        ),
        (
            "Ragi (Finger Millet)",
            "Eleusine coracana (L.) Gaertn.",
            "Nutri-Cereal",
            "Kharif, Late Kharif",
            "95–125 days (Short: 95–105 days e.g. GPU-28, ML-365; Medium: 115–125 days e.g. KMR-301, MR-1)",
            "350–500 mm (Source: ICAR - Indian Institute of Millets Research (IIMR) & UAS Bengaluru)",
            "Red loamy soil, Sandy loam, Laterite soil, Light gravelly loam",
            "18–34 °C (Optimum: 24–30 °C; high thermal tolerance; growth retarded below 15 °C)",
            "500–900 mm (High drought resilience; survives prolonged dry spells due to C4 photosynthetic pathway and deep fibrous root system)",
            "Requires well-drained soils; cannot tolerate water stagnation or flooding; thrives in acidic to neutral soils (pH 5.0–7.2); highly responsive to organic manure application.",
            "Restorative C4 millet with dense fibrous root network that binds fragile topsoil, builds organic carbon, and suppresses soil-borne nematodes. Rotating Ragi after exhaustive crops breaks disease cycles and conserves subsoil moisture.",
            None,
            "ICAR - Indian Institute of Millets Research (IIMR) & UAS Bengaluru Project on Millets",
            "https://millets.res.in",
            "Rainfall suitability figures reflect rainfed dryland cultivation; excessive precipitation or heavy showers during earhead maturity can trigger viviparous seed germination.",
            "/images/crops/ragi.webp"
        ),
        (
            "Maize",
            "Zea mays L.",
            "Cereal",
            "Kharif, Rabi, Summer",
            "90–120 days (Early: 85–95 days; Medium: 95–105 days; Late: 105–120 days e.g. CP-818, Hema, Nithyashree)",
            "500–750 mm (Source: ICAR - Indian Institute of Maize Research (IIMR) & FAO Crop Water Management)",
            "Deep fertile loam, Well-drained alluvial soil, Red sandy loam, Well-drained clay loam",
            "18–35 °C (Optimum: 21–27 °C; germination inhibited < 13 °C; heat stress > 35 °C during tasseling/silking reduces pollination and seed set)",
            "600–1100 mm (Requires well-distributed rainfall across vegetative and cob development stages)",
            "Extremely sensitive to standing water and waterlogging in early vegetative stages (requires effective field drainage); heavy nutrient consumer; optimal soil pH 6.0–7.5.",
            "High biomass producer; provides substantial crop residue. Rotates well with leguminous pulses (such as Green Gram, Groundnut, or Soybean) which utilize residual phosphorus, fix nitrogen, and break maize root and stalk rot cycles.",
            None,
            "ICAR - Indian Institute of Maize Research (IIMR) & UAS Dharwad",
            "https://iimr.icar.gov.in",
            "Water demand peaks sharply during the 20-day tasseling-to-silking window; water stress during this critical reproductive period can cause up to 50% yield reduction regardless of total seasonal water applied.",
            "/images/crops/maize.webp"
        ),
        (
            "Black Gram",
            "Vigna mungo (L.) Hepper",
            "Pulse / Legume",
            "Kharif, Rabi, Summer",
            "70–85 days (Short: 65–75 days e.g. LBG-625, VBN-4; Medium: 80–85 days e.g. Rashmi, DU-1)",
            "350–450 mm (Source: ICAR - Indian Institute of Pulses Research (IIPR))",
            "Well-drained loam, Black cotton soil, Alluvial soil, Clayey loam",
            "22–35 °C (Optimum: 25–32 °C; cold-sensitive; vegetative growth slows significantly < 18 °C)",
            "600–850 mm (Requires dry, sunny weather during pod ripening and harvest stages)",
            "Requires well-aerated soil for active root nodulation; intolerant of water stagnation and saline-alkaline soils; optimal soil pH 6.5–7.8.",
            "Premier relay and rotation pulse following Kharif rice (rice-fallow system across Karnataka). Deep taproot loosens plow pans, enriches topsoil with nitrogenous root biomass, and suppresses weed propagation.",
            "Symbiotic biological nitrogen fixation via Rhizobium leguminosarum bv. phaseoli nodules; fixes approximately 35–45 kg atmospheric N/ha, contributing a net positive nitrogen balance of 15–20 kg N/ha to succeeding crops.",
            "ICAR - Indian Institute of Pulses Research (IIPR) & UAS Bengaluru",
            "https://iipr.icar.gov.in",
            "Nodulation efficiency is severely impaired in acidic soils (pH < 5.5) typical of upland Malnad tracts unless seed is treated with Rhizobium biofertilizer and lime is amended.",
            "/images/crops/blackgram.webp"
        ),
        (
            "Green Gram",
            "Vigna radiata (L.) R. Wilczek",
            "Pulse / Legume",
            "Kharif, Summer",
            "60–75 days (Ultra-short: 60–65 days e.g. Pusa Baisakhi, IPM 02-3; Short: 70–75 days e.g. Selection-4, K-851)",
            "300–400 mm (Source: ICAR - Indian Institute of Pulses Research (IIPR) & FAO)",
            "Sandy loam, Fertile loam, Alluvial soil, Well-drained red loam",
            "25–38 °C (Optimum: 28–35 °C; heat tolerant; sensitive to chilling < 15 °C)",
            "500–750 mm (Continuous rain during pod maturity causes pod shattering and seed damage)",
            "Rapid canopy development makes it an exceptional short-season catch crop; requires well-drained fertile loam; completely intolerant of waterlogging; optimal soil pH 6.2–7.2.",
            "Due to its short 60–70 day duration, Green Gram fits into narrow windows between main cereal rotations. Incorporating post-harvest crop stover as green manure adds 1.5–2.0 tonnes of organic matter per hectare.",
            "Symbiotic nitrogen fixation via Bradyrhizobium sp. nodules; fixes approximately 30–40 kg N/ha, enhancing microbial soil health and reducing synthetic fertilizer requirement for the next crop.",
            "ICAR - Indian Institute of Pulses Research (IIPR) & UAS Dharwad",
            "https://iipr.icar.gov.in",
            "Vulnerable to Yellow Mosaic Virus (YMV) and powdery mildew during humid, overcast monsoon conditions; resistant cultivars (e.g. DGGV-2) are advised in high humidity pockets.",
            "/images/crops/greengram.webp"
        ),
        (
            "Arecanut",
            "Areca catechu L.",
            "Plantation / Commercial",
            "Perennial (Year-round plantation crop)",
            "Perennial palm; juvenile non-bearing period of 5–7 years; economic bearing lifespan exceeds 30–40 years",
            "1500–2500 mm annual distributed precipitation or 15–20 liters/palm/day drip irrigation during dry months (Source: ICAR - Central Plantation Crops Research Institute (CPCRI) & UAHS Shivamogga)",
            "Deep laterite soil, Clay loam, Red loamy soil, High organic matter alluvial valley soils",
            "14–36 °C (Optimum: 20–32 °C; vulnerable to trunk sun-scorch in exposed sites; sheltered valleys of Malnad provide ideal humid microclimate)",
            "1500–3500 mm (Annual precipitation typical of Western Ghats/Malnad hill tracts; sensitive to drought spells exceeding 2–3 months without irrigation)",
            "Requires deep water table (> 1 meter) or artificial drainage channels in valley floors to prevent Koleroga (Phytophthora fruit rot) and root asphyxiation; shade-tolerant when young; thrives in acidic laterites (pH 5.0–6.5).",
            "As a perennial palm, clear-felling rotation does not occur. Instead, multi-tier intercropping with legumes (Cowpea as green manure basin cover), spice crops (Black Pepper trailed on trunks), and Cocoa optimizes land, light, and soil moisture usage.",
            None,
            "ICAR - Central Plantation Crops Research Institute (CPCRI) & KSNUAHS Shivamogga",
            "https://cpcri.icar.gov.in",
            "Water and rainfall parameters apply to mature bearing palms; yields depend strongly on deep drainage infrastructure and timely preventive copper sulfate (Bordeaux mixture) sprays prior to South-West monsoon onset.",
            "/images/crops/arecanut.webp"
        ),
        (
            "Cowpea",
            "Vigna unguiculata (L.) Walp.",
            "Pulse / Legume",
            "Kharif, Summer",
            "70–90 days (Fodder/Grain: 65–75 days e.g. C-152, DC-15; Dual-purpose: 80–90 days)",
            "300–450 mm (Source: ICAR - Indian Grassland and Fodder Research Institute & UAS Bengaluru)",
            "Tolerant of acidic laterite, Red sandy loam, Light loamy soils",
            "20–35 °C (Optimum: 24–30 °C; highly tolerant of heat and marginal soils)",
            "500–900 mm (Deep taproot allows excellent drought tolerance)",
            "Excellent ground cover crop that prevents surface erosion on hill slopes; tolerates low fertility and acidic soils (pH 5.0–6.8); sensitive to waterlogged conditions.",
            "Deep rooting loosens hard soils and dense vegetative canopy suppresses aggressive weeds. Superb green manure and cover crop in arecanut orchards and cereal-fallow rotations.",
            "Robust nodulation with diverse cowpea-type Rhizobium strains; fixes 40–55 kg N/ha, contributing substantial fertility carry-over.",
            "ICAR & UAS Bengaluru Department of Agronomy",
            "https://www.uasbangalore.edu.in",
            "Sensitive to severe waterlogging during early germination; seed treatment with Trichoderma recommended for damping-off prevention.",
            "/images/crops/cowpea.webp"
        ),
        (
            "Groundnut",
            "Arachis hypogaea L.",
            "Oilseed Legume",
            "Kharif, Summer",
            "100–120 days (Bunch type: 100–110 days e.g. TMV-2, JL-24; Spreading: 115–125 days)",
            "450–650 mm (Source: ICAR - Directorate of Groundnut Research (DGR))",
            "Well-drained sandy loam, Light red soils, Loamy soils (friable soil required for peg penetration)",
            "22–32 °C (Optimum: 25–30 °C; soil temperature > 20 °C needed for rapid germination and pegging)",
            "500–800 mm (Critical water stages: flowering, pegging, and pod development)",
            "Requires friable, well-aerated light soils for gynophore (peg) penetration and pod development; heavy clay soils hamper harvesting and reduce pod recovery; optimal pH 6.0–7.0.",
            "Leguminous oilseed that fixes atmospheric nitrogen while improving soil structure and friability. Excellent rotation crop with maize, ragi, and sorghum.",
            "Symbiotic nitrogen fixation with Bradyrhizobium sp.; fixes approximately 40–60 kg N/ha, leaving notable nitrogen residue for succeeding cereals.",
            "ICAR - Directorate of Groundnut Research (DGR) & UAS Dharwad",
            "https://dgr.icar.gov.in",
            "Heavy sticky clay soils or waterlogged conditions severely impede pod excavation and cause pod rotting; calcium/gypsum application needed at pegging for pod filling.",
            "/images/crops/groundnut.webp"
        ),
        (
            "Soybean",
            "Glycine max (L.) Merr.",
            "Pulse / Legume",
            "Kharif",
            "90–105 days (e.g. JS-335, DSb-21, MACS-450: 95–105 days)",
            "450–700 mm (Source: ICAR - Indian Institute of Soybean Research (IISR))",
            "Well-drained deep black cotton soil, Loamy soil, Fertile clay loam",
            "20–32 °C (Optimum: 23–28 °C; sensitive to temperatures > 38 °C during flowering)",
            "600–900 mm (Adequate moisture essential from pod initiation through seed fill)",
            "Requires neutral to slightly alkaline well-drained soils (pH 6.5–7.5); highly sensitive to both waterlogging and severe drought; requires fertile seedbed.",
            "Extensive symbiotic nitrogen fixation leaves significant soil fertility for subsequent Rabi wheat, gram, or sorghum, reducing chemical fertilizer dependency.",
            "Symbiotic nitrogen fixation via Bradyrhizobium japonicum nodules; fixes 60–80 kg N/ha under optimal nodulation.",
            "ICAR - Indian Institute of Soybean Research (IISR)",
            "https://iisrindore.icar.gov.in",
            "Acidic soils (pH < 6.0) severely constrain Rhizobium survival and phosphorus availability; requires seed inoculation with specific B. japonicum strains in non-traditional belts.",
            "/images/crops/soybean.webp"
        )
    ]

    cursor.executemany("""
        INSERT INTO crops (
            crop_name,
            scientific_name,
            crop_category,
            suitable_seasons,
            growing_duration_days,
            water_requirement,
            suitable_soils,
            temperature_suitability_c,
            rainfall_suitability_mm,
            important_growing_conditions,
            crop_rotation_benefits,
            nitrogen_fixation_info,
            source_institution,
            reference_url,
            data_reliability_or_limitations,
            image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, initial_crops)


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert a sqlite3.Row object to a clean Python dictionary."""
    return dict(row)


def create_farm_profile(data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a new farm profile into SQLite database and return the saved record."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        now_iso = datetime.utcnow().isoformat() + "Z"

        cursor.execute("""
            INSERT INTO farm_profiles (
                farm_name,
                farmer_name,
                village,
                district,
                state,
                latitude,
                longitude,
                total_land_acres,
                soil_type,
                current_crop,
                previous_crop,
                farming_season,
                irrigation_type,
                primary_priority,
                notes,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("farm_name"),
            data.get("farmer_name"),
            data["village"],
            data["district"],
            data.get("state", "Karnataka"),
            data.get("latitude"),
            data.get("longitude"),
            data["total_land_acres"],
            data["soil_type"],
            data["current_crop"],
            data["previous_crop"],
            data["farming_season"],
            data["irrigation_type"],
            data["primary_priority"],
            data.get("notes"),
            now_iso,
            now_iso
        ))

        profile_id = cursor.lastrowid
        conn.commit()

        cursor.execute("SELECT * FROM farm_profiles WHERE id = ?", (profile_id,))
        row = cursor.fetchone()
        return row_to_dict(row)
    finally:
        conn.close()


def list_farm_profiles() -> List[Dict[str, Any]]:
    """Retrieve all farm profiles ordered by latest update."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM farm_profiles ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        conn.close()


def get_farm_profile(profile_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve a single farm profile by its primary key ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM farm_profiles WHERE id = ?", (profile_id,))
        row = cursor.fetchone()
        return row_to_dict(row) if row else None
    finally:
        conn.close()


def update_farm_profile(profile_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update fields of an existing farm profile in SQLite database."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Check if record exists
        cursor.execute("SELECT * FROM farm_profiles WHERE id = ?", (profile_id,))
        existing = cursor.fetchone()
        if not existing:
            return None

        now_iso = datetime.utcnow().isoformat() + "Z"

        # Build dynamic update statement for provided fields
        fields_to_update = []
        values = []

        allowed_keys = [
            "farm_name", "farmer_name", "village", "district", "state",
            "latitude", "longitude", "total_land_acres", "soil_type",
            "current_crop", "previous_crop", "farming_season", "irrigation_type",
            "primary_priority", "notes"
        ]

        for key in allowed_keys:
            if key in data and data[key] is not None:
                fields_to_update.append(f"{key} = ?")
                values.append(data[key])

        fields_to_update.append("updated_at = ?")
        values.append(now_iso)

        values.append(profile_id)

        query = f"UPDATE farm_profiles SET {', '.join(fields_to_update)} WHERE id = ?"
        cursor.execute(query, tuple(values))
        conn.commit()

        cursor.execute("SELECT * FROM farm_profiles WHERE id = ?", (profile_id,))
        updated_row = cursor.fetchone()
        return row_to_dict(updated_row)
    finally:
        conn.close()


def delete_farm_profile(profile_id: int) -> bool:
    """Delete a farm profile from SQLite database."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM farm_profiles WHERE id = ?", (profile_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ==============================================================================
# CROP INTELLIGENCE MODULE DATABASE ACCESS
# ==============================================================================

def list_crops(category: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve crops from SQLite, optionally filtered by category or search term."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM crops"
        params = []
        conditions = []

        if category and category.lower() != "all":
            conditions.append("LOWER(crop_category) LIKE LOWER(?)")
            params.append(f"%{category.strip()}%")

        if search and search.strip():
            term = f"%{search.strip()}%"
            conditions.append("""
                (LOWER(crop_name) LIKE LOWER(?) OR
                 LOWER(scientific_name) LIKE LOWER(?) OR
                 LOWER(suitable_soils) LIKE LOWER(?) OR
                 LOWER(suitable_seasons) LIKE LOWER(?) OR
                 LOWER(crop_category) LIKE LOWER(?))
            """)
            params.extend([term, term, term, term, term])

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY id ASC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        conn.close()


def get_crop_by_id(crop_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve an individual crop by primary key ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM crops WHERE id = ?", (crop_id,))
        row = cursor.fetchone()
        return row_to_dict(row) if row else None
    finally:
        conn.close()


def get_crops_by_category(category: str) -> List[Dict[str, Any]]:
    """Retrieve crops belonging to a specific agricultural category."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM crops WHERE LOWER(crop_category) LIKE LOWER(?) ORDER BY id ASC",
            (f"%{category.strip()}%",)
        )
        rows = cursor.fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        conn.close()


def add_local_mandi_observation(data: Dict[str, Any]) -> Dict[str, Any]:
    """Add a farmer-reported or locally observed APMC mandi price record."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO local_mandi_observations (
                crop_name,
                commodity,
                state,
                district,
                mandi_name,
                variety,
                min_price,
                max_price,
                modal_price,
                arrival_quantity,
                traded_quantity,
                unit,
                data_date,
                source_type,
                notes,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("crop_name", "").strip(),
            data.get("commodity", "").strip() or data.get("crop_name", "").strip(),
            data.get("state", "Karnataka").strip(),
            data.get("district", "").strip(),
            data.get("mandi_name", "").strip(),
            data.get("variety", "").strip() if data.get("variety") else None,
            float(data["min_price"]) if data.get("min_price") is not None and str(data["min_price"]).strip() != "" else None,
            float(data["max_price"]) if data.get("max_price") is not None and str(data["max_price"]).strip() != "" else None,
            float(data["modal_price"]),
            float(data["arrival_quantity"]) if data.get("arrival_quantity") is not None and str(data["arrival_quantity"]).strip() != "" else None,
            float(data["traded_quantity"]) if data.get("traded_quantity") is not None and str(data["traded_quantity"]).strip() != "" else None,
            data.get("unit", "₹/quintal").strip(),
            data.get("data_date", datetime.now().strftime("%Y-%m-%d")).strip(),
            data.get("source_type", "farmer_entry").strip(),
            data.get("notes", "").strip() if data.get("notes") else None,
            now_iso
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM local_mandi_observations WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        return row_to_dict(row)
    finally:
        conn.close()


def list_local_mandi_observations(
    district: Optional[str] = None,
    crop_name: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """List recorded APMC mandi observations with optional district and crop filters."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM local_mandi_observations"
        conditions = []
        params = []

        if district and isinstance(district, str) and district.strip():
            conditions.append("LOWER(district) = LOWER(?)")
            params.append(district.strip())

        if crop_name and isinstance(crop_name, str) and crop_name.strip():
            conditions.append("(LOWER(crop_name) LIKE LOWER(?) OR LOWER(commodity) LIKE LOWER(?))")
            term = f"%{crop_name.strip()}%"
            params.extend([term, term])

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        lim_val = int(limit) if isinstance(limit, (int, float)) else 50
        query += " ORDER BY id DESC LIMIT ?"
        params.append(lim_val)

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        conn.close()


def delete_local_mandi_observation(observation_id: int) -> bool:
    """Delete a local mandi observation by ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM local_mandi_observations WHERE id = ?", (observation_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
