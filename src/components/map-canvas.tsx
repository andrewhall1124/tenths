"use client";

import { useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPlace } from "@/lib/queries";

// Manhattan.
const CENTER: [number, number] = [40.7831, -73.9712];
const ZOOM = 12;

// A round score badge instead of Leaflet's default pin image (whose asset URLs
// break under bundlers). Shows the average score, or the category emoji when a
// place has no ratings yet.
function markerIcon(place: MapPlace): L.DivIcon {
  const hasScore = place.avgScore != null;
  const label = hasScore ? place.avgScore!.toFixed(1) : place.categoryEmoji;
  return L.divIcon({
    className: "",
    html: `<div class="map-pin${hasScore ? "" : " map-pin--empty"}">${label}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -18],
  });
}

export default function MapCanvas({ places }: { places: MapPlace[] }) {
  // Recompute icons only when the visible places change.
  const markers = useMemo(
    () => places.map((p) => ({ place: p, icon: markerIcon(p) })),
    [places],
  );

  return (
    <MapContainer
      center={CENTER}
      zoom={ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map(({ place, icon }) => (
        <Marker key={place.id} position={[place.lat, place.lng]} icon={icon}>
          <Popup>
            <div className="space-y-1">
              <div className="text-xs text-neutral-500">
                {place.categoryEmoji} {place.categoryName}
              </div>
              <Link
                href={`/place/${place.id}`}
                className="block font-semibold text-black underline"
              >
                {place.name}
              </Link>
              <div className="text-sm text-neutral-600">
                {place.avgScore != null
                  ? `${place.avgScore.toFixed(1)} · ${place.ratingCount} rating${
                      place.ratingCount === 1 ? "" : "s"
                    }`
                  : "No ratings yet"}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
