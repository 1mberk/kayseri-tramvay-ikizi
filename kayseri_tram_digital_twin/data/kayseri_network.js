/**
 * Kayseri Tramvay Dijital İkiz Veri Tabanı (Kayseray 2026 & T5 Erkilet Projesi)
 * Kaynak: Kayseri Ulaşım A.Ş. API, Kayseri Büyükşehir Belediyesi, OpenStreetMap API v0.6
 * WGS84 Coğrafi Koordinatlar ve Doğrulanmış İşletme Parametreleri
 */

const KAYSERI_DATA = {
  metadata: {
    city: "Kayseri",
    network_name: "Kayseray Hafif Raylı Sistem Ağı",
    valid_date: "2026-11-09",
    total_stations: 75,
    operational_switch_nodes: 1,
    active_lines_count: 4,
    active_routes_count: 8,
    active_fleet_count: 80,
    daily_passengers_verified: 160000,
    annual_passengers_2025: 51637604,
    center: { lat: 38.7218925, lon: 35.4873228, name: "Cumhuriyet Meydanı" }
  },

  lines: [
    {
      id: "LINE_T1",
      code: "T1",
      name: "T1 Organize Sanayi ↔ İldem 5",
      color: "#FF3366",
      length_km: 27.0,
      station_count: 43,
      runtime_min: 70,
      commercial_speed_kmh: 23.1,
      electrification: "750 V DC Katener",
      daily_passengers: 125000,
      start_stn: "STN_01",
      end_stn: "STN_43",
      status: "OPERATIONAL"
    },
    {
      id: "LINE_T2",
      code: "T2",
      name: "T2 Cumhuriyet Meydanı ↔ Talas Cemil Baba",
      color: "#00E676",
      length_km: 10.25,
      station_count: 18,
      runtime_min: 33,
      commercial_speed_kmh: 19.2,
      electrification: "750 V DC Katener",
      daily_passengers: 30000,
      start_stn: "STN_19",
      end_stn: "STN_55",
      status: "OPERATIONAL"
    },
    {
      id: "LINE_T3",
      code: "T3",
      name: "T3 Kumsmall AVM ↔ İldem 5",
      color: "#00E5FF",
      length_km: 30.0,
      station_count: 49,
      runtime_min: 78,
      commercial_speed_kmh: 23.1,
      electrification: "750 V DC Katener",
      daily_passengers: 20000,
      start_stn: "STN_66",
      end_stn: "STN_43",
      status: "OPERATIONAL"
    },
    {
      id: "LINE_T4",
      code: "T4",
      name: "T4 Cumhuriyet Meydanı ↔ Anayurt İzzet Bayraktar Camii",
      color: "#E040FB",
      length_km: 10.0,
      station_count: 17,
      runtime_min: 32,
      commercial_speed_kmh: 18.8,
      electrification: "750 V DC Katener",
      daily_passengers: 15000,
      start_stn: "STN_19",
      end_stn: "STN_75",
      status: "OPERATIONAL"
    },
    {
      id: "LINE_T5_A",
      code: "T5-A",
      name: "T5 Erkilet ↔ Cumhuriyet Meydanı ↔ Millet Bahçesi (Resmî KBB Projesi)",
      color: "#FFD600",
      length_km: 17.8,
      station_count: 19,
      runtime_min: 38,
      commercial_speed_kmh: 28.0,
      electrification: "750 V DC Katener",
      daily_passengers: 45000,
      start_stn: "ERK_A_01",
      end_stn: "ERK_A_09",
      tunnel_length_km: 4.0,
      status: "PROPOSED",
      notes: "4 km tünel (4 yer altı istasyon), Havalimanı kılçık bağlantısı ve Kumsmall uzatması içerir."
    },
    {
      id: "LINE_T5_B",
      code: "T5-B",
      name: "T5 Erkilet Doğrudan Sıralı Güzergâh (Senaryo B)",
      color: "#FF9100",
      length_km: 14.7,
      station_count: 15,
      runtime_min: 32,
      commercial_speed_kmh: 27.5,
      electrification: "750 V DC Katener",
      daily_passengers: 42000,
      start_stn: "ERK_B_01",
      end_stn: "ERK_B_05",
      tunnel_length_km: 4.0,
      status: "PROPOSED",
      notes: "Bülbülpınarı → Havalimanı → AGÜ → Cumhuriyet Meydanı → Millet Bahçesi doğrusal hattı."
    }
  ],

  stations: [
    { id: "STN_01", code: "D1", name: "Organize Sanayi", lat: 38.738327, lon: 35.3685284, lines: ["T1"], type: "terminal", district: "Melikgazi", is_depot: true },
    { id: "STN_02", code: "D2", name: "Tınaztepe", lat: 38.7375739, lon: 35.3799352, lines: ["T1"], type: "regular", district: "Melikgazi" },
    { id: "STN_03", code: "D3", name: "19 Mayıs", lat: 38.7392898, lon: 35.3882228, lines: ["T1"], type: "regular", district: "Melikgazi" },
    { id: "STN_04", code: "D4", name: "Belsin Kürsü", lat: 38.7442845, lon: 35.3923611, lines: ["T1"], type: "regular", district: "Melikgazi" },
    { id: "STN_05", code: "D5", name: "Selimiye", lat: 38.7424563, lon: 35.399852, lines: ["T1"], type: "regular", district: "Melikgazi" },
    { id: "STN_06", code: "D6", name: "Anafartalar", lat: 38.7408089, lon: 35.4037577, lines: ["T1", "T3"], type: "transfer", district: "Melikgazi", is_hub: true },
    { id: "STN_07", code: "D7", name: "Keykubat", lat: 38.7392497, lon: 35.4110799, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_08", code: "D8", name: "Sakarya", lat: 38.736178, lon: 35.4177824, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_09", code: "D9", name: "Stadyum", lat: 38.7334796, lon: 35.4242862, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_10", code: "D10", name: "Köprülü Kavşak", lat: 38.7333035, lon: 35.4307427, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_11", code: "D11", name: "Yazı Bağları", lat: 38.7318102, lon: 35.436286, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_12", code: "D12", name: "Esentepe", lat: 38.7296432, lon: 35.4412114, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_13", code: "D13", name: "Yeni Sanayi - DSİ", lat: 38.7296393, lon: 35.4457367, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_14", code: "D14", name: "Osman Kavuncu", lat: 38.7271899, lon: 35.4531568, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_15", code: "D15", name: "Karayolları", lat: 38.7258049, lon: 35.4595346, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_16", code: "D16", name: "Aydınlıkevler", lat: 38.7244515, lon: 35.4661948, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_17", code: "D17", name: "Eski Sanayi", lat: 38.7233665, lon: 35.4713883, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_18", code: "D18", name: "Düvenönü", lat: 38.7207698, lon: 35.4810547, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_19", code: "D19", name: "Cumhuriyet Meydanı", lat: 38.7218925, lon: 35.4873228, lines: ["T1", "T2", "T3", "T4", "T5-A", "T5-B"], type: "central_hub", district: "Melikgazi", is_hub: true },
    { id: "STN_20", code: "D20", name: "Hunat Hatun", lat: 38.7232122, lon: 35.4930874, lines: ["T1", "T2", "T3", "T4"], type: "corridor", district: "Melikgazi" },
    { id: "STN_21", code: "D21", name: "Büyükşehir Belediyesi", lat: 38.7246807, lon: 35.4984378, lines: ["T1", "T2", "T3", "T4"], type: "corridor", district: "Melikgazi" },
    { id: "STN_22", code: "D22", name: "Fuzuli", lat: 38.7270475, lon: 35.5068304, lines: ["T1", "T2", "T3", "T4"], type: "corridor", district: "Melikgazi" },
    { id: "STN_23", code: "D23", name: "Alparslan", lat: 38.7286637, lon: 35.5124238, lines: ["T1", "T2", "T3", "T4"], type: "corridor", district: "Melikgazi" },
    { id: "STN_24", code: "D24", name: "Tuna", lat: 38.7306315, lon: 35.5193112, lines: ["T1", "T2", "T3", "T4"], type: "transfer", district: "Melikgazi", is_hub: true },
    { id: "STN_25", code: "D25", name: "Erciyesevler", lat: 38.7323298, lon: 35.5252531, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_26", code: "D26", name: "Çiftekümbet", lat: 38.7338324, lon: 35.5305518, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_27", code: "D27", name: "Yıldızevler", lat: 38.7381455, lon: 35.537002, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_28", code: "D28", name: "Doğu Terminali", lat: 38.7432501, lon: 35.5427642, lines: ["T1", "T3"], type: "transfer", district: "Melikgazi", is_hub: true },
    { id: "STN_29", code: "D29", name: "Mimar Sinan Kavşağı", lat: 38.7486943, lon: 35.5489048, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_30", code: "D30", name: "Gökkent", lat: 38.7534276, lon: 35.5543371, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_31", code: "D31", name: "Kumarlı", lat: 38.7584243, lon: 35.5601444, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_32", code: "D32", name: "Harikalar Diyarı", lat: 38.7666545, lon: 35.5650384, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_33", code: "D33", name: "Cırgalan", lat: 38.7695796, lon: 35.5673733, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_34", code: "D34", name: "Ahi Evran", lat: 38.773355, lon: 35.5715285, lines: ["T1", "T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_35", code: "D35", name: "Gesi Kavşağı", lat: 38.776913, lon: 35.5749914, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_36", code: "D36", name: "Beyazşehir", lat: 38.778259, lon: 35.5808762, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_37", code: "D37", name: "TOKİ Kavşağı", lat: 38.779729, lon: 35.5895522, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_38", code: "D38", name: "Millet", lat: 38.7802305, lon: 35.5964285, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_39", code: "D39", name: "İldem 1", lat: 38.782258, lon: 35.6008276, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_40", code: "D40", name: "İldem 2", lat: 38.7842255, lon: 35.6058138, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_41", code: "D41", name: "İldem 3", lat: 38.785146, lon: 35.6120217, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_42", code: "D42", name: "İldem 4", lat: 38.786129, lon: 35.6185893, lines: ["T1", "T3"], type: "regular", district: "Melikgazi" },
    { id: "STN_43", code: "D43", name: "İldem 5", lat: 38.7869555, lon: 35.6254264, lines: ["T1", "T3"], type: "terminal", district: "Melikgazi", is_depot: true },

    // T2 & T4 Güney Hattı Durakları
    { id: "STN_44", code: "ST44", name: "Sema Yazar Parkı", lat: 38.7309935, lon: 35.5243172, lines: ["T2", "T4"], type: "regular", district: "Melikgazi" },
    { id: "STN_45", code: "ST45", name: "Şehit Mustafa Şimşek", lat: 38.7270255, lon: 35.5259926, lines: ["T2", "T4"], type: "transfer", district: "Melikgazi", is_hub: true },
    { id: "STN_46", code: "ST46", name: "Şehit Furkan Doğan", lat: 38.720509, lon: 35.528396, lines: ["T2"], type: "regular", district: "Melikgazi" },
    { id: "STN_47", code: "ST47", name: "Teknopark", lat: 38.7140765, lon: 35.5310607, lines: ["T2"], type: "regular", district: "Melikgazi" },
    { id: "STN_48", code: "ST48", name: "Erciyes Üniversitesi", lat: 38.7079575, lon: 35.5310366, lines: ["T2"], type: "regular", district: "Melikgazi" },
    { id: "STN_49", code: "ST49", name: "Hastaneler", lat: 38.703775, lon: 35.528883, lines: ["T2"], type: "regular", district: "Melikgazi" },
    { id: "STN_50", code: "ST50", name: "Lojmanlar", lat: 38.700129, lon: 35.5271984, lines: ["T2"], type: "regular", district: "Talas" },
    { id: "STN_51", code: "ST51", name: "Kızılay Kan Merkezi", lat: 38.697254, lon: 35.5341266, lines: ["T2"], type: "regular", district: "Talas" },
    { id: "STN_52", code: "ST52", name: "Yurtlar Bölgesi", lat: 38.6957255, lon: 35.5394788, lines: ["T2"], type: "regular", district: "Talas" },
    { id: "STN_53", code: "ST53", name: "Bahçelievler", lat: 38.694067, lon: 35.5452755, lines: ["T2"], type: "regular", district: "Talas" },
    { id: "STN_54", code: "ST54", name: "Talas Belediyesi", lat: 38.6926085, lon: 35.5500889, lines: ["T2"], type: "transfer", district: "Talas" },
    { id: "STN_55", code: "ST55", name: "Talas Cemil Baba", lat: 38.6885365, lon: 35.5544934, lines: ["T2"], type: "terminal", district: "Talas" },

    // T3 Kuzeybatı Kolu Durakları
    { id: "STN_56", code: "ST56", name: "Anafartalar 2", lat: 38.7431085, lon: 35.4014075, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_57", code: "ST57", name: "Otogar", lat: 38.7483, lon: 35.4042175, lines: ["T3"], type: "transfer", district: "Kocasinan", is_hub: true },
    { id: "STN_58", code: "ST58", name: "Fen Lisesi", lat: 38.754826, lon: 35.408505, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_59", code: "ST59", name: "Hurdacılar", lat: 38.7599495, lon: 35.412064, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_60", code: "ST60", name: "Psikiyatri Hastanesi", lat: 38.764782, lon: 35.412763, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_61", code: "ST61", name: "Şehir Hastanesi", lat: 38.769497, lon: 35.412574, lines: ["T3"], type: "transfer", district: "Kocasinan", is_hub: true },
    { id: "STN_62", code: "ST62", name: "Hastane Konutları", lat: 38.7743555, lon: 35.412387, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_63", code: "ST63", name: "Nuh Naci Yazgan Üniversitesi", lat: 38.7791685, lon: 35.4130595, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_64", code: "ST64", name: "Mobilyakent 1", lat: 38.7769195, lon: 35.4192995, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_65", code: "ST65", name: "Mobilyakent 2", lat: 38.7733945, lon: 35.4257955, lines: ["T3"], type: "regular", district: "Kocasinan" },
    { id: "STN_66", code: "ST66", name: "Kumsmall AVM", lat: 38.7776795, lon: 35.4323385, lines: ["T3", "T5-A"], type: "terminal", district: "Kocasinan" },

    // T4 Anayurt Kolu Durakları
    { id: "STN_67", code: "ST67", name: "Yıldırım Beyazıt", lat: 38.7217214, lon: 35.5291589, lines: ["T4"], type: "regular", district: "Melikgazi" },
    { id: "STN_68", code: "ST68", name: "Keçitepesi", lat: 38.7209942, lon: 35.5384875, lines: ["T4"], type: "regular", district: "Talas" },
    { id: "STN_69", code: "ST69", name: "Dedeman İmam Hatip Lisesi", lat: 38.72005, lon: 35.5474753, lines: ["T4"], type: "regular", district: "Talas" },
    { id: "STN_70", code: "ST70", name: "Germiraltı", lat: 38.7185861, lon: 35.5552216, lines: ["T4"], type: "regular", district: "Talas" },
    { id: "STN_71", code: "ST71", name: "Kayseri Üniversitesi Şehit İsmet Eraslan", lat: 38.7134764, lon: 35.5563209, lines: ["T4"], type: "regular", district: "Talas" },
    { id: "STN_72", code: "ST72", name: "Halef Hoca", lat: 38.7092068, lon: 35.5569167, lines: ["T4"], type: "regular", district: "Talas" },
    { id: "STN_73", code: "ST73", name: "Anayurt Pazar Yeri", lat: 38.7085255, lon: 35.5619913, lines: ["T4"], type: "regular", district: "Talas" },
    { id: "STN_74", code: "ST74", name: "Turgut Özal", lat: 38.7064583, lon: 35.56551, lines: ["T4"], type: "regular", district: "Talas" },
    { id: "STN_75", code: "ST75", name: "İzzet Bayraktar Camii", lat: 38.7024636, lon: 35.5663687, lines: ["T4"], type: "terminal", district: "Talas" },

    // Operasyonel Makas Düğümü (Yolcusuz)
    { id: "STN_76", code: "ST76", name: "Cumhuriyet Meydanı Batı Makası", lat: 38.7213, lon: 35.48504, lines: ["T2", "T4"], type: "switch", district: "Melikgazi", is_passenger_station: false }
  ],

  // Planlanan T5 Erkilet İstasyonları ve Düğümleri
  erkilet_nodes: {
    scenario_a: [
      { id: "ERK_A_01", name: "Bülbülpınarı / 100. Yıl", lat: 38.8065, lon: 35.4712, type: "terminal", surface: "surface" },
      { id: "ERK_A_02", name: "Erkilet Merkez / Osmangazi", lat: 38.7915, lon: 35.4695, type: "regular", surface: "surface" },
      { id: "ERK_A_03", name: "Erkilet Bulvarı - Kumsmall Kavşağı", lat: 38.7745, lon: 35.4730, type: "junction", surface: "surface", link_to: "STN_66" },
      { id: "ERK_A_04", name: "Havalimanı Kılçık İstasyonu", lat: 38.77348, lon: 35.49468, type: "airport_spur", surface: "surface" },
      { id: "ERK_A_05", name: "İl Emniyet / AGÜ Sümer (Tünel Giriş)", lat: 38.7389, lon: 35.4766, type: "portal", surface: "tunnel" },
      { id: "ERK_A_06", name: "Kayseri Garı / Adalet Sarayı (Yer Altı)", lat: 38.7315, lon: 35.4795, type: "underground", surface: "tunnel" },
      { id: "ERK_A_07", name: "Cumhuriyet Meydanı (Yer Altı Aktarma)", lat: 38.72189, lon: 35.48715, type: "central_hub", surface: "tunnel", link_to: "STN_19" },
      { id: "ERK_A_08", name: "Döner Kümbet / Seyyid Burhanettin", lat: 38.71411, lon: 35.49575, type: "underground", surface: "tunnel" },
      { id: "ERK_A_09", name: "Millet Bahçesi (Güney Terminali)", lat: 38.70383, lon: 35.50939, type: "terminal", surface: "surface" }
    ],
    scenario_b: [
      { id: "ERK_B_01", name: "Bülbülpınarı (Kuzey Uç)", lat: 38.8065, lon: 35.4712, type: "terminal", surface: "surface" },
      { id: "ERK_B_02", name: "Kayseri Havalimanı (Doğrudan Geçiş)", lat: 38.77348, lon: 35.49468, type: "airport", surface: "surface" },
      { id: "ERK_B_03", name: "Abdullah Gül Üniversitesi (AGÜ)", lat: 38.73885, lon: 35.47454, type: "regular", surface: "tunnel" },
      { id: "ERK_B_04", name: "Cumhuriyet Meydanı (Aktarma Düğümü)", lat: 38.72189, lon: 35.48715, type: "central_hub", surface: "tunnel", link_to: "STN_19" },
      { id: "ERK_B_05", name: "Millet Bahçesi (Güney Uç)", lat: 38.70383, lon: 35.50939, type: "terminal", surface: "surface" }
    ]
  },

  // 8 Hat-Yön Güzergâh Tanımları (Durak ID Sıraları)
  routes: {
    T1_ARR: {
      line: "T1",
      direction: "ARRIVAL",
      name: "İldem 5 → Organize Sanayi",
      stops: [
        "STN_43", "STN_42", "STN_41", "STN_40", "STN_39", "STN_38", "STN_37", "STN_36",
        "STN_35", "STN_34", "STN_33", "STN_32", "STN_31", "STN_30", "STN_29", "STN_28",
        "STN_27", "STN_26", "STN_25", "STN_24", "STN_23", "STN_22", "STN_21", "STN_20",
        "STN_19", "STN_18", "STN_17", "STN_16", "STN_15", "STN_14", "STN_13", "STN_12",
        "STN_11", "STN_10", "STN_09", "STN_08", "STN_07", "STN_06", "STN_05", "STN_04",
        "STN_03", "STN_02", "STN_01"
      ]
    },
    T1_DEP: {
      line: "T1",
      direction: "DEPARTURE",
      name: "Organize Sanayi → İldem 5",
      stops: [
        "STN_01", "STN_02", "STN_03", "STN_04", "STN_05", "STN_06", "STN_07", "STN_08",
        "STN_09", "STN_10", "STN_11", "STN_12", "STN_13", "STN_14", "STN_15", "STN_16",
        "STN_17", "STN_18", "STN_19", "STN_20", "STN_21", "STN_22", "STN_23", "STN_24",
        "STN_25", "STN_26", "STN_27", "STN_28", "STN_29", "STN_30", "STN_31", "STN_32",
        "STN_33", "STN_34", "STN_35", "STN_36", "STN_37", "STN_38", "STN_39", "STN_40",
        "STN_41", "STN_42", "STN_43"
      ]
    },
    T2_ARR: {
      line: "T2",
      direction: "ARRIVAL",
      name: "Talas Cemil Baba → Cumhuriyet Meydanı",
      stops: [
        "STN_55", "STN_54", "STN_53", "STN_52", "STN_51", "STN_50", "STN_49", "STN_48",
        "STN_47", "STN_46", "STN_45", "STN_44", "STN_24", "STN_23", "STN_22", "STN_21",
        "STN_20", "STN_19"
      ]
    },
    T2_DEP: {
      line: "T2",
      direction: "DEPARTURE",
      name: "Cumhuriyet Meydanı → Talas Cemil Baba",
      stops: [
        "STN_19", "STN_20", "STN_21", "STN_22", "STN_23", "STN_24", "STN_44", "STN_45",
        "STN_46", "STN_47", "STN_48", "STN_49", "STN_50", "STN_51", "STN_52", "STN_53",
        "STN_54", "STN_55"
      ]
    },
    T3_DEP: {
      line: "T3",
      direction: "DEPARTURE",
      name: "Kumsmall AVM → İldem 5",
      stops: [
        "STN_66", "STN_65", "STN_64", "STN_63", "STN_62", "STN_61", "STN_60", "STN_59",
        "STN_58", "STN_57", "STN_56", "STN_06", "STN_07", "STN_08", "STN_09", "STN_10",
        "STN_11", "STN_12", "STN_13", "STN_14", "STN_15", "STN_16", "STN_17", "STN_18",
        "STN_19", "STN_20", "STN_21", "STN_22", "STN_23", "STN_24", "STN_25", "STN_26",
        "STN_27", "STN_28", "STN_29", "STN_30", "STN_31", "STN_32", "STN_33", "STN_34",
        "STN_35", "STN_36", "STN_37", "STN_38", "STN_39", "STN_40", "STN_41", "STN_42",
        "STN_43"
      ]
    },
    T3_ARR: {
      line: "T3",
      direction: "ARRIVAL",
      name: "İldem 5 → Kumsmall AVM",
      stops: [
        "STN_43", "STN_42", "STN_41", "STN_40", "STN_39", "STN_38", "STN_37", "STN_36",
        "STN_35", "STN_34", "STN_33", "STN_32", "STN_31", "STN_30", "STN_29", "STN_28",
        "STN_27", "STN_26", "STN_25", "STN_24", "STN_23", "STN_22", "STN_21", "STN_20",
        "STN_19", "STN_18", "STN_17", "STN_16", "STN_15", "STN_14", "STN_13", "STN_12",
        "STN_11", "STN_10", "STN_09", "STN_08", "STN_07", "STN_06", "STN_56", "STN_57",
        "STN_58", "STN_59", "STN_60", "STN_61", "STN_62", "STN_63", "STN_64", "STN_65",
        "STN_66"
      ]
    },
    T4_DEP: {
      line: "T4",
      direction: "DEPARTURE",
      name: "İzzet Bayraktar Camii → Cumhuriyet Meydanı",
      stops: [
        "STN_75", "STN_74", "STN_73", "STN_72", "STN_71", "STN_70", "STN_69", "STN_68",
        "STN_67", "STN_45", "STN_44", "STN_24", "STN_23", "STN_22", "STN_21", "STN_20",
        "STN_19"
      ]
    },
    T4_ARR: {
      line: "T4",
      direction: "ARRIVAL",
      name: "Cumhuriyet Meydanı → İzzet Bayraktar Camii",
      stops: [
        "STN_19", "STN_20", "STN_21", "STN_22", "STN_23", "STN_24", "STN_44", "STN_45",
        "STN_67", "STN_68", "STN_69", "STN_70", "STN_71", "STN_72", "STN_73", "STN_74",
        "STN_75"
      ]
    }
  },

  // Filo Bilgileri (80 Araç)
  fleet_spec: {
    ansaldo_sirio: {
      model: "AnsaldoBreda Sirio (İtalya)",
      count: 38,
      seats: 70,
      standing_capacity: 153,
      total_capacity: 223,
      length_m: 32.25,
      power_kw: "4x106 kW",
      max_grade: "%6.1",
      max_speed: 80
    },
    bozankaya_gen1: {
      model: "Bozankaya Kayseray 1. Nesil (2015-2016 Yerli)",
      count: 31,
      seats: 70,
      standing_capacity: 239,
      total_capacity: 309,
      length_m: 32.72,
      power_kw: "4x120 kW",
      max_grade: "%6.1",
      max_speed: 80
    },
    bozankaya_gen2: {
      model: "Bozankaya 2. Nesil (2023-2024 Yüksek Eğim)",
      count: 11,
      seats: 68,
      standing_capacity: 228,
      total_capacity: 296,
      length_m: 32.72,
      power_kw: "4x120 kW",
      max_grade: "%7.0",
      max_speed: 80
    }
  },

  // Literatüre Dayalı Arıza, Kaza ve Bakım Olay Kataloğu
  incident_catalog: [
    {
      id: "INC_CATENARY",
      name: "Katener / Trafo Enerji Kesintisi",
      category: "Elektrik & Enerji",
      severity: "CRITICAL",
      affected_systems: ["Cer gücü", "Klima", "Aydınlatma"],
      impact_description: "İlgili alt besleme bölgesindeki tüm tramvaylar durur. Güzergâh tek hat işletmesine alınır veya otobüs ring desteği gerekir.",
      typical_mttr_min: 45,
      frequency_rate: "Yılda ~3-5 kez"
    },
    {
      id: "INC_SWITCH_LOCK",
      name: "Makas Kilitlenme / Pozisyon Algılama Hatası",
      category: "Altyapı & Makas",
      severity: "HIGH",
      affected_systems: ["Sinyalizasyon", "Makas motoru", "Kuyruk hattı"],
      impact_description: "Özellikle STN_76 Cumhuriyet Meydanı makasında oluşursa T2 ve T4 hatları kafa değiştiremez, merkez düğümde tren birikmesi (bunching) başlar.",
      typical_mttr_min: 25,
      frequency_rate: "Ayda ~1-2 kez"
    },
    {
      id: "INC_DOOR_OBSTACLE",
      name: "Kapı Sıkışması / Yolcu Kaynaklı Gecikme",
      category: "Araç & Yolcu İşletmesi",
      severity: "LOW",
      affected_systems: ["Kapı fotoseli", "Dwell time"],
      impact_description: "Pik saatlerde durak bekleme süresini (dwell time) 25 saniyeden 120-180 saniyeye çıkarır, arkadaki araçlarda gecikme dalgalanması (knock-on effect) yaratır.",
      typical_mttr_min: 4,
      frequency_rate: "Haftada ~8-12 kez"
    },
    {
      id: "INC_SIGNAL_BLOCK",
      name: "Ray Devresi / Sinyal Blok İhlali",
      category: "Sinyalizasyon & Emniyet",
      severity: "HIGH",
      affected_systems: ["Otomatik Tren Koruması (ATP)", "Hız kısıtı"],
      impact_description: "Acil frenleme devreye girer. Tramvaylar 15 km/sa emniyetli görüş hızına düşürülür, koridorda headway 2 katına çıkar.",
      typical_mttr_min: 30,
      frequency_rate: "Ayda ~1 kez"
    },
    {
      id: "INC_TRACK_WEATHER",
      name: "Hava Koşulları Kaynaklı Ray Genleşmesi / Buzlanma",
      category: "Ray & Çevre",
      severity: "MEDIUM",
      affected_systems: ["Pantoğraf", "Ray sürtünmesi", "Fren mesafesi"],
      impact_description: "Kışın katener buzlanması ark oluşturur; yazın aşırı sıcakta ray burkulma riski için seyir hızı 50 km/sa'e kısıtlanır.",
      typical_mttr_min: 60,
      frequency_rate: "Mevsimsel"
    }
  ],

  // Akademik Makale ve Ulaşım Planlama Değişkenleri
  academic_planning_variables: [
    {
      code: "HEADWAY",
      name: "Sefer Sıklığı (Headway - H)",
      unit: "dakika",
      definition: "İki ardışık tramvay arasındaki zaman aralığı. H = 60 / f (f: saatlik frekans).",
      formula: "H = T_cycle / N_fleet",
      optimization_goal: "Pik saatlerde yolcu bekleme süresini minimize etmek; gece saatlerinde boş koltuk maliyetini düşürmek."
    },
    {
      code: "CYCLE_TIME",
      name: "Hat Çevrim Süresi (Cycle Time - T_cycle)",
      unit: "dakika",
      definition: "Bir trenin terminalden çıkıp gidiş-dönüş yaparak aynı noktaya tekrar kalkışa hazır gelme süresi.",
      formula: "T_cycle = T_outbound + T_inbound + t_layover_origin + t_layover_dest",
      optimization_goal: "Depo giriş/çıkışlarını ve terminal duruşlarını (layover) en aza indirmek."
    },
    {
      code: "FLEET_SIZE",
      name: "Gerekli Filo Büyüklüğü (N_fleet)",
      unit: "adet dizi",
      definition: "Belirli bir headway ve çevrim süresini kesintisiz sürdürmek için gereken aktif tren dizisi sayısı.",
      formula: "N_fleet = ceil(T_cycle / H) * (1 + Reserve_Ratio)",
      optimization_goal: "Araç sermaye ve bakım maliyetlerini minimize ederken %12-15 rezerv payı bırakmak."
    },
    {
      code: "DWELL_TIME",
      name: "Durak Bekleme Süresi (Dwell Time - t_dwell)",
      unit: "saniye",
      definition: "Tramvayın peronda yolcu iniş-binişi için durduğu süre.",
      formula: "t_dwell = t_fixed + (b1 * Boarding + b2 * Alighting) / Doors",
      optimization_goal: "Seviyeli hemzemin biniş ve çoklu kapı akışıyla t_dwell'i 20-30 saniyede tutmak."
    },
    {
      code: "COMMERCIAL_SPEED",
      name: "Ticari / İşletme Hızı (V_comm)",
      unit: "km/sa",
      definition: "Durak duruşları ve kavşak beklemeleri dahil ortalama seyir hızı.",
      formula: "V_comm = Route_Length / (Sum(Run_Time) + Sum(Dwell_Time) + Signal_Delays)",
      optimization_goal: "Öncelikli sinyalizasyon (TSP) ve tünel kesimleri ile V_comm'u 20'den 28 km/sa'e çıkarmak."
    },
    {
      code: "LOAD_FACTOR",
      name: "Kapasite Doluluk Oranı (Load Factor - LF)",
      unit: "%",
      definition: "Taşınan anlık yolcu sayısının trenin nominal kapasitesine oranı.",
      formula: "LF = Current_Passengers / Total_Design_Capacity",
      optimization_goal: "Konfor için LF <= 0.85; ezici pik saatlerde LF <= 1.05 tutulması."
    },
    {
      code: "ENERGY_CONSUMPTION",
      name: "Spesifik Cer Enerjisi Tüketimi (SEC)",
      unit: "kWh / araç-km",
      definition: "Tramvayın 1 km yol gitmesi için şebekeden çektiği net elektrik enerjisi.",
      formula: "SEC = E_traction - E_regen (Rejeneratif frenleme geri kazanımı)",
      optimization_goal: "Rejeneratif frenlemeyle %25-30 enerji geri beslemesi sağlamak."
    }
  ]
};

// Global / Node.js uyumluluğu
if (typeof module !== "undefined" && module.exports) {
  module.exports = KAYSERI_DATA;
}
