import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
    value: { lat: number; lng: number } | null;
    onChange: (coords: { lat: number; lng: number } | null) => void;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    // Default center: Bolivia (La Paz region)
    const defaultCenter: L.LatLngExpression = [-16.5, -68.15];
    const defaultZoom = 6;

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize map only once
        if (!mapRef.current) {
            const map = L.map(mapContainerRef.current).setView(
                value ? [value.lat, value.lng] : defaultCenter,
                value ? 12 : defaultZoom
            );

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // Add click handler
            map.on('click', (e: L.LeafletMouseEvent) => {
                const { lat, lng } = e.latlng;
                onChange({ lat, lng });
            });

            mapRef.current = map;
        }

        return () => {
            // Cleanup on unmount
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update marker when value changes
    useEffect(() => {
        if (!mapRef.current) return;

        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }

        // Add new marker if value exists
        if (value) {
            const marker = L.marker([value.lat, value.lng]).addTo(mapRef.current);
            marker.bindPopup(`Lat: ${value.lat.toFixed(6)}<br>Lng: ${value.lng.toFixed(6)}`);
            markerRef.current = marker;

            // Center map on marker
            mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom(), {
                animate: true,
            });
        }
    }, [value]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1">
                    <MapPin size={14} className="text-emerald-600" />
                    Ubicación GPS (Opcional)
                </label>
                {value && (
                    <button
                        onClick={() => onChange(null)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                        type="button"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            <div
                ref={mapContainerRef}
                className="w-full h-64 rounded-lg border-2 border-stone-200 shadow-sm overflow-hidden"
                style={{ zIndex: 1 }}
            />

            {value && (
                <div className="text-xs text-stone-600 bg-emerald-50 p-2 rounded border border-emerald-200">
                    <span className="font-bold">Coordenadas:</span> Lat: {value.lat.toFixed(6)}, Lng: {value.lng.toFixed(6)}
                </div>
            )}

            <p className="text-xs text-stone-500 italic">
                Haz clic en el mapa para seleccionar la ubicación de la finca
            </p>
        </div>
    );
}
