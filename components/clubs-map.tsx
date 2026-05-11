// ============================================
// Carte multi-clubs pour /jouer
// ============================================
// Affiche tous les clubs réservables sur une carte unique, avec un marker
// par club et un popup contenant nom + ville + lien vers la fiche.
//
// Comme pour ClubMap, Leaflet importe `window` au top-level. Ce fichier est
// chargé via dynamic import depuis ClubsMapClient (cf. /jouer).

'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L, { type LatLngBoundsExpression } from 'leaflet';

import { REFERENCE_POINT } from '@/lib/constants';
import type { BookableClub } from '@/types/tournament';

interface ClubsMapProps {
  clubs: (BookableClub & { distance_km: number | null })[];
}

// Icône standard partagée avec ClubMap (cf. commentaire dans club-map.tsx)
const DEFAULT_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function ClubsMap({ clubs }: ClubsMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filtre les clubs avec coords valides (les autres ne peuvent pas être placés)
  const placeable = clubs.filter(
    (c): c is typeof c & { latitude: number; longitude: number } =>
      c.latitude !== null && c.longitude !== null
  );

  // Bounds qui englobent tous les markers + Cagny (le point de référence).
  // Si on ne fait que les clubs, le zoom peut être trop serré.
  const bounds: LatLngBoundsExpression = (() => {
    const points: [number, number][] = [
      [REFERENCE_POINT.latitude, REFERENCE_POINT.longitude],
      ...placeable.map((c) => [c.latitude, c.longitude] as [number, number]),
    ];
    return points;
  })();

  if (!mounted) {
    return (
      <div className="w-full h-[500px] rounded-xl bg-slate-100 animate-pulse" aria-hidden />
    );
  }

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [30, 30] }}
      scrollWheelZoom={false}
      style={{ height: '500px', width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Repère de référence (Amiens Padel Cagny) — distingué par un cercle */}
      <Marker
        position={[REFERENCE_POINT.latitude, REFERENCE_POINT.longitude]}
        icon={DEFAULT_ICON}
      >
        <Popup>
          <strong>Référence : {REFERENCE_POINT.name}</strong>
          <br />
          Centre de calcul des distances
        </Popup>
      </Marker>

      {/* Un marker par club */}
      {placeable.map((club) => (
        <Marker key={club.id} position={[club.latitude, club.longitude]} icon={DEFAULT_ICON}>
          <Popup>
            <strong>{club.name}</strong>
            {club.city && (
              <>
                <br />
                {club.city}
              </>
            )}
            {club.distance_km !== null && (
              <>
                <br />
                <span style={{ color: '#64748b' }}>{club.distance_km} km de Cagny</span>
              </>
            )}
            <br />
            <a
              href={`/club/${club.id}`}
              style={{
                display: 'inline-block',
                marginTop: 4,
                color: '#059669',
                fontWeight: 500,
              }}
            >
              Voir la fiche →
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
