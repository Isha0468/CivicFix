import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import axios from 'axios';

// SVG marker builder based on complaint status
const createStatusIcon = (status) => {
  let color = '#f59e0b'; // Amber (Reported/Verified)
  if (['Assigned', 'Accepted', 'In Progress'].includes(status)) {
    color = '#3b82f6'; // Blue
  } else if (status === 'Resolved') {
    color = '#10b981'; // Green
  } else if (['Closed', 'Rejected'].includes(status)) {
    color = '#64748b'; // Slate
  }

  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="30" height="30" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-status-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// SVG marker for selected/temporary marker
const selectIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ec4899" width="36" height="36" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.4));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  className: 'custom-select-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Map control: recenters view when coordinates change
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
};

// Map control: listens for click events to select a location
const MapClickHandler = ({ onMapClick, active }) => {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
};

const ComplaintMap = ({ 
  mode = 'view', // 'view' or 'select'
  complaints = [], 
  selectedLocation = null, 
  onLocationSelect = null, 
  center = [40.730610, -73.935242], // Default NY center
  zoom = 12
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Reverse Geocoding helper using OpenStreetMap Nominatim
  const performReverseGeocode = async (lat, lng) => {
    setReverseGeocoding(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'CivicFixApp/1.0' } }
      );
      if (response.data && response.data.display_name) {
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: response.data.display_name
        });
      } else {
        onLocationSelect({ latitude: lat, longitude: lng, address: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      onLocationSelect({ latitude: lat, longitude: lng, address: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } finally {
      setReverseGeocoding(false);
    }
  };

  const handleMapClick = (latlng) => {
    if (mode === 'select' && onLocationSelect) {
      const wrapped = latlng.wrap();
      performReverseGeocode(wrapped.lat, wrapped.lng);
    }
  };

  // GPS auto-locator
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        if (mode === 'select' && onLocationSelect) {
          performReverseGeocode(latitude, longitude);
        }
        setGpsLoading(false);
      },
      (error) => {
        console.error('GPS detection failed:', error);
        alert('Could not retrieve your location. Please drop a pin manually.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-premium border border-slate-200 dark:border-slate-800">
      
      {/* Geolocation trigger */}
      <button
        type="button"
        onClick={handleGPSDetect}
        disabled={gpsLoading}
        className="absolute top-20 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-darkbg-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-slate-50 dark:hover:bg-darkbg-700 transition-all"
        title="Detect My Location"
      >
        {gpsLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
        ) : (
          <Navigation className="h-5 w-5" />
        )}
      </button>

      {reverseGeocoding && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-darkbg-800/90 shadow-md text-xs font-medium text-slate-700 dark:text-slate-355 border border-slate-100 dark:border-slate-750">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
          Finding address...
        </div>
      )}

      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : mapCenter} />
        
        <MapClickHandler onMapClick={handleMapClick} active={mode === 'select'} />

        {/* View Mode: Render multiple complaint markers */}
        {mode === 'view' && complaints.map((complaint) => {
          if (!complaint.location || !complaint.location.coordinates) return null;
          const [lng, lat] = complaint.location.coordinates;
          return (
            <Marker 
              key={complaint._id} 
              position={[lat, lng]} 
              icon={createStatusIcon(complaint.status)}
            >
              <Popup>
                <div className="w-56 p-1.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 border border-brand-100/30">
                      {complaint.category?.name || 'Category'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {complaint.status}
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                    {complaint.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 flex items-start gap-1 line-clamp-2">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-350" />
                    {complaint.address}
                  </p>
                  <Link 
                    to={`/complaints/${complaint._id}`} 
                    className="block text-center w-full px-3 py-1.5 mt-2 rounded-lg text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Select Mode: Render one drag selection marker */}
        {mode === 'select' && selectedLocation && (
          <Marker 
            position={[selectedLocation.latitude, selectedLocation.longitude]} 
            icon={selectIcon}
          >
            <Popup>
              <div className="p-1 max-w-[200px]">
                <p className="text-xs font-semibold text-slate-800">Reporting Location</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-1">{selectedLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default ComplaintMap;
