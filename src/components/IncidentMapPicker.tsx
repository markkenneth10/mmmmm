import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface IncidentMapPickerProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (lat: number, lng: number) => void;
  height?: string;
}

export const IncidentMapPicker: React.FC<IncidentMapPickerProps> = ({
  latitude,
  longitude,
  onChangeLocation,
  height = '240px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([latitude, longitude], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom high-contrast Pin icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: #DC2626; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><div style="width: 10px; height: 10px; background-color: #FFFFFF; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker([latitude, longitude], {
        icon: customIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeLocation(parseFloat(pos.lat.toFixed(5)), parseFloat(pos.lng.toFixed(5)));
      });

      map.on('click', e => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChangeLocation(parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
    }

    return () => {
      // Keep instance alive during state re-renders, cleanup on unmount
    };
  }, []);

  // Update marker position if prop changes externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - latitude) > 0.0001 || Math.abs(currentPos.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-sm z-10">
        <span className="text-slate-600 font-medium">Click map or drag pin to position</span>
        <span className="font-mono font-bold text-emerald-800">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>
    </div>
  );
};
