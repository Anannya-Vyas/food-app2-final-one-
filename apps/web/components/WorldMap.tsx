'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface Region {
  id: string;
  name: string;
  country: string;
  latitude?: number;
  longitude?: number;
  recipeCount?: number;
}

interface WorldMapProps {
  regions: Region[];
  onRegionSelect: (region: Region) => void;
  selectedRegion: Region | null;
}

// Approximate coordinates for known regions/countries
const REGION_COORDS: Record<string, [number, number]> = {
  'American': [37.09, -95.71],
  'British': [51.51, -0.13],
  'Canadian': [56.13, -106.35],
  'Chinese': [35.86, 104.19],
  'Croatian': [45.10, 15.20],
  'Dutch': [52.13, 5.29],
  'Egyptian': [26.82, 30.80],
  'Filipino': [12.88, 121.77],
  'French': [46.23, 2.21],
  'Greek': [39.07, 21.82],
  'Indian': [20.59, 78.96],
  'Irish': [53.41, -8.24],
  'Italian': [41.87, 12.57],
  'Jamaican': [18.11, -77.30],
  'Japanese': [36.20, 138.25],
  'Kenyan': [-0.02, 37.91],
  'Malaysian': [4.21, 101.98],
  'Mexican': [23.63, -102.55],
  'Moroccan': [31.79, -7.09],
  'Polish': [51.92, 19.15],
  'Portuguese': [39.40, -8.22],
  'Russian': [61.52, 105.32],
  'Spanish': [40.46, -3.75],
  'Thai': [15.87, 100.99],
  'Tunisian': [33.89, 9.54],
  'Turkish': [38.96, 35.24],
  'Ukrainian': [48.38, 31.17],
  'Vietnamese': [14.06, 108.28],
  'Punjabi': [31.15, 75.34],
  'Punjab': [31.15, 75.34],
  'Kashmir': [34.08, 74.80],
  'Oaxaca': [17.07, -96.72],
  'Tuscany': [43.77, 11.25],
  'Sichuan': [30.65, 104.07],
  'Kyoto': [35.01, 135.77],
  'Hokkaido': [43.06, 142.79],
  'Kerala': [10.85, 76.27],
  'Marrakech': [31.63, -8.01],
  'Jerusalem': [31.77, 35.22],
  'Levant': [33.85, 35.86],
  'Emilia-Romagna': [44.59, 11.34],
  'La Vera': [40.12, -5.89],
  'Périgord': [45.18, 0.72],
  'Aleppo': [36.20, 37.16],
  'Sava': [-14.45, 49.29],
  'Mindanao': [7.87, 124.86],
  'Tunis': [36.82, 10.17],
  'Gyeonggi': [37.41, 127.52],
  'International': [20, 0],
};

function getCoords(region: Region): [number, number] {
  // Try exact name match
  if (REGION_COORDS[region.name]) return REGION_COORDS[region.name];
  if (REGION_COORDS[region.country]) return REGION_COORDS[region.country];
  // Try partial match
  for (const [key, coords] of Object.entries(REGION_COORDS)) {
    if (region.name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(region.name.toLowerCase())) {
      return coords;
    }
  }
  // Random spread for unknown regions
  return [Math.random() * 140 - 70, Math.random() * 340 - 170];
}

export default function WorldMap({ regions, onRegionSelect, selectedRegion }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').CircleMarker[]>([]);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || initializingRef.current) return;
    initializingRef.current = true;

    // Dynamic import to avoid SSR
    import('leaflet').then(L => {
      // Double-check after async import
      if (mapInstanceRef.current || !mapRef.current) {
        initializingRef.current = false;
        return;
      }
      // Check if leaflet already initialized this container
      if ((mapRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) {
        initializingRef.current = false;
        return;
      }

      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tile layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

      mapInstanceRef.current = map;
      initializingRef.current = false;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add markers when regions load
  useEffect(() => {
    if (!mapInstanceRef.current || regions.length === 0) return;

    import('leaflet').then(L => {
      // Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      regions.forEach(region => {
        const coords = getCoords(region);
        const isSelected = selectedRegion?.id === region.id;
        const count = region.recipeCount || 1;
        const radius = Math.min(6 + Math.sqrt(count) * 2, 20);

        const marker = L.circleMarker(coords, {
          radius,
          fillColor: isSelected ? '#feb956' : '#a03f28',
          color: isSelected ? '#ffddb4' : '#c0573e',
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          fillOpacity: isSelected ? 0.95 : 0.75,
        });

        marker.bindTooltip(`
          <div style="font-family: Manrope, sans-serif; padding: 4px 8px;">
            <strong style="color: #a03f28;">${region.name}</strong><br/>
            <span style="font-size: 11px; color: #56423d;">${region.country} · ${count} recipe${count !== 1 ? 's' : ''}</span>
          </div>
        `, { className: 'leaflet-tooltip-custom' });

        marker.on('click', () => onRegionSelect(region));
        marker.addTo(mapInstanceRef.current!);
        markersRef.current.push(marker);
      });
    });
  }, [regions, selectedRegion, onRegionSelect]);

  // Pan to selected region
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRegion) return;
    const coords = getCoords(selectedRegion);
    mapInstanceRef.current.flyTo(coords, 5, { duration: 1.5 });
  }, [selectedRegion]);

  return (
    <>
      <style>{`
        .leaflet-tooltip-custom {
          background: rgba(252, 249, 246, 0.95);
          border: 1px solid #ddc0ba;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          padding: 0;
        }
        .leaflet-tooltip-custom::before { display: none; }
        .leaflet-container { background: #0a0a0a; }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </>
  );
}
