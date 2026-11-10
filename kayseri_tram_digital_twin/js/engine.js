/**
 * Kayseri Tramvay Dijital İkiz — Simülasyon & Fizik Motoru
 * - Zamana bağlı tramvay hareketi (Time-stepped train simulation)
 * - Durak dwell time (yolcu iniş-biniş bekleme)
 * - Dinamik yolcu ve doluluk oranı modeli
 * - Arıza / olay (incident) simülatörü ve zincirleme gecikme (knock-on delay)
 * - T5 Erkilet What-If senaryo optimizasyonu
 */

class TramDigitalTwinEngine {
  constructor(data) {
    this.data = data;
    this.simTimeSeconds = 8 * 3600 + 15 * 60; // Başlangıç: 08:15:00 (Sabah Piki)
    this.timeScale = 1; // 1x, 5x, 15x, 30x, 60x, 0 (duraklat)
    this.dayType = "WEEKDAY"; // "WEEKDAY", "SATURDAY", "SUNDAY"
    this.activeTrains = [];
    this.stationMap = {};
    this.activeIncidents = [];
    this.listeners = [];

    // T5 Erkilet Parametreleri
    this.erkiletConfig = {
      active: true,
      scenario: "scenario_a", // "scenario_a" (Resmî KBB) veya "scenario_b" (Doğrudan Sıralı)
      headwayMinutes: 8,
      commercialSpeed: 28, // km/sa
      dwellTimeSec: 25,
      customStations: []
    };

    this.initStationMap();
    this.initFleet();
  }

  initStationMap() {
    this.data.stations.forEach(stn => {
      this.stationMap[stn.id] = stn;
    });
    // Erkilet durakları
    this.data.erkilet_nodes.scenario_a.forEach(node => {
      this.stationMap[node.id] = {
        id: node.id,
        name: node.name,
        lat: node.lat,
        lon: node.lon,
        type: node.type,
        lines: ["T5-A"],
        is_tunnel: node.surface === "tunnel"
      };
    });
    this.data.erkilet_nodes.scenario_b.forEach(node => {
      this.stationMap[node.id] = {
        id: node.id,
        name: node.name,
        lat: node.lat,
        lon: node.lon,
        type: node.type,
        lines: ["T5-B"],
        is_tunnel: node.surface === "tunnel"
      };
    });
  }

  initFleet() {
    this.activeTrains = [];
    let trainCounter = 1;

    // T1 Trenleri (22 adet aktif dizi - 11 doğu, 11 batı)
    this.spawnTrainsForRoute("T1", "T1_DEP", 11, "#FF3366");
    this.spawnTrainsForRoute("T1", "T1_ARR", 11, "#FF3366");

    // T2 Trenleri (6 adet - 3 gidiş, 3 dönüş)
    this.spawnTrainsForRoute("T2", "T2_DEP", 3, "#00E676");
    this.spawnTrainsForRoute("T2", "T2_ARR", 3, "#00E676");

    // T3 Trenleri (12 adet - 6 gidiş, 6 dönüş)
    this.spawnTrainsForRoute("T3", "T3_DEP", 6, "#00E5FF");
    this.spawnTrainsForRoute("T3", "T3_ARR", 6, "#00E5FF");

    // T4 Trenleri (6 adet - 3 gidiş, 3 dönüş)
    this.spawnTrainsForRoute("T4", "T4_DEP", 3, "#E040FB");
    this.spawnTrainsForRoute("T4", "T4_ARR", 3, "#E040FB");

    // T5 Erkilet Trenleri (6 adet simüle)
    this.spawnErkiletTrains();
  }

  spawnTrainsForRoute(lineCode, routeKey, count, color) {
    const route = this.data.routes[routeKey];
    if (!route || !route.stops || route.stops.length < 2) return;

    for (let i = 0; i < count; i++) {
      const trainId = `${lineCode}-${(i + 1).toString().padStart(2, "0")}`;
      const isSirio = (i % 2 === 0);
      const initialProgress = i / count;
      const totalStops = route.stops.length;
      const initialStopIndex = Math.min(Math.floor(initialProgress * (totalStops - 1)), totalStops - 2);
      const segmentProgress = (initialProgress * (totalStops - 1)) - initialStopIndex;

      const fromStn = this.stationMap[route.stops[initialStopIndex]];
      const toStn = this.stationMap[route.stops[initialStopIndex + 1]];

      const currentLat = fromStn.lat + (toStn.lat - fromStn.lat) * segmentProgress;
      const currentLon = fromStn.lon + (toStn.lon - fromStn.lon) * segmentProgress;

      this.activeTrains.push({
        id: trainId,
        lineCode: lineCode,
        routeKey: routeKey,
        routeName: route.name,
        color: color,
        model: isSirio ? "AnsaldoBreda Sirio (32.25m)" : "Bozankaya Kayseray (32.72m)",
        capacity: isSirio ? 223 : 309,
        seats: 70,
        currentStopIndex: initialStopIndex,
        segmentProgress: segmentProgress,
        status: "RUNNING", // "RUNNING", "DWELLING", "BLOCKED", "MAINTENANCE"
        dwellTimerSec: 0,
        nominalSpeedKmh: 45 + Math.random() * 15,
        currentSpeedKmh: 48,
        lat: currentLat,
        lon: currentLon,
        altitude: 0,
        bearing: this.calculateBearing(fromStn, toStn),
        passengers: 0,
        loadFactor: 0,
        catenaryVoltage: 750,
        powerKw: 180,
        health: {
          wheelWearPct: Math.floor(82 + Math.random() * 15),
          pantograph: "Normal (750V DC)",
          nextMaintenanceKm: Math.floor(4000 + Math.random() * 8000),
          temperatureC: 38 + Math.floor(Math.random() * 8)
        }
      });
    }
  }

  spawnErkiletTrains() {
    if (!this.erkiletConfig.active) return;
    const scenario = this.erkiletConfig.scenario;
    const nodes = this.data.erkilet_nodes[scenario];
    if (!nodes || nodes.length < 2) return;

    const count = 6;
    for (let i = 0; i < count; i++) {
      const trainId = `T5-${(i + 1).toString().padStart(2, "0")}`;
      const isOutbound = (i % 2 === 0);
      const stopList = isOutbound ? nodes : [...nodes].reverse();
      const progressRatio = (i / count);
      const totalStops = stopList.length;
      const stopIndex = Math.min(Math.floor(progressRatio * (totalStops - 1)), totalStops - 2);
      const segProg = (progressRatio * (totalStops - 1)) - stopIndex;

      const fromStn = stopList[stopIndex];
      const toStn = stopList[stopIndex + 1];

      const currentLat = fromStn.lat + (toStn.lat - fromStn.lat) * segProg;
      const currentLon = fromStn.lon + (toStn.lon - fromStn.lon) * segProg;
      const isTunnel = (fromStn.surface === "tunnel" || toStn.surface === "tunnel");

      this.activeTrains.push({
        id: trainId,
        lineCode: "T5",
        routeKey: isOutbound ? "T5_OUT" : "T5_IN",
        routeName: isOutbound ? "Bülbülpınarı → Millet Bahçesi" : "Millet Bahçesi → Bülbülpınarı",
        color: "#FFD600",
        model: "Bozankaya 2. Nesil Yüksek Eğim Tramvay",
        capacity: 296,
        seats: 68,
        currentStopIndex: stopIndex,
        segmentProgress: segProg,
        status: "RUNNING",
        dwellTimerSec: 0,
        nominalSpeedKmh: 55,
        currentSpeedKmh: 50,
        lat: currentLat,
        lon: currentLon,
        altitude: isTunnel ? -18 : 0,
        isTunnel: isTunnel,
        bearing: this.calculateBearing(fromStn, toStn),
        passengers: 0,
        loadFactor: 0,
        catenaryVoltage: 750,
        powerKw: 210,
        isErkilet: true,
        health: {
          wheelWearPct: 98,
          pantograph: "Yeni Nesil Akıllı Pantoğraf",
          nextMaintenanceKm: 18500,
          temperatureC: 32
        }
      });
    }
  }

  // Coğrafi mesafe (Haversine km)
  distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  calculateBearing(from, to) {
    const y = Math.sin((to.lon - from.lon) * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180);
    const x = Math.cos(from.lat * Math.PI / 180) * Math.sin(to.lat * Math.PI / 180) -
              Math.sin(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.cos((to.lon - from.lon) * Math.PI / 180);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  // Simülasyon Adımı (dt saniye)
  step(dtSec) {
    if (this.timeScale === 0) return; // Paused

    const effectiveDt = dtSec * this.timeScale;
    this.simTimeSeconds = (this.simTimeSeconds + effectiveDt) % 86400;

    // Saatlik Talep Katsayısı (Pik saatler 07:00-09:30 ve 16:30-19:30)
    const hour = this.simTimeSeconds / 3600;
    let timeDemandMultiplier = 0.4;
    if ((hour >= 7 && hour <= 9.5) || (hour >= 16.5 && hour <= 19.5)) {
      timeDemandMultiplier = 0.92; // Pik saat
    } else if (hour >= 11 && hour <= 14) {
      timeDemandMultiplier = 0.58; // Öğle
    } else if (hour >= 21 || hour <= 6) {
      timeDemandMultiplier = 0.22; // Gece
    }

    // Aktif Arızaları Denetle
    this.checkIncidents(effectiveDt);

    // Her trenin konumunu ve durumunu güncelle
    this.activeTrains.forEach(train => {
      this.updateTrain(train, effectiveDt, timeDemandMultiplier);
    });

    // Dinleyicileri bilgilendir
    this.notifyListeners();
  }

  updateTrain(train, dtSec, demandFactor) {
    // Arıza etkisi kontrolü
    const isIncidentNear = this.activeIncidents.find(inc => {
      return this.distanceKm(train.lat, train.lon, inc.lat, inc.lon) < 0.6;
    });

    if (isIncidentNear) {
      train.status = "BLOCKED";
      train.currentSpeedKmh = Math.max(0, train.currentSpeedKmh - 15 * (dtSec / 2));
      train.powerKw = 25;
      return;
    }

    let stopList;
    if (train.isErkilet) {
      const scenario = this.erkiletConfig.scenario;
      const baseNodes = this.data.erkilet_nodes[scenario];
      stopList = train.routeKey === "T5_OUT" ? baseNodes : [...baseNodes].reverse();
    } else {
      stopList = this.data.routes[train.routeKey].stops.map(id => this.stationMap[id]);
    }

    if (!stopList || stopList.length < 2) return;

    // Durakta bekleme (Dwell state)
    if (train.status === "DWELLING") {
      train.dwellTimerSec -= dtSec;
      train.currentSpeedKmh = 0;
      train.powerKw = 35; // Yardımcı servisler (klima/ışık)
      if (train.dwellTimerSec <= 0) {
        train.status = "RUNNING";
        // Bir sonraki segmente geç
        train.currentStopIndex++;
        if (train.currentStopIndex >= stopList.length - 1) {
          // Hattın sonuna vardı, yön değiştir / başa dön
          train.currentStopIndex = 0;
        }
        train.segmentProgress = 0;
      }
      return;
    }

    // Seyir Hali (Running state)
    const fromStn = stopList[train.currentStopIndex];
    const toStn = stopList[train.currentStopIndex + 1];

    if (!fromStn || !toStn) {
      train.currentStopIndex = 0;
      train.segmentProgress = 0;
      return;
    }

    const segDistKm = this.distanceKm(fromStn.lat, fromStn.lon, toStn.lat, toStn.lon);
    const speedKmh = train.nominalSpeedKmh;
    train.currentSpeedKmh = speedKmh;
    train.powerKw = Math.round(180 + Math.random() * 40);

    const distTraveledKm = (speedKmh / 3600) * dtSec;
    const progressDelta = segDistKm > 0 ? (distTraveledKm / segDistKm) : 1;

    train.segmentProgress += progressDelta;

    if (train.segmentProgress >= 1.0) {
      // Durağa vardı!
      train.segmentProgress = 1.0;
      train.status = "DWELLING";

      // İstasyon önemine göre duruş süresi (Cumhuriyet Meydanı, Hunat, Tuna: 35-45 sn, diğerleri 20-25 sn)
      const isHub = toStn.type === "central_hub" || toStn.is_hub;
      train.dwellTimerSec = isHub ? (35 + Math.random() * 10) : (20 + Math.random() * 5);

      // Yolcu biniş/iniş simülasyonu
      const baseLoad = isHub ? 0.85 : 0.6;
      train.loadFactor = Math.min(100, Math.round((baseLoad * demandFactor + (Math.random() * 0.15)) * 100));
      train.passengers = Math.round((train.loadFactor / 100) * train.capacity);
    }

    // Koordinat Enterpolasyonu
    train.lat = fromStn.lat + (toStn.lat - fromStn.lat) * train.segmentProgress;
    train.lon = fromStn.lon + (toStn.lon - fromStn.lon) * train.segmentProgress;
    train.bearing = this.calculateBearing(fromStn, toStn);

    // Tünel kesimi irtifası
    const isUnderground = (fromStn.surface === "tunnel" || toStn.surface === "tunnel" || fromStn.is_tunnel);
    train.altitude = isUnderground ? -18 : 0;
    train.isTunnel = isUnderground;

    // Bir sonraki durak ve kalan mesafe
    train.nextStationName = toStn.name;
    const remKm = Math.max(0, (1 - train.segmentProgress) * segDistKm);
    train.etaSeconds = Math.round((remKm / Math.max(speedKmh, 1)) * 3600) + Math.round(train.dwellTimerSec);
  }

  checkIncidents(dtSec) {
    this.activeIncidents.forEach(inc => {
      inc.remainingDurationSec -= dtSec;
    });
    // Süresi dolan arızaları kaldır
    this.activeIncidents = this.activeIncidents.filter(inc => inc.remainingDurationSec > 0);
  }

  // Kullanıcı tarafından arıza tetikleme
  triggerIncident(catalogId, targetStationId) {
    const incTemplate = this.data.incident_catalog.find(i => i.id === catalogId) || this.data.incident_catalog[0];
    const stn = this.stationMap[targetStationId] || this.stationMap["STN_19"]; // Varsayılan: Meydan

    const incident = {
      instanceId: `INC-${Date.now().toString().slice(-4)}`,
      id: incTemplate.id,
      name: incTemplate.name,
      category: incTemplate.category,
      severity: incTemplate.severity,
      stationId: stn.id,
      stationName: stn.name,
      lat: stn.lat,
      lon: stn.lon,
      totalDurationSec: incTemplate.typical_mttr_min * 60,
      remainingDurationSec: incTemplate.typical_mttr_min * 60,
      impact: incTemplate.impact_description
    };

    this.activeIncidents.push(incident);
    this.notifyListeners();
    return incident;
  }

  clearAllIncidents() {
    this.activeIncidents = [];
    this.activeTrains.forEach(t => {
      if (t.status === "BLOCKED") t.status = "RUNNING";
    });
    this.notifyListeners();
  }

  // T5 Erkilet Parametrelerini Güncelleme (What-If Laboratuvarı)
  updateErkiletConfig(newConfig) {
    Object.assign(this.erkiletConfig, newConfig);
    // Trenleri yeniden oluştur
    this.activeTrains = this.activeTrains.filter(t => !t.isErkilet);
    if (this.erkiletConfig.active) {
      this.spawnErkiletTrains();
    }
    this.notifyListeners();
  }

  // T5 için Yeni İstasyon Ekleme
  addCustomStationToErkilet(name, lat, lon, isTunnel = false) {
    const scenario = this.erkiletConfig.scenario;
    const newId = `ERK_CUST_${Date.now().toString().slice(-4)}`;
    const newStation = {
      id: newId,
      name: name,
      lat: lat,
      lon: lon,
      type: "custom",
      surface: isTunnel ? "tunnel" : "surface",
      is_tunnel: isTunnel
    };
    this.data.erkilet_nodes[scenario].push(newStation);
    this.stationMap[newId] = newStation;
    this.erkiletConfig.customStations.push(newStation);
    this.updateErkiletConfig({});
    return newStation;
  }

  // Performans Metrikleri Hesaplama
  getSystemMetrics() {
    const operationalTrains = this.activeTrains.filter(t => !t.isErkilet);
    const erkiletTrains = this.activeTrains.filter(t => t.isErkilet);
    const blockedTrains = this.activeTrains.filter(t => t.status === "BLOCKED");

    const totalPax = this.activeTrains.reduce((acc, t) => acc + (t.passengers || 0), 0);
    const avgLoadFactor = this.activeTrains.length > 0 
      ? Math.round(this.activeTrains.reduce((acc, t) => acc + (t.loadFactor || 0), 0) / this.activeTrains.length) 
      : 0;
    const totalPowerMw = (this.activeTrains.reduce((acc, t) => acc + (t.powerKw || 0), 0) / 1000).toFixed(2);

    return {
      simTimeFormatted: this.formatTime(this.simTimeSeconds),
      totalTrains: this.activeTrains.length,
      operationalTrainsCount: operationalTrains.length,
      erkiletTrainsCount: erkiletTrains.length,
      blockedTrainsCount: blockedTrains.length,
      totalCurrentPassengers: totalPax,
      avgLoadFactorPct: avgLoadFactor,
      totalPowerMw: totalPowerMw,
      activeIncidentsCount: this.activeIncidents.length,
      catenaryHealthPct: this.activeIncidents.length > 0 ? 82 : 99.4
    };
  }

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this));
  }
}

// Global export
if (typeof module !== "undefined" && module.exports) {
  module.exports = TramDigitalTwinEngine;
}
