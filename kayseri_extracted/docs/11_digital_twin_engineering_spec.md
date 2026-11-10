# 11 — Kayseri Raylı Sistem Dijital İkizi: Uluslararası Kaynaklara Dayalı Mühendislik Şartnamesi

> **Sürüm:** 1.0 · **Hazırlanma / kaynak kontrol tarihi:** 2026-11-09 · **Tür:** Kod üretimini yönlendiren mimari/kalite şartnamesi  
> **Öncelik:** Bu belge, `docs/01_scope.md`, `docs/04_requirements.md`, `docs/05_data_dictionary.md`, `docs/06_architecture.md` ve `docs/07_tasks.md` ile birlikte okunur. Çelişki halinde kod yazmak yerine çelişkiyi `docs/08_decisions.md` dosyasına kaydet ve çöz.  
> **Önemli:** Bu belge bir standart metninin kopyası veya projenin standart sertifikası değildir; uluslararası kaynaklardan hareketle **Kayseri projesi için önerilen mühendislik gereksinimlerini** ve doğrulama ölçütlerini belirler. Bu belgedeki sayısal eşikler, açıkça 'önerilen proje kontrolü' olarak belirtilmedikçe ilgili uluslararası standarttan türetilmiş zorunluluklar sayılmaz.

## 0. Coding Agent için kısa, bağlayıcı özet — ÖNCE BURAYI OKU

1. **Harita + animasyon ≠ otomatik olarak canlı dijital ikiz.** İlk sürüm `digital_twin_prototype` / `simulation` olarak etiketlenir. `live` yalnızca gerçek, izinli, çalışan, zaman damgalı ve tazelik kontrolünden geçmiş operasyon verisiyle açılır. [R01][R02]
2. **Dört farklı temsili ayır:** (a) fiziksel altyapı/ray topolojisi, (b) yolcu hizmeti: hat-durak-sefer, (c) zamana bağlı durum/araç olayları, (d) 'what-if' senaryoları. Bir harita çizgisi veya aynı isimdeki durak tek başına fiziksel ray ortaklığı kanıtı değildir. [R05][R06]
3. **Kayseri T1–T4 mevcut hizmet ağı ile Erkilet konsepti ayrı katmanlardır.** Kullanıcı tarafından verilen `Bülbülpınarı → Havalimanı → AGÜ → Cumhuriyet Meydanı → Millet Bahçesi` yalnızca senaryo *waypoint* dizisidir; onaylanmış ray güzergâhı/koordinat/durak listesi değildir.
4. **Eksik gerçek veriyi uydurma.** Durağın koordinatı, ray geometrisi, sefer saati, araç hızı, yolcu talebi, hat kapasitesi, signal/blok bilgisi yoksa `null` + `unknown`; gerekiyorsa ayrı, belirgin `synthetic` örnek veri katmanında tamamen örnek yapay ağ kullan. Kayseri haritasındaki gerçek konuma hayalî şekil çizme.
5. **Önce ağ modeli, sonra durum motoru, sonra optimizasyon, sonra arayüz.** Kod küçük, test edilebilir modüllere ayrılır; fiziksel kapasite ve ray çatışmaları görsel animasyondan bağımsız hesaplanır.
6. Her özellik `input data → canonical model → deterministic logic → test → visualization` zincirini takip eder. Harita hesaplama kaynağı değil, hesaplamaların görünümüdür.
7. **Simülasyon deterministik tekrar çalıştırılabilmelidir:** scenario_id, data_version, config_version, random_seed, simulation_start, simulation_end, step/resolution, kullanılan varsayımlar, sonuçlar saklanır.
8. Geliştirmede aynı anda tek görev uygula; üretim verisini bozmadan değiştir, testleri gerçekten çalıştır, sonucu `docs/09_progress.md` dosyasına yaz.

## 1. Dijital ikiz tanımı, olgunluk ve kapsam

### 1.1. Literatürden alınan çekirdek ilkeler

- **Digital Twin Consortium (DTC):** Fiziksel nesne ve süreçlerin, belirtilmiş sıklık ve doğruluk düzeyinde senkronize veri odaklı sanal temsili. Canlı dünya ile bağlantı kurmadan gelecek senaryolarını modelleyen sistem için *digital twin prototype* terimi kullanılır. [R01]
- **ISO/IEC 30173:2023:** Dijital ikiz kavramları, terminoloji, paydaşlar ve yaşam döngüsü için üst seviye referans. Bu belge, ISO uyumluluk iddiasında bulunmaz. [R02]
- **NIST IR 8356 (2025):** Dijital ikizlerde siber güvenlik, güven, doğruluk ve operasyonel bağlama uygunluğu göz önüne alınmalı. [R03]
- **Network Rail:** Çizelge değişikliklerini değerlendirmede simülasyon ve performans analizi, kararlar ve ödünleşimler için kullanılır. [R04]

### 1.2. Kayseri için olgunluk seviyeleri (PROJE SINIFLANDIRMASI)

| Seviye | Adı | Gerçek zamanlı veri? | Yapabilecekleri | Arayüzde zorunlu etiket |
|---|---|---:|---|---|
| M0 | Doğrulanabilir dijital ağ modeli | Hayır | Durak, hat, ray, zaman çizelgesi, veri kalitesi | `Statik / doğrulanmış veri` |
| M1 | Dijital ikiz prototipi | Hayır | Zaman motoru, tramvay animasyonu, senaryo karşılaştırma, headway önerisi | `Simülasyon — canlı veri değil` |
| M2 | Veriyle güncellenen dijital izleme | Evet, kısmen | Gerçek gözlem olayları ve veri tazeliği; kısıtlı durum eşitleme | `Canlı / gecikmeli / bilinmiyor` |
| M3 | Operasyonel dijital ikiz | Evet, doğrulanmış | Durum eşleme, kalibrasyon, tahmin ve sapma analizi | `Canlı dijital ikiz` yalnızca ölçütleri sağlıyorsa |

**Kabul:** MVP M0+M1 hedefler. M2/M3 **uygulandı olarak yazılmaz**; bağlantı arayüzü ve adaptör sözleşmesi geleceğe hazırlanır. `LIVE` statüsü otomatik açılmaz.

## 2. Proje amaçları ve sorular

**Dört temel iş problemi:**

1. **Ağ görünürlüğü:** Her hat hangi duraklardan hangi yönde geçer, hangi fiziksel kesimi diğer hatlarla paylaşır?
2. **Operasyon:** Saat ve güzergâha göre planlanan/hesaplanan araç hareketi, bekleme, dönüş ve darboğazlar nelerdir?
3. **Senaryo:** Önerilen Erkilet konsepti eklendiğinde hangi onaylı bağlantı noktaları ve kapasite kısıtları etkilenebilir? Gerekli veri yoksa belirsizlik raporlanır.
4. **Karar desteği:** Headway, araç sayısı, yolcu bekleme süresi ve kapasite arasında hangi açık varsayımlar altında ödünleşim vardır?

**Proje dışı (MVP):** Kayseri Ulaşım adına kontrol komutu göndermek, gerçek seferleri yönlendirmek, sertifikalı sinyalizasyon emniyet analizi yapmak, yetkisiz API'lerden araç izlemek, talep tahminini gözlem diye sunmak. Yazılım **karar destek/prototip** amaçlıdır; sahadaki gerçek güvenlik sistemlerinin yerine geçmez.

## 3. Veri modeli: iki grafik ve olay-zaman katmanı

### 3.1. Fiziksel altyapı grafı `G_rail` (directed multigraph)

**Nesneler:**

- `physical_node`: makas/kavşak/peron bağlantısı/terminal sınırı; doğrulanmış `node_id`; opsiyonel lon/lat.
- `physical_segment`: iki düğüm arasındaki **tekil fiziksel ray varlığı**; `segment_id`, `from_node_id`, `to_node_id`, `track_id`, `directionality`, `length_m`, `geometry_ref`, `capacity_rule`, `block_id`, `source_id`, `data_status`.
- `directed_traversal`: bir segmentin belirli yöndeki kullanım ilişkisi. İki yönlü işletme desteklense bile **aynı fiziksel tek hat** için kapasite/işgal kaynağı ortak olabilir.
- `platform`, `station`: istasyon ile peron aynı nesne değildir. `station_id` ve `platform_id` farklıdır.
- `transfer_connection`: istasyon içi/istasyonlar arası yaya aktarması; ray kenarı değil; aktarma süresi bilinmiyorsa `null`.

**İki farklı hattın aynı istasyona uğraması**, aynı ray kesimini kullandığı anlamına gelmez. Fiziksel ray grafı yalnızca iz/harita/altyapı kanıtıyla oluşturulur. railML altyapı topolojisinde graf ve katman yaklaşımı kullanır; ray sinyalleri ve çift yönler için SUMO ayrı modelleme ister. [R05][R07]

### 3.2. Hizmet grafı `G_service` (yönlü, zamana bağımlı)

- `line_id`: T1, T2, T3, T4 ve Erkilet `scenario_line_id` birbirinden ayrılır.
- `route_pattern_id`: yön, varyant, servis sırasına göre hat güzergâhı.
- `route_stop`: `route_pattern_id`, `stop_id`, `stop_sequence`, `pickup`, `dropoff`; bir istasyonun tekrar ziyareti mümkün.
- `trip_id`: belli servis günündeki veya hizmet planındaki sefer örneği.
- `stop_event`: `trip_id`, `stop_id`, `stop_sequence`, `arrival_time`, `departure_time`, `event_status`.
- `service_calendar`: hafta içi/hafta sonu, tatil, istisna ve geçerlilik tarihleri.
- `vehicle` + `vehicle_assignment`: araç kimliği/kapasitesi/servis ataması (bilinmeyen veri `null`).
- `pattern_segment_use`: `route_pattern_id`, `segment_id`, kullanım yönü ve sıra; **sadece kanıt varsa** doldurulur.

GTFS Schedule'ın `stops`, `routes`, `trips`, `stop_times`, `shapes`, `calendar`, `frequencies` ve `transfers` ayrımıyla birlikte çalışabilecek bir **iç veri modeli** önerilir; GTFS kullanmak, veri olmadan konum/tarife üretmek demek değildir. `stop_times` saatleri 24:00:00'ı aşabilir: servis gününü kaybetme. [R06]

### 3.3. Durum ve olay katmanı

- `vehicle_observation`: gerçek konum/sapma olayları yalnızca lisanslı gerçek kaynaktan, `event_time_utc`, `received_at_utc`, `trip_id`, `vehicle_id`, `position`, `source_id` ile.
- `vehicle_sim_state`: model tarafından üretilen sonuç, `simulation_run_id`, `sim_time_s`, `vehicle_id`, `segment_id`, `offset_m`, `status` ile.
- `prediction`: tahmin/güven aralığı, varsayımlar ve model sürümüyle.
- `incident`: hat/segment/süre/etki, gözlem mi senaryo girdisi mi ayırt edilmiş.
- `scenario`: `scenario_id`, `base_dataset_version`, `changes`, `parameter_set`, `assumption_list`, `created_at`.

**Zaman ayrımı:** `observed_at`, `ingested_at`, `effective_from`, `effective_to`, `simulation_time` farklı alanlardır. Tüm gerçek olay zamanlarını UTC sakla; UI'da `Europe/Istanbul` (veya Python'da `Asia/Istanbul`) olarak göster. GTFS servis saati/servis günü dönüşümü ayrı işlenir.

### 3.4. Kanonik kaynak/kalite alanları (her kritik kayda)

`source_id`, `source_url`, `retrieved_at`, `published_at` (varsa), `effective_from/to` (varsa), `license_or_reuse`, `evidence_status`, `geometry_confidence`, `dataset_version`, `last_reviewed_at`. İzin verilen statüler: `verified`, `derived`, `assumed`, `scenario`, `unknown`, `synthetic` (synthetic yalnızca sentetik veri ve simülasyon çıktısında). `verified` demek kaynak iddiasının doğrulandığı anlamına gelir, model tahmininin gerçek gözlem olduğu anlamına **gelmez**.

### 3.5. Veri kontratı örneği (temsili, Kayseri gerçeği değildir)

```json
{
  "segment_id": "EXAMPLE-SEGMENT-001",
  "from_node_id": "EXAMPLE-NODE-A",
  "to_node_id": "EXAMPLE-NODE-B",
  "physical_track_id": null,
  "directionality": "unknown",
  "geometry": null,
  "length_m": null,
  "source_id": null,
  "evidence_status": "synthetic",
  "scope": "demo_only"
}
```

**Önemli:** Bu şema yalnızca tip ve doğrulama örneği; Kayseri haritasında bu segment yer almamalı.

## 4. Veri alma, doğrulama ve coğrafi doğruluk

### 4.1. Veri kaynakları ve kullanım sırası

1. Kayseri Ulaşım / Kayseri Büyükşehir Belediyesi'nin doğrulanabilir ve kullanım koşulu uygun durak/hat/tarife verileri.
2. Resmî GTFS, GIS/GeoJSON, onaylı plan paftası, tarife CSV/API (bulunabilirse).
3. OSM/OSM türevi ray geometrileri yalnızca uygun atıf, lisans ve manuel doğrulamayla. OSM çizimleri resmî sinyalizasyon/blok diyagramı değildir. ODbL gereklilikleri kontrol edilir. [R13]
4. Kullanıcı belgeleri ve araştırma çıktıları **kaynak tarihi ve belirsizliğiyle**.
5. Sentetik veri yalnızca `data/synthetic/` altında, gerçek veriyle karışmayacak biçimde.

### 4.2. Doğrulama / ETL

- Kaynağı **raw** sakla (lisans izin veriyorsa), `source_id` ve elde edildiği tarihle; işlenmiş dosyaları `processed` altında sürümle.
- Kalıcı ID: aynı adlı farklı durakları yanlış birleştirme; aynı durağı farklı hatlarda tekrar oluşturma. Çoklu istasyon-peron ayrımını koru.
- Her `route_stop` mevcut `stop_id` ve `route_pattern_id` ile eşleşmeli; sıra artmalı; bir seferin zamanları hizmet gününe göre tutarlı olmalı.
- `physical_segment` iki tanımlı düğüme bağlanmalı; topoloji rastgele koordinat yakınlığından türetilmemeli.
- GeoJSON RFC 7946 kullan: `Point` ve `LineString` koordinat sırası **[longitude, latitude]**; koordinat sistemi WGS84. Kayseri koordinatları eksikse `geometry: null`; örnek lat/lon uydurma. [R12]
- `source_url` yoksa veya kullanım lisansı bilinmiyorsa veriyi otomatik `verified` yapma; sorun raporu üret.
- Kayseri Ulaşım'a ait güncel gerçek zamanlı erişim, izin ve API **mevcut olduğu varsayılmaz**.

### 4.3. İki veri görünümü

- **Topology view:** Geometri hiç yoksa düğüm/kenar ilişki diyagramı *şematik* olarak gösterilebilir, ancak harita diye sunulamaz. Kayseri coğrafi koordinatlarına yerleştirilmiş gibi davranma.
- **Geographical view:** Yalnızca kaynaklı nokta/çizgi geometrileri render edilir. Senaryonun koordinatları yoksa beş waypoint listesi/boş katman ve 'Güzergâh geometrisi doğrulanmadı' uyarısı gösterilir.

## 5. Sistem mimarisi ve bileşen sınırları

```text
[Kaynaklar: resmî yayın / lisanslı GTFS / GeoJSON / CSV / API]
     |
     v
[Ingestion adapter] -> [Raw snapshot + provenance] -> [Validator]
                                                   |
                                                   v
                                       [Canonical dataset / SQLite]
                                                   |
                   +-------------------------------+------------------+
                   |                               |                  |
             [Network core]               [Schedule engine]   [Scenario registry]
                   |                               |                  |
                   +-------------------------------+------------------+
                                                   |
                           [Simulation engine / constraint checks]
                                                   |
                            [KPI service / optimizer / validation]
                                                   |
                     [Streamlit UI + PyDeck map + scenario controls]
                                                   |
                     [Results + metadata + source/quality panel]
```

- UI sadece görünüm katmanı; hesaplar `src/network`, `src/simulation`, `src/optimization` içinde.
- Her modül dış veri okumayı adaptörle sınırlar; testlerde ağ bağlantısına bağımlılık bulunmaz.
- Başlangıçta JSON/CSV + SQLite yeterlidir; PostgreSQL/PostGIS yalnızca doğrulanmış gereksinim ortaya çıkarsa eklenir.
- Ağ çekirdeğinde `networkx.MultiDiGraph`; `pandas` ETL; `pydantic` veya `dataclasses` girdi sözleşmeleri; çizim `streamlit` + `pydeck`. Bunlar öneridir; mevcut kod tabanı ve bağımlılıklar incelenerek karar verilir.
- Simülasyon motoru **UI'dan bağımsız**, kontrollü simulation clock ile çalışır. İlk sürüm deterministik olay/step simülasyonu; ortak kaynak yarışması karmaşıklaşırsa `SimPy`, mikroskobik ray etkileşimi gerekirse `SUMO/TraCI` eklenecek. SimPy olay tabanlı süreçler için; SUMO ray simülasyonunda sinyaller ve fiziksel bloklar için uygundur. [R07][R08][R11]
- SUMO eklenmesi **MVP'nin zorunlu koşulu değildir**. Bilinmeyen gerçek ray sinyallerini rastgele üretip fiziksel emniyet modellemesi iddiasına girme.

### 5.1. Önerilen modül ağacı (mevcut projeyle çakışıyorsa uyarlayın)

```text
src/
  app.py                     # UI composition only
  config.py                  # environment and simulation defaults
  schemas/                   # data contracts / validation
  ingestion/                 # CSV, GTFS, geojson, future realtime adapters
  network/                   # infrastructure graph, service graph, mapping
  schedule/                  # calendars, trips, GTFS times (>24h)
  simulation/                # clock, state, events, segment/resource allocator
  optimization/              # candidate headways, objective, constraints
  kpis/                      # punctuality, waiting, load, utilization
  visualization/             # map layers, data status, timeline
  provenance/                # evidence, snapshots, license, data quality
  scenarios/                 # baseline and what-if differences
  reports/                   # reproducible run reports
 tests/
  test_data_contracts.py
  test_topology.py
  test_timetables.py
  test_simulation.py
  test_headway.py
  test_scenario_isolation.py
  test_live_data_guardrails.py
```

## 6. Simülasyon motoru: hareketin mühendislik mantığı

### 6.1. Durum makinesi

`NOT_STARTED → DWELLING → EN_ROUTE → DWELLING → ... → TURNAROUND → COMPLETED` (ayrıca `DELAYED`, `BLOCKED`, `CANCELLED` durumları). Her değişiklik olay olarak kaydedilir: `sim_time_s`, `trip_id`, `vehicle_id`, `event_type`, `segment_id`, `source_scope='synthetic/simulation'`.

### 6.2. Hesaplanması gereken fiziksel/işletme ilişkileri

- Sefer planı: servis günü, yön, durak sırası, planlanan varış/kalkış.
- İstasyonda bekleme (*dwell*): veri varsa ölçülen; yoksa kullanıcı parametresi ve `assumed`.
- Segment seyahat süresi: doğrulanmış seyahat süresinden; yoksa simülasyon girdisi (ölçülmüş hızmış gibi gösterme).
- Turnaround: terminalde dönüş ve minimum bekleme, iki yönlü çevrim süresi.
- Kaynak işgali: ortak **fiziksel** kesim üzerindeki `occupation_start/end`, sinyal/blok ayrıntıları varsa ilgili emniyet ayırımları.
- Paylaşılan kesimde iki tramvayın aynı anda yer alıp alamayacağı, **doğrulanmış kapasite/işletme kuralına bağlıdır**. Bilinmiyorsa tek bir hayalî kuralı 'gerçek fizik' gibi uygulama; duyarlılık analizindeki varsayım olarak etiketle.
- Yolcu kapasitesi: `vehicle_capacity` ve istasyona göre talepler gerçek/sentetik etiketiyle.
- Rastgele bozulmalar: tek `seed`, yeniden üretilebilir dağılımlar; başlangıçta kapalı.

### 6.3. Görselleştirme kuralları

- **Gözlem:** gerçek kaynaktan gelen araç noktası; alınan güncellik/zaman görünür.
- **Simülasyon:** yalnızca doğrulanmış geometri üzerinde hareket ediyorsa tramvay simgesi o geometri üzerinde oynatılır; aksi halde *şematik hareket* veya tabloda olay akışı.
- **Tahmin:** gerçek konum veya simülasyonla asla aynı renk/etiket kullanılmaz.
- Kullanıcı hızlandırabilir (1x, 5x, 20x), durdurabilir, zaman seçebilir; `simulation_time != wall_clock` açıkça görünür.

## 7. Headway optimizasyonu: gerekli matematik ve kısıtlar

### 7.1. Değişkenler

`h_l(t)` hat `l` için dönem `t` headway (saniye); `n_l` hatta ayrılan tamsayı araç sayısı; `C_l` araç kapasitesi; `D_l(t)` yolcu talebi (kişi/saat, doğrulanmış veya senaryo); `T_cycle,l` gidiş+dönüş+dönüş beklemesi; `o_s(t)` fiziksel segment işgali; `b_s(t)` izinli blok/slot kapasitesi (varsa).

### 7.2. Temel hesap (kısıtsız ilk referans)

- Yaklaşık araç sayısı: `n_l >= ceil(T_cycle,l / h_l)` (çevrim ve headway aynı birimde; ek yedek araç gereksinimi ayrı).
- Yaklaşık hizmet kapasitesi (kişi/saat/yön): `capacity_l = C_l * 3600 / h_l` (araç doluluk eşiği ayrıca uygulanır).
- **Yalnızca düzenli sıklıkta, bağımsız/rastgele varışlı yolcular için** beklenen bekleme `E[W] ≈ h/2`. Bu bir varsayım; gecikme/bunching varsa tek başına yeterli değildir. ABD Federal Transit Administration bunu rastgele yolcu gelişi varsayımı altında açıklar. [R17]
- Talep verisi yoksa gerçek bekleme, talep karşılanma veya optimum headway sayısı **hesaplandı iddiasında bulunma**; duyarlılık/örnek senaryo üret.

### 7.3. Optimizasyon şeması

Kandidat headway seti seç (örneğin yapılandırılabilir farklı dakika değerleri; varsayılanları gerçek tarife gibi göstermeden), her kombinasyon için `fleet`, `peak_load`, `capacity_violation`, `shared_segment_conflict`, `average_wait`, `lateness` metrikleri hesapla.

İlk sürüm: `score = w_wait*normalized_wait + w_fleet*normalized_fleet + w_delay*normalized_delay + w_overload*normalized_overload` **yalnızca sert kısıtları sağlayan adaylar üzerinde**. Ağırlıklar kullanıcı tarafından açıkça seçilir; ölçülü veri olmadığında bunlar operasyonel doğruluk iddiası değildir.

**Sert kısıtlar:**

1. `h_min <= h_l <= h_max`, `h_l > 0`.
2. `sum(n_l) <= total_available_fleet` yalnızca toplam filo **biliniyorsa**; değilse filo gereksinimini raporla, uygulanabilirlik iddiasında bulunma.
3. Talep gözlenmişse `peak_boarding_demand <= effective_service_capacity` (ilgili yön ve dönem).
4. Ortak segment kapasitesi/çakışma kontrolleri yalnızca gerçek veya açık senaryo varsayımıyla kurulursa `o_s(t)` doğrulanır.
5. Aktarmaların minimum bağlantı süreleri veri varsa uygulanır.

**Çıktı:** Her öneride baseline karşılaştırması, headway, gereken araç, bekleme süresi varsayımı, aşırı doluluk, ortak segment etkisi, belirsizlik, veri kaynakları, model sürümü.

### 7.4. Senaryo setleri

- `baseline_existing`: yalnızca doğrulanmış mevcut ağ/veriler.
- `baseline_synthetic`: yalnızca tam tanımlı **hayalî örnek** test ağı; Kayseri gerçek veri analizi sayılmaz.
- `erkilet_concept_v1`: kullanıcı 5 waypoint'li konsept; belirsiz geometri ve aktarma noktası var; bu durumda **sayısal işletme optimizasyonu bloke edilir** veya varsayım senaryosu olarak ayrı raporlanır.
- `event_disruption_demo`: tek hat/segment kapanması veya yoğun talep varsayımı; gerçek olay gibi sunulmaz.

### 7.5. Doğrulama ve kalibrasyon

1. **Kod doğrulama:** İnvariantlar, edge-case testleri, tutarlılık ve yeniden üretilebilirlik.
2. **Veri doğrulama:** Bağımsız kaynak/operatör referansı varsa hat-durak/seyahat zamanı karşılaştırması.
3. **Kalibrasyon:** Gerçek gözlem verisi erişildiğinde durak bekleme, seyahat ve gecikme dağılımlarını uyarla; önce/sonra hata metriklerini sakla.
4. **Duyarlılık:** Talep ±X%, dwell ±Y%, filo değişiklikleri için çıktı aralığı; X/Y senaryo parametresi, gerçek değer iddiası değil.
5. **İddia disiplini:** Kalibre edilmemiş model sonuçlarına 'tahmin/öneri' yaz; 'doğru saha sonucu' deme.

## 8. Gerçek zamanlı eşleme: GELECEK AŞAMA

- Öncelikle **yetkili GTFS-Realtime veya operatör API'si** var mı, erişim izni ve kullanım şartları nedir araştır.
- GTFS-Realtime `TripUpdate`, `VehiclePosition` ve `Alert` tiplerini barındırır; araç pozisyonu bir seferle eşleştirilir. [R09]
- Feed timestamp + tekil araç ölçüm timestamp'ini ayrı değerlendir; timestamp'siz 'canlı' ibaresi kullanma.
- GTFS-Realtime en iyi uygulamaları 30 saniyede bir güncellemeyi ve çoğu araç konum/sefer güncellemesinin 90 saniyeden eski olmamasını önerir. **Bunlar GTFS üreticileri için best practice**; Kayseri için mevcut performans iddiası değildir. Projede `freshness_threshold` yapılandırılabilir olmalıdır. [R10]
- Kayıt gecikirse gösterim `stale`; veri yoksa `unavailable`, sistem canlı durumdaymış gibi kesintisiz animasyon sürdürme.
- Gerçek veri adapter'ı `fetch()` → `validate()` → `normalize()` → `merge_state()` hattında çalışır; yetkisiz scraping ve gizli uç nokta yoktur.
- Gerçek saha sistemlerine herhangi bir yazma/kontrol komutu gönderilmez; sistem **read-only**.

## 9. UI/UX: Dijital ikiz kontrol paneli için kabul şartnamesi

**A — Durum çubuğu:** `Veri modu` (STATİK / SİMÜLASYON / GECİKMELİ / CANLI), `son kaynak güncelleme`, `simülasyon tarihi ve saati`, `veri sürümü`, `kullanılan senaryo` ve uyarı sayısı.

**B — Ana harita:** Mevcut T1–T4 hatları ayrı, Erkilet **kesik/konsept** stil; gerçek ray geometri bilgisi yoksa 'coğrafi güzergâh doğrulanmadı' kartı. İstasyon, hat, fiziksel segment, aktarma, veri belirsizliği katmanları. Üzerine tıklanınca ID, kaynak, tarih, doğruluk, geçiş ilişkileri.

**C — Zaman kontrolü:** `Pause / Play`, hız, tarih, saat, `Replay/Scenario` seçici. Gerçek sistem saati ve simülasyon saati karışmamalı.

**D — KPI panelleri:** planlanan/sembolik sefer sayısı, aktif simüle tramvay, ortalama bekleme (varsayıma bağlı), gereken araç sayısı, ortak segment kullanım yoğunluğu, kapasite ihlali, sefer gecikmesi, belirsizlik. Hesaplanamayan KPI `N/A + neden` gösterir; **0 yazma**.

**E — Senaryo karşılaştırma:** Mevcut ağ vs Erkilet ekli; hangi farklar hesaplanabilir, hangileri veri eksikliği nedeniyle hesaplanamaz göster. Baseline ve değişikliklerin parametreleri kaydedilsin.

**F — Kaynak ve kalite:** Hattın/durağın/hesabın verisi nereden geliyor? Kayıt ID, URL, tarih, lisans ve durum göster.

**G — En küçük ilk uygulama:** Veri kalitesi kontrolü + katman seçici + boş ama doğru harita state'i + örnek şematik simülasyon + test paneli. Daha sonra doğrulanmış coğrafi hat/veriler geldikçe işlevler açılır.

## 10. Kalite, güvenlik, performans ve sürümleme

- Girdi doğrula: JSON schema / pydantic, yabancı anahtar, lat/lon aralıkları, tarih ve servis günü, pozitif headway/kapasite, durum statüsü.
- Test verisi üretim ekranında yanlışlıkla gerçek diye sunulmasın; `data/synthetic` ayrı tutulur, `scope='demo_only'` zorunlu.
- API anahtarları `.env` içinde, repoya eklenmez; loglara sır/token basılmaz.
- Ağ çağrıları timeout ve kontrollü hata ile; internet yokken testler ve sentetik/yerel görüntüleme çalışabilmeli.
- Değiştirilemeyen ham veri snapshot'ı; normalleştirilmiş veri sürümü ve `sha256` checksum opsiyonel; analitik koşusuna input sürümleri yazılır.
- Başlangıç optimizasyonunda güvenli, denetlenebilir ve deterministik **grid search** tercih edilebilir; sonra gerekirse MILP/ayrık olay/SimPy/SUMO.
- Her feature için performans hedefini ölç: örnek referans veri kümesi sabitlenince dashboard açılış süresi, simülasyon yürütme süresi ve bellek tüketimi kayıt altına alınır. Henüz ölçülmemiş sayısal SLA vaat etme.
- Erişilebilir renk ve yazılı etiket, renk körlüğüne duyarlı görselleştirme; veri modları yalnız renkle ayrılmasın.

## 11. Test kontratı: uygulanmadan 'bitti' denmeyecek

Aşağıdaki testlerin her biri gerçek kodla eklenmeli ve çalıştırılmalıdır:

| Test ID | Kontrol | Beklenen |
|---|---|---|
| DT-T01 | İki hat aynı istasyona uğruyor fakat fiziksel segment ilişkisi yok | 'Paylaşılan ray' olarak işaretlenmez |
| DT-T02 | İki yön aynı `physical_track_id` kaynak sınırlamasına tabi | Aynı fiziksel ray kapasitesi çifte sayılmaz |
| DT-T03 | Koordinatları `null` Erkilet waypoint'i | Haritada uydurma polylines/marker yok; liste ve uyarı var |
| DT-T04 | Sadece sentetik seferler varken 'live' moda geçiş | `live` reddedilir; UI 'Simülasyon' gösterir |
| DT-T05 | Aynı scenario + seed + input data/version | Aynı deterministik sonuçlar |
| DT-T06 | GTFS servis günü 25:10:00 | Sonraki takvim günü, doğru servis gününe bağlı |
| DT-T07 | Yetersiz/negatif `headway` veya kapasite | Anlaşılır doğrulama hatası |
| DT-T08 | Araç kapasitesi/fleet gerçek verisi `null` | Optimum iddiası yok; kısıt sonuçları 'hesaplanamadı' |
| DT-T09 | 2 ayrı `scenario_id` | Baseline verisini değiştirmeden farklı çıktılar |
| DT-T10 | Gecikmiş (> ayarlı threshold) gerçek feed | `stale` etiketi, 'canlı' göstergesi kapalı |
| DT-T11 | Yanlış koordinat aralığı, biçimi veya kaynağıyla doğrulanmayan eksen sırası | Aralık/biçim hatası yakalanır; iki eksen de sayısal olarak geçerliyse sıranın doğruluğu yalnızca kaynaktan teyit edilir, otomatik tahmin edilmez |
| DT-T12 | Hat geometrisi yok | UI çökmez, eksik veri uyarısı verir |
| DT-T13 | Veri kaynağı/tarihi eksik iddia | `verified` statüsüne terfi ettirilmez |
| DT-T14 | Baseline vs Erkilet | Gerçek durum ve konsept senaryo ayrımı korunur |
| DT-T15 | `h/2` bekleme hesabı | Yalnız uygun dağılım varsayımı etiketlenirse sonuç üretilir |
| DT-T16 | Üst üste iki tren aynı fiziksel blokta | Etkin varsayımsal blok kapasitesi kuralına göre çakışma raporu |

**Test Agent** gerçek komutu, çalışma ortamını, `pass/fail/skip`, hata açıklaması ve kalan riskleri `docs/10_test_report.md` içine yazar. Sadece örnek JSON testi geçmişse 'dijital ikiz testleri geçti' denmez.

## 12. Uygulama sırası ve Definition of Done

### Aşama P0 — Temel kanıt ve veri modeli (ilk sprint)

- P0.1 Kaynak envanteri ve lisans kontrolü (`KRS-001`).
- P0.2 Fiziksel ray / hizmet / peron / transfer ayrımı ve şema (`KRS-002`).
- P0.3 Senaryo yönetimi ve kaynağı bilinmeyen veri için `null` kontratı (`KRS-003`).
- P0.4 Yeni **DT-001**: `data_status`, `temporal validity`, veri doğrulama raporu, sentetik veri sınırı.

### Aşama P1 — Doğrulanabilir çalışan MVP

- P1.1 Harita + veri modları + şematik network fallback (`KRS-004`, doğrulanmış geo varsa).
- P1.2 Zaman çizelgesi ve servis günü/GTFS uyumlu trip modeli (`KRS-005`).
- P1.3 Deterministik replay ve simulation state machine (`KRS-006`).
- P1.4 `baseline_existing` ve `erkilet_concept_v1` ayrı senaryo compare UI.

### Aşama P2 — İşletme ve optimizasyon

- P2.1 Ortak kesim işgali/çatışma modeli: eksik kurallar açıkça parametre.
- P2.2 Kullanıcı tarafından verilen filo/talep/dwell parametreleri ile headway aday taraması (`KRS-007`).
- P2.3 Duyarlılık/sonuç raporu; `calibrated=false` etiketi.

### Aşama P3 — Veri bağlantısı ve doğruluk artışı

- P3.1 Gerçek zamanlı veri API'si/izin değerlendirmesi.
- P3.2 GTFS-RT/kuruma özgü *read-only adapter*, stale detection, provenance.
- P3.3 Gözlemle karşılaştırma, kalibrasyon ve belirsizlik ölçümü.
- P3.4 Gerekli veri ve gerekçeyle SUMO/TraCI entegrasyonu.

**Bir görevin bitti sayılması (DoD):** (i) kod küçük modüllerde ve mevcut repo ile uyumlu; (ii) veri modları yanlış temsil edilmiyor; (iii) doğrulama + testler gerçekten çalıştırıldı; (iv) kaynak/varsayımlar izlenebilir; (v) uygulama çalıştırma komutu ve olası eksik veri belirtilmiş; (vi) `docs/09_progress.md` ve test raporu güncellenmiş.

## 13. OpenCode agent'larına özel talimatlar

### Research Agent

- Önce Kayseri T1–T4 durakları, doğru sıra, fiziksel ortak rayın kanıtı, sefer günü/geçerlilik, veri lisansı, gerçek zamanlı API erişimi bulunabilir mi araştır.
- 2 ayrı kaynağı karşılaştırabiliyorsan çelişkileri sakla; bir PDF şemasından koordinat çıkarma.
- `docs/02_research.md` ve `docs/03_sources.md` güncelle; ülke/kurum/operatör kaynaklarını proje varsayımından ayır.

### Architect Agent

- Bu şartnamenin §§1–12 bölümlerini referans alarak veri/temporal/işletme grafını tasarla.
- Aşamalara böl, her aşama için tek görev/kabul kriteri/test durumu üret. Varsayımları `docs/08_decisions.md` kaydet.
- Aynı adlı istasyon/segment ortaklığı karışmasın; canlı ve simülasyon durumu ayrı API olsun.

### Coding Agent

- **Kod yazmadan önce:** Bu belgenin §§0, 3, 4, 5, 6, 9, 11'ini ve göreve ilgili diğer bölümleri oku; `docs/07_tasks.md` içindeki tek görev ID'sini belirle.
- `src/app.py` tek dosyada tüm iş mantığını barındırmasın; servisler ve hesaplama fonksiyonları ayrı olsun.
- `no live feed` durumunda M1 demo bile gerçek güncel araç konumu gibi gösterilmesin. Kayseri durak/hat/segmentlerini uydurma.
- Eksik veri yüzünden gerçek simülasyon mümkün değilse sahte sonuca zorlamak yerine sağlam model + doğrulama + sentetik *ayrı* demo oluştur.
- Kullanıcı izni olmadan dosya silme, git push, deployment yapma; ilgili testleri çalıştır.

### Test Agent

- Yukarıdaki DT-T01…DT-T16 listesinden ilgili göreve karşılık gelen testleri yaz ve gerçekten çalıştır.
- Kaynak ve durum etiketi doğruluğunu, hata durumunda güvenli davranışı, hesaplanamayan KPI'ların sıfır yazılmamasını kontrol et.
- Başarısız testi gizleme; üretim kodunu kendin değiştirme.

## 14. OpenCode'un ilk çalıştırma isteği (kopyala-yapıştır)

```text
AGENTS.md ve docs/11_digital_twin_engineering_spec.md dosyalarını öncelikli kaynak kabul et. Önce docs/01_scope.md, docs/05_data_dictionary.md, docs/06_architecture.md ve docs/07_tasks.md dosyalarını da gözden geçir.

Hedef: Kayseri Raylı Sistem Dijital İkizi için M0+M1 mimarisini kurmak; harita animasyonunu canlı dijital ikizmiş gibi göstermemek. Mimari şartnamenin §§0, 3, 4, 5, 6, 9 ve 11'ine uymak zorunlu.

İLK İŞ OLARAK yalnızca DT-001 görevini planla: fiziksel ray grafı, hizmet grafı, senaryo veri sözleşmeleri, doğrulanmış/sentetik veri ayrımı ve bu sözleşmelerin testleri. Gerçek koordinat, tarifeler veya gerçek zamanlı veri uydurma. Önce repo yapısını incele; mevcut kodu silme. Net bir atomik planı docs/07_tasks.md içine ekle; gerekiyorsa docs/05_data_dictionary.md ve docs/06_architecture.md dosyalarını güncelle. Ardından tek görev için kodlamaya geç ve testleri çalıştır.

Daha sonra gerçek veri doğrulandığında haritayı ve tramvay hareketi simülasyonunu ayrı görevlerde geliştir. Yapılan/çalıştırılan testleri ve blokajları raporla.
```

## 15. Yabancı/uluslararası referanslar (birincil kaynaklar)

> Erişim / referans kontrol tarihi: **2026-11-09**. Linkler araştırma başlangıç ve doğrulama kaynaklarıdır. Kayseri'ye ait gerçek zamanlı veri kaynağını **kanıtlamazlar**.

- **[R01]** Digital Twin Consortium, *Definition of a Digital Twin*. https://www.digitaltwinconsortium.org/initiatives/the-definition-of-a-digital-twin/
- **[R02]** ISO/IEC 30173:2023, *Digital twin — Concepts and terminology* (ISO abstract). https://www.iso.org/standard/81442.html
- **[R03]** NIST IR 8356 (Feb 2025), *Security and Trust Considerations for Digital Twin Technology*. https://csrc.nist.gov/pubs/ir/8356/final
- **[R04]** Network Rail, *Timetable performance and simulation*. https://www.networkrail.co.uk/industry-and-commercial/the-timetable/timetable-performance-and-simulation/
- **[R05]** railML.org, *Infrastructure* (topology, railway network graph). https://www.railml.org/en/subschemas/infrastructure
- **[R06]** GTFS, *Schedule Reference*, revised 2026-04-27. https://gtfs.org/documentation/schedule/reference/
- **[R07]** SUMO, *Railways* (rail edges, signals, bidirectionality, rail capacity). https://sumo.dlr.de/docs/Simulation/Railways.html
- **[R08]** SUMO, *Public Transport* (schedules, importing GTFS, vehicles). https://sumo.dlr.de/userdoc/Simulation/Public_Transport.html
- **[R09]** GTFS, *Realtime Reference* (trip updates, vehicle position, feed timestamp). https://gtfs.org/documentation/realtime/reference/
- **[R10]** GTFS, *Realtime Best Practices* (freshness and update intervals). https://gtfs.org/documentation/realtime/realtime-best-practices/
- **[R11]** SimPy, *Discrete event simulation for Python*. https://simpy.readthedocs.io/en/latest/
- **[R12]** IETF RFC 7946, *The GeoJSON Format*. https://datatracker.ietf.org/doc/html/rfc7946
- **[R13]** OpenStreetMap Foundation, *Copyright and License* (ODbL attribution). https://www.openstreetmap.org/copyright
- **[R14]** railML.org, *Timetable* (schedules and services). https://www.railml.org/en/subschemas/timetable
- **[R15]** SUMO, *Interfacing TraCI from Python*. https://sumo.dlr.de/docs/TraCI/Interfacing_TraCI_from_Python.html
- **[R16]** OpenCode, *Project Instructions* (`AGENTS.md`, `instructions`). https://opencode.ai/docs/instructions/
- **[R17]** US Federal Transit Administration, *Metro Rapid Demonstration Program Evaluation, Appendix B: Service Quality Analysis* (half-headway assumption and bunching). https://www.transit.dot.gov/research-innovation/metro-rapid-demonstration-program-evaluation-report-appendix-b-service-quality

---

**Not:** Uluslararası standartlar, karşılaştırma ve tasarım ilkeleri verir; bunlar Kayseri Ulaşım'ın mevcut sisteminin bir parçası olduklarını kanıtlamaz. Eksik resmî veri bulunması, hayalî harita geometrisi veya hayalî 'anlık takip' üretilmesini haklı çıkarmaz.
