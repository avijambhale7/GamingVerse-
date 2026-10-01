/* =========================================================
   CAFÉ MAP
   OpenStreetMap (Leaflet) map of approved cafés. Pins open the
   café; "you are here" shows when Near me was used.
   Rendered by ../../Cafe.jsx in Map view.
========================================================= */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/cafe-map.css";

const escapeHtml = (text) =>
  String(text || "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

const pinIcon = (label) =>
  L.divIcon({
    className: "gv-map-pin",
    html: `<span>☕</span><b>${escapeHtml(label)}</b>`,
    iconSize: null,
    iconAnchor: [18, 40],
  });

export default function CafeMap({ cafes, coords, userLocation, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: [20.59, 78.96], // India, until pins are known
      zoom: 5,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const points = [];

    cafes.forEach((cafe) => {
      const at = coords[cafe.id];
      if (!at) return;
      points.push([at.lat, at.lng]);
      L.marker([at.lat, at.lng], { icon: pinIcon(cafe.name), title: cafe.name })
        .on("click", () => onSelectRef.current?.(cafe))
        .addTo(layer);
    });

    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#ec4899",
        fillOpacity: 1,
      })
        .bindTooltip("You are here")
        .addTo(layer);
    }

    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1)
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [cafes, coords, userLocation]);

  const missing = cafes.filter((cafe) => !coords[cafe.id]).length;

  return (
    <div className="gv-cafe-map-wrap">
      <div
        ref={containerRef}
        className="gv-cafe-map"
        aria-label="Map of gaming cafés"
      />
      {missing > 0 && (
        <p className="gv-cafe-map-note">
          {missing} café{missing === 1 ? " isn't" : "s aren't"} on the map yet —
          finding
          {missing === 1 ? " its" : " their"} location from the address…
        </p>
      )}
    </div>
  );
}
