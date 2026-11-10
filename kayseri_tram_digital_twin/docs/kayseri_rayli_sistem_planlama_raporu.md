# Kayseri Raylı Sistem Ağı (Kayseray) Dijital İkiz Mühendislik Raporu ve Akademik Planlama Parametreleri

## 1. Giriş ve Proje Mimarisi

Bu çalışma, **Kayseri Büyükşehir Belediyesi (KBB)** ve **Kayseri Ulaşım A.Ş.** tarafından işletilen 4 aktif hafif raylı sistem hattı (**T1, T2, T3, T4**) ile yapımı planlanan **6. Aşama Erkilet – Cumhuriyet Meydanı – Millet Bahçesi Raylı Sistem Hattı (T5)** için uluslararası standartlara (Digital Twin Consortium DTC, ISO/IEC 30173, TCRP Report 100, UITP) dayalı bir **3D Dijital İkiz ve Operasyonel Simülasyon Platformu** kurgusudur.

Platform, İsveç Stockholm Metro Twin (`https://metro-digitaltwin.netlify.app/`) referans alınarak; **Three.js WebGL tabanlı 3 boyutlu hat/istasyon/tren görselleştirmesi**, **zamana bağlı dinamik sefer enterpolatörü**, **arıza/kaza/bakım simülatörü** ve **Erkilet yeni hat parametrik karar destek laboratuvarı** olmak üzere 4 ana eksende inşa edilmiştir.

---

## 2. Raylı Sistemlerde Karşılaşılan Arıza ve Hata Türleri (Literatür Taraması ve Sistemik Etkileri)

Kentsel raylı sistemlerde karşılaşılan arıza ve kesintiler, IEEE, Transportation Research Board (TRB) ve UITP vaka analizlerine göre beş temel kategoride sınıflandırılır:

### 2.1. Enerji ve Katener Arızaları (Power & Catenary Failures)
- **Olay Tanımı:** 750 V DC havai katener hattında gerilim düşümü, pantoğraf takılması/kırılması, trafo merkezi aşırı akım açması veya fider kesicisi arızası.
- **Kayseray Altyapı Bağlamı:** Ağda 22 adet hat üstü + 1 adet depo olmak üzere toplam **23 adet trafo merkezi** bulunmaktadır.
- **Sistemsel Etki Mekanizması:** Arızalı bölgedeki ray kesiminde cer gücü sıfırlanır. Bölgedeki tüm tramvaylar durur.
  - *İşletme Müdahalesi:* İlgili alt besleme bölgesi izole edilir; arkadaki trenler en yakın kruvazman/makas noktasından (ağda 14 kruvazman ve 76 ana hat makası mevcuttur) geri döndürülür (short-turning); kesintiye uğrayan duraklar arasına acil otobüs ring seferi (bus bridging) konur.
  - *Tipik Çözüm Süresi (MTTR):* 30 – 60 dakika.

### 2.2. Makas ve Altyapı Kilitlenme Hataları (Track Switch & Interlocking Failures)
- **Olay Tanımı:** Makas dillerinin mekanik olarak kilitlenememesi, yabancı cisim sıkışması veya pozisyon algılama sensörünün arızalanması.
- **Kayseray Altyapı Bağlamı:** En kritik nokta, `STN_76 Makas Bölgesi` (Cumhuriyet Meydanı batısındaki kuyruk/manevra hattı) ve `STN_24 Tuna Kavşağı`dır. T2 ve T4 trenlerinin tamamı Cumhuriyet Meydanı batısındaki bu makasta kafa değiştirmektedir.
- **Sistemsel Etki Mekanizması:** Makas kilitlenemezse T2 ve T4 trenleri manevra yapamaz; Cumhuriyet Meydanı peronunda tren kuyruğu (train bunching) oluşur; T1 ve T3 trenlerinin merkez koridordaki geçişleri de kilitlenir.
  - *Tipik Çözüm Süresi (MTTR):* 15 – 35 dakika.

### 2.3. Sinyalizasyon ve Otomatik Tren Koruma (ATP) Arızaları
- **Olay Tanımı:** Ray devresi (track circuit) sahte meşguliyet bildirimi, aks sayıcı arızası veya sinyal feneri sönmesi.
- **Sistemsel Etki Mekanizması:** Güvenlik gereği "Fail-Safe" prensibi devreye girer; ilgili blok kırmızıya döner. Tramvaylar otomatik emniyet freni yapar. Sürücülü işletmede "Görüşle Seyir Modu" (15 km/sa kısıtı) uygulanır, hat kapasitesi %60 düşer.
  - *Tipik Çözüm Süresi (MTTR):* 20 – 40 dakika.

### 2.4. Araç ve Yolcu Kaynaklı Gecikmeler (Rolling Stock & Passenger Induced Delays)
- **Olay Tanımı:** Aşırı kalabalık pik saatlerde kapı fotosellerinin engellenmesi, yolcu iniş-binişinin uzaması, acil imdat kolunun çekilmesi.
- **Sistemsel Etki Mekanizması:** Planlanan 25 saniyelik durak bekleme süresi (dwell time) 90-180 saniyeye fırlar. Arkadan gelen tramvaylar blok mesafesinde durmak zorunda kalır; bu duruma literatürde **Zincirleme Gecikme Dalgalanması (Knock-on Delay)** adı verilir.

### 2.5. Ray Aşınması, Pantoğraf ve Tekerlek Bakım İhtiyaçları
- **Aşınma Takibi:** Tramvay tekerlekleri ray sürtünmesi nedeniyle konikliğini ve profilini kaybeder (flange wear). 80 araçlık filoda tekerlek profilleri tornalanmazsa (wheel truing) virajlarda ray gıcırtısı ve derayman (raydan çıkma) riski artar.
- **Dijital İkiz İzlemesi:** Her aracın kat ettiği toplam km (yıllık filo ortalaması ~92.500 km/araç), tekerlek aşınma indeksi (%), pantoğraf karbon kömür kalınlığı ve motor sıcaklığı telemetri kartında dinamik izlenir.

---

## 3. Yeni Tramvay Hattı Kurulurken Dikkate Alınacak Akademik Değişkenler ve Formülasyonlar

Toplu taşıma planlama literatüründen (Vukan R. Vuchic - *Urban Transit: Systems and Technology*, TCRP Report 100, Ceder - *Public Transit Planning and Operation*) derlenen temel parametreler:

### 3.1. Sefer Sıklığı (Headway - $H$) ve Frekans ($f$)
$$\text{Headway (dakika)}: H = \frac{60}{f}$$
- **Açıklama:** Belirli bir yönde ardışık iki tramvayın aynı durağa varışları arasındaki zaman aralığı.
- **Planlama Kararı:** Pik saatlerde yolcu bekleme süresini düşürmek için $H \le 8\text{ dk}$ seçilir; ancak $H$'nin düşmesi filodaki tren ihtiyacını artırır.

### 3.2. Hat Çevrim Süresi (Cycle Time - $T_{\text{cycle}}$)
$$T_{\text{cycle}} = T_{\text{outbound}} + T_{\text{inbound}} + t_{\text{layover,origin}} + t_{\text{layover,dest}}$$
- $T_{\text{outbound}}, T_{\text{inbound}}$: Gidiş ve dönüş seyir süreleri (dakika).
- $t_{\text{layover}}$: Terminal son duraklarında sürücü dinlenme, rota hazırlığı ve gecikme tamponu (buffer time, genelde tek yön seyahat süresinin %10-15'i veya minimum 5-6 dakika).

### 3.3. Gerekli Filo Büyüklüğü (Fleet Size - $N_{\text{fleet}}$)
$$N_{\text{active}} = \left\lceil \frac{T_{\text{cycle}}}{H} \right\rceil, \quad N_{\text{fleet}} = \left\lceil N_{\text{active}} \times (1 + \alpha_{\text{reserve}}) \right\rceil$$
- $\alpha_{\text{reserve}}$: Periyodik bakım, onarım ve arıza yedek payı (Uluslararası standart: $\%12 - \%15$).
- **Örnek Erkilet Hesabı:** $T_{\text{cycle}} = 88\text{ dk}$, $H = 8\text{ dk} \implies N_{\text{active}} = 11\text{ tren dizi}$, $\%15$ rezervle $N_{\text{fleet}} = 13\text{ tren}$ gerekir.

### 3.4. Durak Bekleme Süresi (Dwell Time - $t_{\text{dwell}}$)
$$t_{\text{dwell}} = t_{\text{fixed}} + \max \left( \frac{\beta_{\text{board}} \cdot P_{\text{board}}}{N_{\text{doors}}}, \frac{\beta_{\text{alight}} \cdot P_{\text{alight}}}{N_{\text{doors}}} \right)$$
- $t_{\text{fixed}}$: Kapı açılma/kapanma ve fren çözme sabit süresi (~8-12 sn).
- $N_{\text{doors}}$: Tramvaydaki kapı sayısı (Bozankaya araçlarında çift taraflı geniş çift kanatlı kapılar).
- Seviyeli hemzemin peronlarda yolcu başına geçiş süresi $\beta \approx 1,0 - 1,4\text{ saniye/kişi}$dir.

### 3.5. Ticari İşletme Hızı (Commercial / Operating Speed - $V_{\text{comm}}$)
$$V_{\text{comm}} = \frac{L_{\text{route}}}{\sum t_{\text{run}} + \sum t_{\text{dwell}} + \sum t_{\text{signal\_delay}}}$$
- Yüzey trafiğiyle karışık caddelerde $V_{\text{comm}} \approx 18 - 20\text{ km/sa}$ iken, Erkilet projesindeki gibi **4 km'lik yer altı tünel kesimi** ve öncelikli sinyalizasyonla $V_{\text{comm}} \approx 28 - 32\text{ km/sa}$ seviyesine çıkar.

### 3.6. Ortalama Yolcu Bekleme Süresi ($E[W]$)
Düzenli sefer tarifelerinde ortalama bekleme süresi:
$$E[W] = \frac{H}{2} \times \left(1 + \frac{\sigma_H^2}{\mu_H^2}\right)$$
- Seferler tam vaktinde yapıldığında ($\sigma_H = 0$), $E[W] = H / 2$'dir. Örneğin 8 dakikalık headway'de ortalama bekleme 4 dakikadır.

### 3.7. Çevresel ve Enerji Tüketim Katsayıları
- Tramvay cer tüketimi: $2,8 - 3,2\text{ kWh / araç-km}$.
- Rejeneratif frenleme geri kazanımı: $\%25 - \%30$.
- Karbon azaltımı: Otomobilden raylı sisteme kayan her yolcu-km için net $\sim 115\text{ g CO}_2$ tasarrufu sağlanır.

---

## 4. T5 Erkilet Hattı Karşılaştırmalı Senaryo Analizi

| Parametre | **Senaryo A (Resmî KBB Koridoru)** | **Senaryo B (Doğrudan Sıralı Güzergâh)** |
| :--- | :--- | :--- |
| **Toplam Hat Uzunluğu** | 17,80 km (13,8 km Hemzemin + 4,0 km Tünel) | ~14,70 km (10,7 km Hemzemin + 4,0 km Tünel) |
| **Tünel & Yer Altı İstasyonu** | 4,00 km Tünel (4 Yer Altı İstasyonu) | ~4,00 km Tünel (3 Yer Altı İstasyonu) |
| **Toplam İstasyon Sayısı** | 19 İstasyon | 15 İstasyon |
| **Havalimanı Entegrasyonu** | Kılçık Kolu (~2,0 km şube hattı) | Ana Hat Üzerinde Doğrudan Geçiş |
| **Kumsmall AVM Bağlantısı** | T3 Hattı son durağının doğuya uzatılması (Var) | Yok |
| **Tek Yön Seyahat Süresi** | ~38 dakika (Kılçık aktarmasız ana hat) | ~32 dakika |
| **8 dk Headway İçin Filo** | 13 Tren Dizisi (11 aktif + 2 yedek) | 11 Tren Dizisi (9 aktif + 2 yedek) |
| **Günlük Taşıma Kapasitesi** | ~79.920 Yolcu/Gün | ~79.920 Yolcu/Gün |
| **Fizibilite / İhale Durumu** | Zemin etüdü ve ön fizibilite tamamlandı, AYGM onayında | Proje senaryo karşılaştırma modeli |
