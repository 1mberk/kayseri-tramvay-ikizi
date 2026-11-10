"""
KAYSERAY DİJİTAL İKİZİ (Kayseri Tramvay Ağı Simülasyonu)
------------------------------------------------------
FAZ 1: Veri Motoru ve Matematiksel Fizik Modeli (Enterpolasyon)
Kütüphaneler: Streamlit, Pandas, Folium, Json, Math
"""

import json
import math
import os
from datetime import datetime, time
import pandas as pd
import streamlit as st

# ==============================================================================
# 1. VERİ MOTORU (DATA ENGINE)
# ==============================================================================

class KayseriDataEngine:
    """
    Kayseri Raylı Sistem Ağı (T1, T2, T3, T4) verilerini yükleyen,
    sefer tarifelerini ve istasyon koordinatlarını ayrıştıran veri motoru.
    """
    def __init__(self, json_path="kayseri_rail_network.json"):
        self.json_path = json_path
        self.data = self._load_data()
        self.stations = {s["station_id"]: s for s in self.data["stations"]}
        self.lines = {l["line_code"]: l for l in self.data["lines"]}
        self.routes = self.data["routes"]
        self.timetables = self.data["timetables_weekday"]
        self.route_station_profiles = self._precompute_route_profiles()

    def _load_data(self):
        """JSON dosyasını yerel dizinden veya alternatif yollardan yükler."""
        paths_to_try = [
            self.json_path,
            os.path.join(os.path.dirname(__file__), self.json_path),
            os.path.join(os.path.dirname(__file__), "data", self.json_path),
            os.path.join(r"C:\Users\tzmas\.gemini\antigravity\scratch\kayseri-tramvay-ikizi", self.json_path)
        ]
        for p in paths_to_try:
            if p and os.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
        raise FileNotFoundError(f"{self.json_path} dosyası bulunamadı. Lütfen dosya yolunu kontrol edin.")

    @staticmethod
    def time_to_seconds(time_str: str) -> int:
        """'HH:MM' veya 'HH:MM:SS' formatındaki saat dizisini geceyarısından itibaren saniyeye çevirir."""
        parts = [int(p) for p in time_str.strip().split(":")]
        if len(parts) == 2:
            return parts[0] * 3600 + parts[1] * 60
        elif len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return 0

    @staticmethod
    def seconds_to_time_str(total_seconds: int) -> str:
        """Saniye cinsinden zamanı 'HH:MM:SS' formatına dönüştürür."""
        total_seconds = int(total_seconds) % 86400
        h = total_seconds // 3600
        m = (total_seconds % 3600) // 60
        s = total_seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    @staticmethod
    def haversine_distance_km(lat1, lon1, lat2, lon2):
        """İki küresel koordinat arasındaki mesafeyi kilometre cinsinden hesaplar."""
        r = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    def _precompute_route_profiles(self):
        """
        Her hat-yön güzergâhı için duraklar arası mesafeleri ve 
        kümülatif seyahat sürelerini hesaplar.
        """
        profiles = {}
        for r_key, route in self.routes.items():
            stops = route["stops"]
            total_duration_sec = route["total_travel_time_min"] * 60
            
            # Duraklar arası mesafeleri hesapla
            segment_dists = []
            total_dist = 0.0
            for i in range(len(stops) - 1):
                s1 = self.stations.get(stops[i])
                s2 = self.stations.get(stops[i + 1])
                if s1 and s2:
                    d = self.haversine_distance_km(s1["lat_wgs84"], s1["lon_wgs84"],
                                                  s2["lat_wgs84"], s2["lon_wgs84"])
                else:
                    d = 0.6  # Varsayılan duraklar arası ortalama mesafe (km)
                segment_dists.append(d)
                total_dist += d

            # Mesafeye orantılı kümülatif seyahat süreleri (zaman ofsetleri)
            cum_times_sec = [0.0]
            curr_time = 0.0
            for d in segment_dists:
                seg_time = (d / total_dist) * total_duration_sec if total_dist > 0 else (total_duration_sec / len(segment_dists))
                curr_time += seg_time
                cum_times_sec.append(curr_time)

            profiles[r_key] = {
                "stops": stops,
                "total_dist_km": total_dist,
                "total_duration_sec": total_duration_sec,
                "segment_dists": segment_dists,
                "cum_times_sec": cum_times_sec
            }
        return profiles

# ==============================================================================
# 2. FİZİK MODELİ VE ENTERPOLASYON MOTORU (PHYSICS ENGINE)
# ==============================================================================

class TramPhysicsEngine:
    """
    Belirli bir simülasyon anında (T_sim) ray hattında aktif olan tüm tramvayları,
    bulundukları segmenti ve anlık (lat, lon) koordinatlarını hesaplayan fizik motoru.
    """
    def __init__(self, data_engine: KayseriDataEngine):
        self.de = data_engine

    def calculate_bearing(self, lat1, lon1, lat2, lon2):
        """İki coğrafi nokta arasındaki açı yönünü (bearing/heading derece) hesaplar."""
        y = math.sin(math.radians(lon2 - lon1)) * math.cos(math.radians(lat2))
        x = (math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) -
             math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(math.radians(lon2 - lon1)))
        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360) % 360

    def get_active_trains_at_time(self, sim_time_seconds: int, selected_lines=None):
        """
        Verilen simülasyon saniyesinde hatta olan tüm aktif trenleri
        ve anlık fiziksel durumlarını hesaplar.
        """
        if selected_lines is None:
            selected_lines = ["T1", "T2", "T3", "T4"]

        active_trains = []

        for r_key, route in self.de.routes.items():
            line_code = route["line_code"]
            if line_code not in selected_lines:
                continue

            timetable_departures = self.de.timetables.get(r_key, [])
            profile = self.de.route_station_profiles[r_key]
            total_duration_sec = profile["total_duration_sec"]
            stops = profile["stops"]
            cum_times = profile["cum_times_sec"]

            for trip_idx, dep_str in enumerate(timetable_departures):
                dep_sec = self.de.time_to_seconds(dep_str)
                arr_sec = dep_sec + total_duration_sec

                # Tren şu an hatta mı? (dep_sec <= sim_time_seconds <= arr_sec)
                if dep_sec <= sim_time_seconds <= arr_sec:
                    elapsed_trip_sec = sim_time_seconds - dep_sec

                    # Trenin hangi iki durak arasında olduğunu bul
                    seg_idx = 0
                    for i in range(len(cum_times) - 1):
                        if cum_times[i] <= elapsed_trip_sec <= cum_times[i + 1]:
                            seg_idx = i
                            break
                    else:
                        seg_idx = len(stops) - 2

                    t_start_seg = cum_times[seg_idx]
                    t_end_seg = cum_times[seg_idx + 1]
                    seg_duration = max(1.0, t_end_seg - t_start_seg)
                    
                    # Segment içi ilerleme oranı (0.0 .. 1.0)
                    progress = (elapsed_trip_sec - t_start_seg) / seg_duration
                    progress = max(0.0, min(1.0, progress))

                    stn_from = self.de.stations[stops[seg_idx]]
                    stn_to = self.de.stations[stops[seg_idx + 1]]

                    # Doğrusal Coğrafi Enterpolasyon
                    curr_lat = stn_from["lat_wgs84"] + progress * (stn_to["lat_wgs84"] - stn_from["lat_wgs84"])
                    curr_lon = stn_from["lon_wgs84"] + progress * (stn_to["lon_wgs84"] - stn_from["lon_wgs84"])

                    # Seyir parametreleri
                    bearing = self.calculate_bearing(
                        stn_from["lat_wgs84"], stn_from["lon_wgs84"],
                        stn_to["lat_wgs84"], stn_to["lon_wgs84"]
                    )
                    
                    seg_dist_km = profile["segment_dists"][seg_idx]
                    speed_kmh = (seg_dist_km / (seg_duration / 3600.0)) if seg_duration > 0 else 23.0
                    eta_next_station_sec = int(t_end_seg - elapsed_trip_sec)

                    train_info = {
                        "train_id": f"{line_code}-{trip_idx + 1:02d}",
                        "line": line_code,
                        "route_key": r_key,
                        "direction": route["direction_code"],
                        "direction_name": route["name"],
                        "origin_departure": dep_str,
                        "current_lat": curr_lat,
                        "current_lon": curr_lon,
                        "from_station": stn_from["station_name"],
                        "to_station": stn_to["station_name"],
                        "segment_progress_pct": round(progress * 100, 1),
                        "total_trip_progress_pct": round((elapsed_trip_sec / total_duration_sec) * 100, 1),
                        "speed_kmh": round(speed_kmh, 1),
                        "bearing": round(bearing, 1),
                        "eta_next_station_sec": max(0, eta_next_station_sec),
                        "color": self.de.lines[line_code]["color"]
                    }
                    active_trains.append(train_info)

        return active_trains

# ==============================================================================
# 3. STREAMLIT ARAYÜZÜ (FAZ 1 PREVIEW & VERİ MOTORU TESTİ)
# ==============================================================================

def main():
    st.set_page_config(
        page_title="Kayseray Dijital İkiz | Faz 1",
        page_icon="🚋",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    st.markdown("""
        <style>
        .metric-box {
            background-color: #0e1626;
            border: 1px solid #1e293b;
            padding: 12px 16px;
            border-radius: 8px;
            color: #f8fafc;
        }
        .stSlider > div { color: #38bdf8; }
        </style>
    """, unsafe_allow_html=True)

    st.title("🚋 Kayseray Dijital İkizi — Faz 1: Veri Motoru ve Fizik Modeli")
    st.caption("Kayseri Büyükşehir Belediyesi T1, T2, T3, T4 Hatları Gerçek Sefer Saatleri & Matematiksel Enterpolasyon")

    # Veri Motorunu Başlat
    try:
        data_engine = KayseriDataEngine()
        physics_engine = TramPhysicsEngine(data_engine)
    except Exception as e:
        st.error(f"Veri yüklenirken hata oluştu: {e}")
        return

    # --- SIDEBAR KONTROLLERİ ---
    with st.sidebar:
        st.header("⚙️ Simülasyon Kontrolleri")
        st.info("🕒 **Faz 1 Görevi:** Hafta İçi (Weekday) tarifelerine göre seçilen saatteki aktif tramvayların coğrafi koordinatlarını hesaplama.")

        # Önayarlı Zaman Dilimleri
        preset_choice = st.selectbox(
            "Hızlı Zaman Önayarı:",
            ["Sabah Piki (08:15)", "Öğle Durgun (12:30)", "Akşam Piki (17:45)", "Gece Seferi (22:15)", "Manuel Seçim"]
        )

        default_hour, default_minute = 8, 15
        if preset_choice == "Sabah Piki (08:15)":
            default_hour, default_minute = 8, 15
        elif preset_choice == "Öğle Durgun (12:30)":
            default_hour, default_minute = 12, 30
        elif preset_choice == "Akşam Piki (17:45)":
            default_hour, default_minute = 17, 45
        elif preset_choice == "Gece Seferi (22:15)":
            default_hour, default_minute = 22, 15

        # Simülasyon Saati Seçici
        sim_time_input = st.slider(
            "Simülasyon Saati (Saat : Dakika)",
            min_value=time(5, 0),
            max_value=time(23, 59),
            value=time(default_hour, default_minute),
            step=pd.Timedelta(minutes=1)
        )

        sim_seconds = sim_time_input.hour * 3600 + sim_time_input.minute * 60

        # Hat Filtresi
        st.subheader("Aktif Hat Filtresi")
        selected_lines = []
        col_l1, col_l2 = st.columns(2)
        with col_l1:
            if st.checkbox("T1 (İldem-OSB)", value=True): selected_lines.append("T1")
            if st.checkbox("T2 (Talas-Meydan)", value=True): selected_lines.append("T2")
        with col_l2:
            if st.checkbox("T3 (Kumsmall-İldem)", value=True): selected_lines.append("T3")
            if st.checkbox("T4 (Anayurt-Meydan)", value=True): selected_lines.append("T4")

    # --- AKTİF TRAMVAYLARI HESAPLA ---
    active_trains = physics_engine.get_active_trains_at_time(sim_seconds, selected_lines)

    # --- ÜST METRİKLER ---
    m1, m2, m3, m4, m5 = st.columns(5)
    with m1:
        st.metric("Simülasyon Saati", sim_time_input.strftime("%H:%M:00"))
    with m2:
        st.metric("Toplam Aktif Tren", len(active_trains))
    with m3:
        t1_count = sum(1 for t in active_trains if t["line"] == "T1")
        st.metric("T1 Aktif Diziler", f"{t1_count} tren")
    with m4:
        t2_t4_count = sum(1 for t in active_trains if t["line"] in ["T2", "T4"])
        st.metric("T2 + T4 (Güney)", f"{t2_t4_count} tren")
    with m5:
        t3_count = sum(1 for t in active_trains if t["line"] == "T3")
        st.metric("T3 (Hastane/Kuzey)", f"{t3_count} tren")

    st.divider()

    # --- TABLOLAR VE VERİ MOTORU DOĞRULAMA ---
    t_tab1, t_tab2, t_tab3 = st.tabs(["📊 Aktif Tramvaylar (Fizik Motoru Çıktısı)", "🗺️ Güzergâh Profilleri", "📋 Hafta İçi Tarife Dökümü"])

    with t_tab1:
        st.subheader(f"Saat {sim_time_input.strftime('%H:%M')} İtibarıyla Rayda Olan Tramvaylar")
        if active_trains:
            df_trains = pd.DataFrame(active_trains)
            display_cols = [
                "train_id", "line", "direction_name", "origin_departure",
                "from_station", "to_station", "segment_progress_pct",
                "current_lat", "current_lon", "speed_kmh", "eta_next_station_sec"
            ]
            df_display = df_trains[display_cols].rename(columns={
                "train_id": "Tren Kodu",
                "line": "Hat",
                "direction_name": "Sefer Güzergâhı",
                "origin_departure": "İlk Kalkış",
                "from_station": "Geçtiği İstasyon",
                "to_station": "Hedef İstasyon",
                "segment_progress_pct": "Segment %",
                "current_lat": "Enlem (Lat)",
                "current_lon": "Boylam (Lon)",
                "speed_kmh": "Hız (km/sa)",
                "eta_next_station_sec": "Varışa Kalan (sn)"
            })
            st.dataframe(df_display, use_container_width=True, hide_index=True)
        else:
            st.warning("Seçilen saat diliminde ve hatlarda aktif çalışan tren bulunamadı.")

    with t_tab2:
        st.subheader("Hatlar ve Kesişim Özeti")
        st.markdown("""
        - **T1:** 43 Durak (27.0 km) — 70 dk sefer süresi — Ortalama seyir hızı: ~23.1 km/sa
        - **T2:** 18 Durak (10.25 km) — 33 dk sefer süresi — Ortalama seyir hızı: ~19.2 km/sa
        - **T3:** 49 Durak (30.0 km) — 78 dk sefer süresi — Ortalama seyir hızı: ~23.1 km/sa
        - **T4:** 17 Durak (10.0 km) — 32 dk sefer süresi — Ortalama seyir hızı: ~18.8 km/sa
        """)
        st.write(f"Toplam doğrulanmış benzersiz durak sayısı: **{len(data_engine.stations)} istasyon**")

    with t_tab3:
        st.subheader("Hafta İçi (Weekday) Tarife Planı Sefer Sayıları")
        summary_rows = []
        for r_k, route in data_engine.routes.items():
            deps = data_engine.timetables.get(r_k, [])
            summary_rows.append({
                "Hat Kodu": route["line_code"],
                "Yön Kodu": route["direction_code"],
                "Güzergâh Adı": route["name"],
                "Toplam Sefer": len(deps),
                "İlk Sefer": deps[0] if deps else "-",
                "Son Sefer": deps[-1] if deps else "-"
            })
        st.table(pd.DataFrame(summary_rows))

    st.markdown("---")
    st.success("✅ **FAZ 1 Tamamlandı:** Veri motoru ve coğrafi enterpolasyon fizik modeli başarıyla oluşturuldu.")

if __name__ == "__main__":
    main()
