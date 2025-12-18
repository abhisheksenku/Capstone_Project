/* ============================================================================
   FIN-GUARD FRAUD GEO MAP
   Handles Fraud Overview Geographic Risk Map (Leaflet)
============================================================================ */

import { api_getGeoRisk } from "../core/api.js";
import { showToast } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const mapContainer = document.getElementById("geoRiskMap");

/* ===================== MAP STATE ===================== */

let map = null;
let geoLayer = null;

/* ============================================================================
   INIT
============================================================================ */

function initFraudMap() {
  if (!mapContainer || !window.L) return;

  // Load map ONLY when fraud overview opens
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud") {
      initMap();
      loadGeoRisk();
    }
  });

  // Realtime refresh
  document.addEventListener("fraud:alert", loadGeoRisk);
  document.addEventListener("fraud:refresh", loadGeoRisk);
}

/* ============================================================================
   MAP INITIALIZATION
============================================================================ */

function initMap() {
  if (map) return; // important: prevent re-init

  map = L.map("geoRiskMap", {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    worldCopyJump: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  geoLayer = L.layerGroup().addTo(map);
}

/* ============================================================================
   LOAD GEO RISK DATA
============================================================================ */

async function loadGeoRisk() {
  try {
    if (!geoLayer) return;

    geoLayer.clearLayers();

    /*
      Expected backend response:
      {
        countries: {
          IN: 12,
          US: 7,
          GB: 3
        }
      }
    */

    const data = await api_getGeoRisk();
    const countries = data?.countries || {};

    Object.entries(countries).forEach(([countryCode, count]) => {
      if (!count) return;

      const coords = getCountryCenter(countryCode);
      if (!coords) return;

      const color = getRiskColor(count);

      const marker = L.circleMarker(coords, {
        radius: Math.min(25, 6 + count * 2),
        color,
        fillColor: color,
        fillOpacity: 0.75,
        weight: 1,
      });

      marker.bindPopup(`
        <strong>Country:</strong> ${countryCode}<br/>
        <strong>Fraud Cases:</strong> ${count}
      `);

      geoLayer.addLayer(marker);
    });
  } catch (err) {
    console.error("Failed to load fraud geo map:", err);
    showToast("Failed to load fraud map", "error");
  }
}

/* ============================================================================
   HELPERS
============================================================================ */

function getRiskColor(count) {
  if (count >= 10) return "#dc2626"; // red
  if (count >= 5) return "#f59e0b"; // amber
  return "#16a34a"; // green
}

/*
  Minimal ISO country center lookup
  (extend if needed later)
*/
function getCountryCenter(code) {
  const centers = {
    IN: [22.9734, 78.6569],
    US: [37.0902, -95.7129],
    GB: [55.3781, -3.4360],
    AU: [-25.2744, 133.7751],
    CA: [56.1304, -106.3468],
  };
  return centers[code] || null;
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudMap,
};
