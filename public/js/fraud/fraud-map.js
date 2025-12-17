/* ============================================================================
   FIN-GUARD FRAUD GEO MAP
   Renders geographic fraud risk heatmap using Leaflet
============================================================================ */

import { api_getFraudKPIs } from "../core/api.js"; // backend provides geo data
import { showToast } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const mapContainer = document.getElementById("geoRiskMap");

/* ===================== MAP STATE ===================== */

let mapInstance = null;
let markerLayer = null;

/* ============================================================================
   INIT
============================================================================ */

function initFraudMap() {
  if (!mapContainer || !window.L) return;

  // Initialize map when fraud view opens
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud") {
      initMap();
      loadGeoRiskData();
    }
  });
}

/* ============================================================================
   MAP SETUP
============================================================================ */

function initMap() {
  if (mapInstance) return; // prevent re-init

  mapInstance = L.map("geoRiskMap").setView([20.5937, 78.9629], 4); // India center

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(mapInstance);

  markerLayer = L.layerGroup().addTo(mapInstance);
}

/* ============================================================================
   LOAD GEO DATA
============================================================================ */

async function loadGeoRiskData() {
  try {
    if (!markerLayer) return;

    markerLayer.clearLayers();

    /*
      Expected backend response example:
      [
        { lat: 28.61, lng: 77.23, risk: "HIGH", count: 5 },
        { lat: 19.07, lng: 72.87, risk: "LOW", count: 2 }
      ]
    */

    const data = await api_getFraudKPIs();

    if (!Array.isArray(data?.geoRisk)) return;

    data.geoRisk.forEach((item) => {
      const color = getRiskColor(item.risk);

      const marker = L.circleMarker([item.lat, item.lng], {
        radius: 10,
        color,
        fillColor: color,
        fillOpacity: 0.6,
      });

      marker.bindPopup(`
        <strong>Risk:</strong> ${item.risk}<br/>
        <strong>Cases:</strong> ${item.count}
      `);

      markerLayer.addLayer(marker);
    });
  } catch (err) {
    console.error("Failed to load fraud geo map:", err);
    showToast("Failed to load geographic risk map", "error");
  }
}

/* ============================================================================
   HELPERS
============================================================================ */

function getRiskColor(risk) {
  if (risk === "HIGH") return "#dc2626"; // red
  if (risk === "MEDIUM") return "#f59e0b"; // amber
  return "#16a34a"; // green
}

/* ============================================================================
   EXPORTS
============================================================================ */

export{
  initFraudMap,
};
