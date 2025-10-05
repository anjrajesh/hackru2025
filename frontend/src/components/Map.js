import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Marker icons for different categories
const createCustomIcon = (category) => {
  const colors = {
    'Assault': '#dc2626',
    'Harassment': '#ef4444',
    'Lighting Issue': '#f59e0b',
    'Suspicious Behavior': '#f97316',
    'Other': '#6b7280'
  };

  const color = colors[category] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 3px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function IncidentLayers({ incidents }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.MarkerClusterGroup || layer instanceof L.HeatLayer) {
        map.removeLayer(layer);
      }
    });

    if (incidents.length === 0) return;

    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    incidents.forEach((incident) => {
      const marker = L.marker([incident.latitude, incident.longitude], {
        icon: createCustomIcon(incident.category)
      });

      marker.bindPopup(`
        <div style="min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${incident.category}</h3>
          <p style="margin: 0 0 10px 0; color: #525252; font-size: 0.813rem; line-height: 1.5;">${incident.description}</p>
          <small style="color: #737373; font-size: 0.75rem;">${new Date(incident.timestamp).toLocaleString()}</small>
        </div>
      `);

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    // Create heatmap
    const heatData = incidents.map((incident) => [
      incident.latitude,
      incident.longitude,
      0.5 
    ]);

    const heat = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.5: 'yellow',
        0.7: 'orange',
        1.0: 'red'
      }
    });

    map.addLayer(heat);

    return () => {
      map.removeLayer(markers);
      map.removeLayer(heat);
    };
  }, [incidents]);

  return null;
}

function MapContent({ incidents, onMapClick, selectedLocation }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current._leafletMap = mapRef.current;
    }
  }, []);

  return (
    <>
      <MapClickHandler onMapClick={onMapClick} />
      <IncidentLayers incidents={incidents} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.latitude, incident.longitude]}
          icon={createCustomIcon(incident.category)}
        >
          <Popup>
            <div style={{ minWidth: '200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{incident.category}</h3>
              <p style={{ margin: '0 0 10px 0', color: '#525252', fontSize: '0.813rem', lineHeight: 1.5 }}>{incident.description}</p>
              <small style={{ color: '#737373', fontSize: '0.75rem' }}>{new Date(incident.timestamp).toLocaleString()}</small>
            </div>
          </Popup>
        </Marker>
      ))}
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                background-color: #1a1a1a;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })}
        >
          <Popup>Selected Location</Popup>
        </Marker>
      )}
    </>
  );
}

function Map({ incidents, onMapClick, selectedLocation }) {
  // Default center - New Brunswick
  const defaultCenter = [40.5019, -74.4505];
  const zoom = 16;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      ref={(map) => {
        if (map) {
          const container = map.getContainer();
          container._leafletMap = map;
        }
      }}
    >
      <MapContent
        incidents={incidents}
        onMapClick={onMapClick}
        selectedLocation={selectedLocation}
      />
    </MapContainer>
  );
}

export default Map;
