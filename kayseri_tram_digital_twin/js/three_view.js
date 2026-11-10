/**
 * Kayseri Tramvay Dijital İkiz — 3D Three.js Sahne Görselleştirmesi
 * - 3D Hatlar, Ray Geometrileri ve Tünel Tüpleri
 * - 3D İstasyon Platformları ve Aktarma Halka Göstergeleri
 * - Raylar Üzerinde Hareket Eden 3D Tramvay Modelleri ve Far Işıkları
 * - Raycasting ile Tramvay / Durak Seçimi ve Araç Takip Kamerası
 */

class Kayseri3DView {
  constructor(containerId, engine, onSelectEntity) {
    this.container = document.getElementById(containerId);
    this.engine = engine;
    this.onSelectEntity = onSelectEntity; // callback(type, data)

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 3D Obje Koleksiyonları
    this.trainMeshes = new Map(); // trainId -> THREE.Group
    this.stationMeshes = new Map(); // stationId -> THREE.Mesh
    this.lineCurves = new Map(); // routeKey -> THREE.CatmullRomCurve3
    this.incidentMarkers = new Map();

    // Kamera Takip Durumu
    this.trackedTrainId = null;

    // Coğrafi Ölçekleme Parametreleri (Kayseri Merkez: Cumhuriyet Meydanı)
    this.originLat = 38.7218925;
    this.originLon = 35.4873228;
    this.scaleFactorX = 85000; // Boylam ölçeği
    this.scaleFactorZ = 111000; // Enlem ölçeği
    this.worldScale = 0.08; // 3D Dünya birimi ölçeği

    this.initScene();
    this.buildGroundAndEnvironment();
    this.buildTracksAndTunnels();
    this.buildStations();
    this.animate();

    // Pencere yeniden boyutlandırma & tıklama olayları
    window.addEventListener("resize", () => this.onWindowResize());
    this.container.addEventListener("pointerdown", (e) => this.onPointerDown(e));
  }

  // WGS84 Koordinatından Three.js Vector3 Dünyasına Dönüşüm
  geoToWorld(lat, lon, altitude = 0) {
    const x = (lon - this.originLon) * (Math.PI / 180) * 6378137 * Math.cos(this.originLat * Math.PI / 180) * this.worldScale;
    const z = -(lat - this.originLat) * (Math.PI / 180) * 6378137 * this.worldScale;
    const y = altitude * this.worldScale;
    return new THREE.Vector3(x, y, z);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17); // Koyu lacivert/gece teması
    this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.00035);

    // Kamera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      1,
      50000
    );
    // Kuşbakışı izometrik başlangıç pozisyonu
    this.camera.position.set(0, 1800, 2200);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Zemin altına geçişi engelle
    this.controls.minDistance = 30;
    this.controls.maxDistance = 12000;
    this.controls.target.set(0, 0, 0);

    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(1500, 3000, 1500);
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x304ffe, 0x0a0e17, 0.4);
    this.scene.add(hemiLight);
  }

  buildGroundAndEnvironment() {
    // Fütüristik Izgara Tabanı (Grid)
    const gridSize = 12000;
    const gridDivisions = 120;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x1e3a8a, 0x111c33);
    gridHelper.position.y = -0.5;
    this.scene.add(gridHelper);

    // Erciyes Dağı Temsili Silueti (Kayseri'nin simgesi, güneyde)
    const erciyesGeo = new THREE.ConeGeometry(1200, 1100, 32);
    const erciyesMat = new THREE.MeshStandardMaterial({
      color: 0x141b2d,
      roughness: 0.9,
      wireframe: false
    });
    const erciyesMesh = new THREE.Mesh(erciyesGeo, erciyesMat);
    erciyesMesh.position.set(800, 350, 4200); // Güneyde dağ kütlesi
    this.scene.add(erciyesMesh);

    // Zirvede kar kütlesi (beyaz şapka)
    const snowGeo = new THREE.ConeGeometry(400, 350, 32);
    const snowMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, wireframe: true });
    const snowMesh = new THREE.Mesh(snowGeo, snowMat);
    snowMesh.position.set(800, 800, 4200);
    this.scene.add(snowMesh);
  }

  buildTracksAndTunnels() {
    // 4 Aktif Hat + T5 Erkilet için 3D Ray Tüpleri Oluşturma
    const lineDefinitions = [
      { code: "T1", route: "T1_DEP", color: 0xff3366, radius: 1.6 },
      { code: "T2", route: "T2_DEP", color: 0x00e676, radius: 1.6 },
      { code: "T3", route: "T3_DEP", color: 0x00e5ff, radius: 1.6 },
      { code: "T4", route: "T4_ARR", color: 0xe040fb, radius: 1.6 }
    ];

    lineDefinitions.forEach(lineDef => {
      const route = this.engine.data.routes[lineDef.route];
      if (!route) return;

      const points = [];
      route.stops.forEach(stnId => {
        const stn = this.engine.stationMap[stnId];
        if (stn) {
          points.push(this.geoToWorld(stn.lat, stn.lon, 0));
        }
      });

      if (points.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(points);
        curve.curveType = "centripetal";
        curve.tension = 0.2;
        this.lineCurves.set(lineDef.route, curve);

        // 3D Ray Tüpü
        const tubeGeo = new THREE.TubeGeometry(curve, points.length * 8, lineDef.radius, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: lineDef.color,
          emissive: lineDef.color,
          emissiveIntensity: 0.45,
          roughness: 0.3,
          metalness: 0.8
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        tubeMesh.userData = { type: "line_track", lineCode: lineDef.code };
        this.scene.add(tubeMesh);
      }
    });

    // T5 Erkilet Hattı ve 4 KM Tünel Görselleştirmesi
    this.buildErkiletTrack3D();
  }

  buildErkiletTrack3D() {
    const scenario = this.engine.erkiletConfig.scenario;
    const nodes = this.engine.data.erkilet_nodes[scenario];
    if (!nodes || nodes.length < 2) return;

    const surfacePoints = [];
    const tunnelPoints = [];

    nodes.forEach(node => {
      const isTunnel = (node.surface === "tunnel");
      const pos = this.geoToWorld(node.lat, node.lon, isTunnel ? -18 : 0);
      if (isTunnel) {
        tunnelPoints.push(pos);
      } else {
        surfacePoints.push(pos);
      }
    });

    // Tüm Erkilet Hattı Eğrisi
    const allPoints = nodes.map(n => this.geoToWorld(n.lat, n.lon, n.surface === "tunnel" ? -18 : 0));
    const erkiletCurve = new THREE.CatmullRomCurve3(allPoints);
    erkiletCurve.curveType = "centripetal";
    this.lineCurves.set("T5_TRACK", erkiletCurve);

    // Hemzemin ray kesimi
    const tubeGeo = new THREE.TubeGeometry(erkiletCurve, allPoints.length * 10, 1.8, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffd600,
      emissive: 0xffd600,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    this.erkiletTubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(this.erkiletTubeMesh);

    // 4 km Tünel Kesimi: Şeffaf neon cam tünel kılıfı
    const tunnelNodes = nodes.filter(n => n.surface === "tunnel");
    if (tunnelNodes.length >= 2) {
      const tPts = tunnelNodes.map(n => this.geoToWorld(n.lat, n.lon, -18));
      const tCurve = new THREE.CatmullRomCurve3(tPts);
      const tunnelCaseGeo = new THREE.TubeGeometry(tCurve, 40, 6.0, 12, false);
      const tunnelCaseMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      const tunnelMesh = new THREE.Mesh(tunnelCaseGeo, tunnelCaseMat);
      this.scene.add(tunnelMesh);
    }
  }

  buildStations() {
    this.engine.data.stations.forEach(stn => {
      const pos = this.geoToWorld(stn.lat, stn.lon, 0);

      const isHub = (stn.id === "STN_19" || stn.id === "STN_24" || stn.id === "STN_06" || stn.id === "STN_45");
      const radius = isHub ? 8.5 : 4.0;
      const height = isHub ? 4.0 : 2.5;

      // Platform Silindiri
      const stnGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
      const stnMat = new THREE.MeshStandardMaterial({
        color: isHub ? 0xf59e0b : 0x38bdf8,
        emissive: isHub ? 0xf59e0b : 0x0284c7,
        emissiveIntensity: isHub ? 0.7 : 0.4,
        roughness: 0.3,
        metalness: 0.6
      });
      const stnMesh = new THREE.Mesh(stnGeo, stnMat);
      stnMesh.position.copy(pos);
      stnMesh.position.y += height / 2;
      stnMesh.userData = { type: "station", data: stn };
      this.scene.add(stnMesh);
      this.stationMeshes.set(stn.id, stnMesh);

      // Ana merkezlerde (Cumhuriyet Meydanı, Tuna) parlayan halka
      if (isHub) {
        const ringGeo = new THREE.RingGeometry(radius + 2, radius + 5, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.copy(pos);
        ringMesh.position.y = 0.5;
        this.scene.add(ringMesh);
      }
    });

    // Planlanan Erkilet İstasyonları
    const scenario = this.engine.erkiletConfig.scenario;
    this.engine.data.erkilet_nodes[scenario].forEach(node => {
      const isTunnel = (node.surface === "tunnel");
      const pos = this.geoToWorld(node.lat, node.lon, isTunnel ? -18 : 0);

      const geo = new THREE.CylinderGeometry(6, 6, 3, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: isTunnel ? 0x06b6d4 : 0xfacc15,
        emissive: isTunnel ? 0x06b6d4 : 0xfacc15,
        emissiveIntensity: 0.6,
        wireframe: isTunnel
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.userData = { type: "station", data: node };
      this.scene.add(mesh);
      this.stationMeshes.set(node.id, mesh);
    });
  }

  // 3D Tramvay Modeli Oluşturucu (Bozankaya / Sirio Tasarımı)
  createTrainMesh(train) {
    const group = new THREE.Group();

    // Gövde (32 metre ölçekli aerodinamik tramvay)
    const bodyLength = 22;
    const bodyWidth = 3.6;
    const bodyHeight = 4.2;

    const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(train.color),
      metalness: 0.7,
      roughness: 0.25,
      emissive: new THREE.Color(train.color),
      emissiveIntensity: 0.25
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = bodyHeight / 2 + 0.8;
    group.add(bodyMesh);

    // Kabin Camları (Siyah koyu cam şeridi)
    const glassGeo = new THREE.BoxGeometry(bodyWidth + 0.1, 1.4, bodyLength - 2);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.y = bodyHeight * 0.65;
    group.add(glassMesh);

    // Çatı Pantoğrafı (750V Katener Bağlantısı)
    const pantoGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
    const pantoMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const pantoMesh = new THREE.Mesh(pantoGeo, pantoMat);
    pantoMesh.position.y = bodyHeight + 1.8;
    group.add(pantoMesh);

    // Ön Far Işıkları (LED)
    const headlightGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlLeft = new THREE.Mesh(headlightGeo, headlightMat);
    hlLeft.position.set(-1.1, 1.8, bodyLength / 2 + 0.1);
    const hlRight = new THREE.Mesh(headlightGeo, headlightMat);
    hlRight.position.set(1.1, 1.8, bodyLength / 2 + 0.1);
    group.add(hlLeft);
    group.add(hlRight);

    // Işık Spotu (Yere vuran far aydınlatması)
    const spot = new THREE.PointLight(0xffffff, 0.8, 45);
    spot.position.set(0, 2.2, bodyLength / 2 + 2);
    group.add(spot);

    group.userData = { type: "train", data: train };
    return group;
  }

  // Her Karede Trenleri ve Sahneyi Güncelleme
  update() {
    this.engine.activeTrains.forEach(train => {
      let mesh = this.trainMeshes.get(train.id);
      if (!mesh) {
        mesh = this.createTrainMesh(train);
        this.scene.add(mesh);
        this.trainMeshes.set(train.id, mesh);
      }

      // 3D Dünya Pozisyonunu Güncelle
      const targetPos = this.geoToWorld(train.lat, train.lon, train.altitude);
      mesh.position.copy(targetPos);

      // Yön / Rotasyon Açısını Güncelle
      mesh.rotation.y = -train.bearing * (Math.PI / 180) + Math.PI;

      // Arıza / Bekleme Durumunda Yanıp Sönme (Glow)
      if (train.status === "BLOCKED") {
        mesh.children[0].material.emissive.setHex(0xef4444);
        mesh.children[0].material.emissiveIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.4;
      } else if (train.status === "DWELLING") {
        mesh.children[0].material.emissive.setHex(0xf59e0b);
        mesh.children[0].material.emissiveIntensity = 0.45;
      } else {
        mesh.children[0].material.emissive.set(train.color);
        mesh.children[0].material.emissiveIntensity = 0.25;
      }
    });

    // Kamera Bir Treni Takip Ediyorsa (Vehicle Follow Mode)
    if (this.trackedTrainId) {
      const trackedMesh = this.trainMeshes.get(this.trackedTrainId);
      if (trackedMesh) {
        this.controls.target.lerp(trackedMesh.position, 0.08);
      }
    }

    // Arıza İşaretçilerini Güncelle
    this.updateIncidentMarkers();
  }

  updateIncidentMarkers() {
    // Mevcut işaretçileri temizle/güncelle
    this.engine.activeIncidents.forEach(inc => {
      let marker = this.incidentMarkers.get(inc.instanceId);
      if (!marker) {
        const geo = new THREE.OctahedronGeometry(9, 0);
        const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
        marker = new THREE.Mesh(geo, mat);
        const pos = this.geoToWorld(inc.lat, inc.lon, 15);
        marker.position.copy(pos);
        this.scene.add(marker);
        this.incidentMarkers.set(inc.instanceId, marker);
      }
      marker.rotation.y += 0.04;
      marker.rotation.x += 0.02;
    });

    // Süresi biten işaretçileri kaldır
    for (const [id, marker] of this.incidentMarkers.entries()) {
      if (!this.engine.activeIncidents.some(i => i.instanceId === id)) {
        this.scene.remove(marker);
        this.incidentMarkers.delete(id);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  onPointerDown(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Tıklanabilir nesneleri topla
    const interactiveObjects = [];
    this.trainMeshes.forEach(group => interactiveObjects.push(group.children[0])); // Tren gövdesi
    this.stationMeshes.forEach(mesh => interactiveObjects.push(mesh)); // İstasyon

    const intersects = this.raycaster.intersectObjects(interactiveObjects);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const parentGroup = hit.parent;

      if (parentGroup && parentGroup.userData && parentGroup.userData.type === "train") {
        const trainData = parentGroup.userData.data;
        this.trackedTrainId = trainData.id;
        if (this.onSelectEntity) this.onSelectEntity("train", trainData);
      } else if (hit.userData && hit.userData.type === "station") {
        const stnData = hit.userData.data;
        this.trackedTrainId = null;
        this.focusOnPosition(hit.position, 280);
        if (this.onSelectEntity) this.onSelectEntity("station", stnData);
      }
    }
  }

  focusOnPosition(worldPos, distance = 400) {
    gsapFocus(this.controls.target, worldPos, 0.8);
  }

  // Hazır Kamera Açıları
  setCameraPreset(preset) {
    this.trackedTrainId = null;
    switch (preset) {
      case "all":
        this.camera.position.set(0, 2200, 2800);
        this.controls.target.set(0, 0, 0);
        break;
      case "meydan":
        const mPos = this.geoToWorld(38.7218925, 35.4873228, 0);
        this.camera.position.set(mPos.x + 120, 220, mPos.z + 280);
        this.controls.target.copy(mPos);
        break;
      case "erkilet":
        const ePos = this.geoToWorld(38.77348, 35.49468, 0);
        this.camera.position.set(ePos.x + 250, 450, ePos.z + 450);
        this.controls.target.copy(ePos);
        break;
      case "talas":
        const tPos = this.geoToWorld(38.70795, 35.53103, 0);
        this.camera.position.set(tPos.x + 180, 280, tPos.z + 320);
        this.controls.target.copy(tPos);
        break;
      case "kumsmall":
        const kPos = this.geoToWorld(38.77767, 35.43233, 0);
        this.camera.position.set(kPos.x - 180, 280, kPos.z - 300);
        this.controls.target.copy(kPos);
        break;
    }
  }
}

// Basit Yumuşak Kamera Geçişi
function gsapFocus(targetVector, destVector, duration) {
  const startX = targetVector.x;
  const startY = targetVector.y;
  const startZ = targetVector.z;
  const startTime = performance.now();

  function anim(now) {
    const elapsed = (now - startTime) / (duration * 1000);
    if (elapsed < 1.0) {
      const ease = 0.5 - Math.cos(elapsed * Math.PI) / 2;
      targetVector.x = startX + (destVector.x - startX) * ease;
      targetVector.y = startY + (destVector.y - startY) * ease;
      targetVector.z = startZ + (destVector.z - startZ) * ease;
      requestAnimationFrame(anim);
    } else {
      targetVector.copy(destVector);
    }
  }
  requestAnimationFrame(anim);
}

// Global Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = Kayseri3DView;
}
