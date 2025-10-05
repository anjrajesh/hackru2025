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
    'Assault': '#c0392b',
    'Harassment': '#e74c3c',
    'Lighting Issue': '#f39c12',
    'Suspicious Behavior': '#e67e22',
    'Other': '#95a5a6'
  };

  const color = colors[category] || '#95a5a6';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #333;">${incident.category}</h3>
          <p style="margin: 0 0 8px 0; color: #666;">${incident.description}</p>
          <small style="color: #999;">${new Date(incident.timestamp).toLocaleString()}</small>
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
            <div style={{ minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{incident.category}</h3>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>{incident.description}</p>
              <small style={{ color: '#999' }}>{new Date(incident.timestamp).toLocaleString()}</small>
            </div>
          </Popup>
        </Marker>
      ))}
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
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
