/**
 * Kayseri Tramvay Dijital İkiz — Kullanıcı Arayüzü & İnteraktif Kontroller
 */

class TramUIController {
  constructor(engine, threeView) {
    this.engine = engine;
    this.threeView = threeView;
    this.selectedEntity = null; // { type: "train" | "station", data: {...} }

    this.bindDOM();
    this.bindEvents();
    this.renderInitialUI();

    // Motor her adım attığında arayüzü güncelle
    this.engine.onUpdate(() => this.updateUI());
  }

  bindDOM() {
    // Header
    this.simClockEl = document.getElementById("sim-clock");
    this.speedButtons = document.querySelectorAll(".speed-btn");
    this.cameraButtons = document.querySelectorAll(".camera-btn");
    this.dayTypeSelect = document.getElementById("day-type-select");

    // Sol Panel Metrikleri
    this.valTotalTrains = document.getElementById("val-total-trains");
    this.valCurrentPax = document.getElementById("val-current-pax");
    this.valLoadFactor = document.getElementById("val-load-factor");
    this.valPowerMw = document.getElementById("val-power-mw");
    this.linesContainer = document.getElementById("lines-container");

    // Sağ Panel (Inspector)
    this.inspectorContent = document.getElementById("inspector-content");

    // Alt Çekmece Sekmeleri
    this.tabButtons = document.querySelectorAll(".tab-btn");
    this.tabPanes = document.querySelectorAll(".tab-pane");

    // Arıza Yönetimi
    this.incidentSelect = document.getElementById("incident-type-select");
    this.stationSelect = document.getElementById("incident-station-select");
    this.btnTriggerIncident = document.getElementById("btn-trigger-incident");
    this.btnClearIncidents = document.getElementById("btn-clear-incidents");
    this.activeIncidentsBanner = document.getElementById("active-incidents-banner");

    // Erkilet What-If
    this.erkiletScenarioSelect = document.getElementById("erkilet-scenario-select");
    this.erkiletHeadwaySlider = document.getElementById("erkilet-headway-slider");
    this.erkiletHeadwayVal = document.getElementById("erkilet-headway-val");
    this.erkiletSpeedSlider = document.getElementById("erkilet-speed-slider");
    this.erkiletSpeedVal = document.getElementById("erkilet-speed-val");
    this.btnAddNewStation = document.getElementById("btn-add-new-station");

    // Erkilet Çıktı Metrikleri
    this.calcFleetSize = document.getElementById("calc-fleet-size");
    this.calcCycleTime = document.getElementById("calc-cycle-time");
    this.calcDailyCap = document.getElementById("calc-daily-cap");
    this.calcWaitTime = document.getElementById("calc-wait-time");
  }

  bindEvents() {
    // Zaman Hızı Butonları
    this.speedButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        this.speedButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.engine.timeScale = parseFloat(btn.dataset.speed);
      });
    });

    // Kamera Açı Butonları
    this.cameraButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        this.cameraButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.threeView.setCameraPreset(btn.dataset.preset);
      });
    });

    // Gün Tipi Seçimi
    if (this.dayTypeSelect) {
      this.dayTypeSelect.addEventListener("change", (e) => {
        this.engine.dayType = e.target.value;
      });
    }

    // Alt Çekmece Sekme Geçişleri
    this.tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        this.tabButtons.forEach(b => b.classList.remove("active"));
        this.tabPanes.forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const targetPane = document.getElementById(btn.dataset.tab);
        if (targetPane) targetPane.classList.add("active");
      });
    });

    // Arıza Tetikleme
    if (this.btnTriggerIncident) {
      this.btnTriggerIncident.addEventListener("click", () => {
        const catId = this.incidentSelect.value;
        const stnId = this.stationSelect.value;
        const inc = this.engine.triggerIncident(catId, stnId);
        // Kamerayı arıza noktasına odakla
        const stn = this.engine.stationMap[stnId];
        if (stn) {
          const worldPos = this.threeView.geoToWorld(stn.lat, stn.lon, 0);
          this.threeView.focusOnPosition(worldPos, 320);
        }
      });
    }

    if (this.btnClearIncidents) {
      this.btnClearIncidents.addEventListener("click", () => {
        this.engine.clearAllIncidents();
      });
    }

    // Erkilet What-If Kontrolleri
    if (this.erkiletScenarioSelect) {
      this.erkiletScenarioSelect.addEventListener("change", (e) => {
        this.engine.updateErkiletConfig({ scenario: e.target.value });
        this.updateErkiletCalculations();
      });
    }

    if (this.erkiletHeadwaySlider) {
      this.erkiletHeadwaySlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        this.erkiletHeadwayVal.innerText = `${val} dk`;
        this.engine.updateErkiletConfig({ headwayMinutes: val });
        this.updateErkiletCalculations();
      });
    }

    if (this.erkiletSpeedSlider) {
      this.erkiletSpeedSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        this.erkiletSpeedVal.innerText = `${val} km/sa`;
        this.engine.updateErkiletConfig({ commercialSpeed: val });
        this.updateErkiletCalculations();
      });
    }

    // Yeni İstasyon Ekleme
    if (this.btnAddNewStation) {
      this.btnAddNewStation.addEventListener("click", () => {
        const stnName = prompt("Yeni İstasyon Adını Girin:", "Erkilet Çevre Yolu / Yeni Mahalle");
        if (!stnName) return;
        // Erkilet Bulvarı aksında ortalama bir koordinat
        const lat = 38.7845 + (Math.random() - 0.5) * 0.01;
        const lon = 35.4715 + (Math.random() - 0.5) * 0.01;
        const newStn = this.engine.addCustomStationToErkilet(stnName, lat, lon, false);
        alert(`Yeni istasyon eklendi: ${newStn.name} (Koordinat: ${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        this.updateErkiletCalculations();
      });
    }
  }

  renderInitialUI() {
    // Hat Listesini Doldur
    this.linesContainer.innerHTML = "";
    this.engine.data.lines.forEach(line => {
      const isProposed = line.status === "PROPOSED";
      const div = document.createElement("div");
      div.className = "line-item";
      div.innerHTML = `
        <span class="line-pill" style="background-color: ${line.color}; color: ${line.color}"></span>
        <span class="line-name">${line.code} ${line.name.split("↔")[0].trim()}</span>
        <span class="line-badge">${line.length_km} km</span>
      `;
      this.linesContainer.appendChild(div);
    });

    // İstasyon Seçici Dropdown'ını Doldur
    if (this.stationSelect) {
      this.stationSelect.innerHTML = "";
      this.engine.data.stations.forEach(stn => {
        const opt = document.createElement("option");
        opt.value = stn.id;
        opt.innerText = `${stn.code} - ${stn.name}`;
        if (stn.id === "STN_19") opt.selected = true; // Varsayılan: Meydan
        this.stationSelect.appendChild(opt);
      });
    }

    // Arıza Kataloğunu Doldur
    if (this.incidentSelect) {
      this.incidentSelect.innerHTML = "";
      this.engine.data.incident_catalog.forEach(inc => {
        const opt = document.createElement("option");
        opt.value = inc.id;
        opt.innerText = `[${inc.severity}] ${inc.name}`;
        this.incidentSelect.appendChild(opt);
      });
    }

    // İlk Erkilet Hesaplamaları
    this.updateErkiletCalculations();

    // Varsayılan olarak T1-01 trenini seç
    if (this.engine.activeTrains.length > 0) {
      this.showEntityDetails("train", this.engine.activeTrains[0]);
    }
  }

  updateUI() {
    const metrics = this.engine.getSystemMetrics();

    // Saat
    if (this.simClockEl) {
      this.simClockEl.innerText = metrics.simTimeFormatted;
    }

    // Sol Panel
    if (this.valTotalTrains) this.valTotalTrains.innerText = metrics.totalTrains;
    if (this.valCurrentPax) this.valCurrentPax.innerText = metrics.totalCurrentPassengers.toLocaleString("tr-TR");
    if (this.valLoadFactor) this.valLoadFactor.innerText = `%${metrics.avgLoadFactorPct}`;
    if (this.valPowerMw) this.valPowerMw.innerText = `${metrics.totalPowerMw} MW`;

    // Aktif Arıza Banner'ı
    if (this.activeIncidentsBanner) {
      if (metrics.activeIncidentsCount > 0) {
        const inc = this.engine.activeIncidents[0];
        const remMin = Math.ceil(inc.remainingDurationSec / 60);
        this.activeIncidentsBanner.style.display = "flex";
        this.activeIncidentsBanner.innerHTML = `
          <span>⚠️ <strong>AKTİF ARIZA:</strong> ${inc.name} (${inc.stationName}) — Kalan Onarım: <strong>${remMin} dk</strong></span>
          <button class="action-btn danger" onclick="window.twinUI.engine.clearAllIncidents()">Onarımı Bitir</button>
        `;
      } else {
        this.activeIncidentsBanner.style.display = "none";
      }
    }

    // Seçili Nesne (Inspector) Bilgisini Canlı Güncelle
    if (this.selectedEntity && this.selectedEntity.type === "train") {
      const train = this.engine.activeTrains.find(t => t.id === this.selectedEntity.data.id);
      if (train) {
        this.showEntityDetails("train", train, false);
      }
    }
  }

  showEntityDetails(type, data, isNewSelection = true) {
    this.selectedEntity = { type, data };

    if (type === "train") {
      const loadColor = data.loadFactor > 85 ? "#ef4444" : data.loadFactor > 60 ? "#f59e0b" : "#00e676";
      const statusText = data.status === "BLOCKED" ? "🚨 ARIZA / BLOKE" : data.status === "DWELLING" ? "⏳ DURAKTA (Yolcu İndirme)" : "🟢 SEYİR HALİNDE";

      this.inspectorContent.innerHTML = `
        <div class="inspector-title">
          <span class="inspector-badge" style="background-color: ${data.color}; color: #fff">${data.lineCode}</span>
          <span class="inspector-name">${data.id} (${data.model.split("(")[0]})</span>
        </div>
        <div class="detail-row">
          <span>Güzergâh:</span>
          <span>${data.routeName}</span>
        </div>
        <div class="detail-row">
          <span>İşletme Durumu:</span>
          <span><strong>${statusText}</strong></span>
        </div>
        <div class="detail-row">
          <span>Anlık Hız:</span>
          <span>${Math.round(data.currentSpeedKmh)} km/sa (Maks: 80)</span>
        </div>
        <div class="detail-row">
          <span>Sonraki İstasyon:</span>
          <span>${data.nextStationName || "İstasyon Yaklaşımı"}</span>
        </div>
        <div class="detail-row">
          <span>Varış Süresi (ETA):</span>
          <span>${data.etaSeconds ? `${Math.round(data.etaSeconds)} sn` : "Peronda"}</span>
        </div>

        <div class="load-bar-wrap">
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span>Tahmini Yolcu: <strong>${data.passengers} / ${data.capacity}</strong></span>
            <span>Doluluk: <strong>%${data.loadFactor}</strong></span>
          </div>
          <div class="load-bar">
            <div class="load-bar-fill" style="width: ${data.loadFactor}%; background-color: ${loadColor};"></div>
          </div>
        </div>

        <div class="panel-header" style="margin-top: 10px;">ARAÇ SAĞLIK & TELEMETRİ</div>
        <div class="detail-row">
          <span>Katener Voltajı:</span>
          <span>${data.catenaryVoltage} V DC</span>
        </div>
        <div class="detail-row">
          <span>Anlık Cer Gücü:</span>
          <span>${data.powerKw} kW</span>
        </div>
        <div class="detail-row">
          <span>Tekerlek Aşınma Sağlığı:</span>
          <span>%${data.health.wheelWearPct} (İyi)</span>
        </div>
        <div class="detail-row">
          <span>Pantoğraf Durumu:</span>
          <span>${data.health.pantograph}</span>
        </div>
        <div class="detail-row">
          <span>Ağır Bakıma Kalan:</span>
          <span>${data.health.nextMaintenanceKm.toLocaleString()} km</span>
        </div>
        <div class="detail-row">
          <span>Motor Sıcaklığı:</span>
          <span>${data.health.temperatureC} °C</span>
        </div>
      `;
    } else if (type === "station") {
      const isHub = data.is_hub || data.type === "central_hub" || data.type === "transfer";
      this.inspectorContent.innerHTML = `
        <div class="inspector-title">
          <span class="inspector-badge">${data.code || "İST"}</span>
          <span class="inspector-name">${data.name}</span>
        </div>
        <div class="detail-row">
          <span>İlçe / Bölge:</span>
          <span>${data.district || "Kayseri"}</span>
        </div>
        <div class="detail-row">
          <span>İstasyon Tipi:</span>
          <span>${data.type === "terminal" ? "Terminal İstasyonu" : isHub ? "Ana Aktarma / Kesişim Hub" : "Standart Hat İstasyonu"}</span>
        </div>
        <div class="detail-row">
          <span>Hizmet Veren Hatlar:</span>
          <span><strong>${data.lines ? data.lines.join(", ") : "T1, T3"}</strong></span>
        </div>
        <div class="detail-row">
          <span>Altyapı Biçimi:</span>
          <span>${data.is_tunnel ? "Yer Altı Tünel İstasyonu (-18 m)" : "Hemzemin Çift Peron"}</span>
        </div>
        <div class="detail-row">
          <span>Günlük Beklenen Yolcu:</span>
          <span>${isHub ? "~22.000 - 35.000 kişi" : "~3.500 - 6.000 kişi"}</span>
        </div>
        <div class="panel-header" style="margin-top: 10px;">CANLI PERON TABELASI (YAKLAŞAN SEFERLER)</div>
        <table class="info-table">
          <thead>
            <tr><th>Hat</th><th>Yön</th><th>Kalan Süre</th></tr>
          </thead>
          <tbody>
            <tr><td><strong style="color:#ff3366">T1</strong></td><td>Organize Sanayi</td><td>3 dk (Gecikmesiz)</td></tr>
            <tr><td><strong style="color:#00e5ff">T3</strong></td><td>İldem 5</td><td>7 dk (Gecikmesiz)</td></tr>
            ${isHub ? `<tr><td><strong style="color:#00e676">T2</strong></td><td>Talas Cemil Baba</td><td>5 dk</td></tr>` : ""}
          </tbody>
        </table>
      `;
    }
  }

  // T5 Erkilet What-If Karar Destek Hesaplamaları
  updateErkiletCalculations() {
    const scenario = this.engine.erkiletConfig.scenario;
    const isA = (scenario === "scenario_a");
    const routeLengthKm = isA ? 17.8 : 14.7;
    const commercialSpeed = this.engine.erkiletConfig.commercialSpeed;
    const headwayMin = this.engine.erkiletConfig.headwayMinutes;
    const stationCount = isA ? 19 : 15;

    // 1) Tek yön seyahat süresi: T_one_way = (L / V) * 60 + (N_stops * t_dwell / 60)
    const dwellMin = (stationCount * 25) / 60;
    const runTimeMin = Math.round((routeLengthKm / commercialSpeed) * 60 + dwellMin);

    // 2) Çevrim süresi: T_cycle = 2 * T_one_way + 2 * t_layover (terminal bekleme ~6 dk)
    const cycleTimeMin = Math.round(2 * runTimeMin + 12);

    // 3) Gerekli Filo Boyutu: N = ceil(T_cycle / H) * 1.15 (rezerv payı)
    const activeTrainsReq = Math.ceil(cycleTimeMin / headwayMin);
    const totalFleetReq = Math.ceil(activeTrainsReq * 1.15);

    // 4) Günlük Taşıma Kapasitesi (18 saat aktif işletme, tren başı 296 yolcu)
    const dailyTripsPerDir = Math.floor((18 * 60) / headwayMin);
    const totalDailyCap = dailyTripsPerDir * 2 * 296;

    // 5) Ortalama Yolcu Bekleme Süresi: E[W] = H / 2
    const avgWaitMin = (headwayMin / 2).toFixed(1);

    // UI'ya yazdır
    if (this.calcCycleTime) this.calcCycleTime.innerText = `${cycleTimeMin} dk (${runTimeMin} dk gidiş)`;
    if (this.calcFleetSize) this.calcFleetSize.innerText = `${totalFleetReq} Tren (${activeTrainsReq} aktif + ${totalFleetReq - activeTrainsReq} rezerv)`;
    if (this.calcDailyCap) this.calcDailyCap.innerText = `${totalDailyCap.toLocaleString()} Yolcu/Gün`;
    if (this.calcWaitTime) this.calcWaitTime.innerText = `${avgWaitMin} dk`;
  }
}

// Global Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = TramUIController;
}
