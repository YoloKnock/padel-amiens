// ============================================
// Mini-carte d'un club — utilisée sur /club/[id]
// ============================================
// Leaflet a besoin du DOM (window, document) et de son CSS pour fonctionner.
// On le charge donc en client-only via cette wrapper 'use client'.
//
// Pourquoi pas un dynamic import next ? Parce qu'on garde le composant simple :
// le parent est server component, ce fichier 'use client' suffit comme barrière
// pour que tout l'arbre Leaflet (qui touche `window`) reste côté navigateur.

'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

interface ClubMapProps {
  latitude: number;
  longitude: number;
  clubName: string;
  city: string | null;
}

// Leaflet a un bug connu : les icônes par défaut pointent vers /marker-icon.png
// résolu par webpack côté Leaflet, mais ça ne marche pas avec Next.js. On
// recrée donc un default icon basé sur les SVG hébergés en CDN unpkg
// (officiels Leaflet). Pas idéal en termes de dépendance externe, mais c'est
// la solution standard pour Next.js + react-leaflet et ça marche tout le temps.
const DEFAULT_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function ClubMap({ latitude, longitude, clubName, city }: ClubMapProps) {
  // On attend l'hydratation avant de rendre la carte. Sans ça, react-leaflet
  // peut tenter d'accéder à window pendant le rendu côté serveur — même si
  // le composant est 'use client', le SSR essaie quand même de le rendre
  // une première fois puis hydrate.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder de la même hauteur que la carte pour éviter un layout shift
    return (
      <div className="w-full h-72 rounded-xl bg-slate-100 animate-pulse" aria-hidden />
    );
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: '18rem', width: '100%', borderRadius: '0.75rem' }}
    >
      {/* Tuiles OpenStreetMap — libres et gratuites */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={DEFAULT_ICON}>
        <Popup>
          <strong>{clubName}</strong>
          {city && (
            <>
              <br />
              {city}
            </>
          )}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
