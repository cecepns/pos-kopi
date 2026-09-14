import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Bike,
  RefreshCw,
  Phone,
  Clock,
  TrendingUp,
  Coffee,
  Navigation,
  ShieldCheck,
  Search,
  Filter,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { formatRupiah, formatDateTimeIndo } from "../utils/formatters";
import { useAuth } from "../hooks/useAuth";
import Badge from "../components/common/Badge";
import toast from "react-hot-toast";

export default function LiveTracking() {
  const { isOwner, isAdmin } = useAuth();
  const [riders, setRiders] = useState([]);
  const [summary, setSummary] = useState({
    total_riders: 0,
    total_on_duty: 0,
    total_active_gps: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filterDuty, setFilterDuty] = useState("all"); // 'all' | 'duty' | 'active'
  const [selectedRider, setSelectedRider] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Fetch live locations
  const fetchLiveLocations = async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.TRACKING.LIVE_LOCATIONS);
      if (res.success && res.data) {
        setRiders(res.data.riders || []);
        setSummary(res.data.summary || {});
        setLastFetchTime(new Date());
      }
    } catch (err) {
      console.warn("Error loading live locations:", err.message);
      if (isManual) toast.error("Gagal memperbarui posisi GPS: " + err.message);
    } finally {
      if (isManual) setLoading(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Jakarta / Central coordinates
      const defaultLat = -6.2088;
      const defaultLng = 106.8456;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;
    }

    fetchLiveLocations(true);

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchLiveLocations(false);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update Markers on Map when riders change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = [];

    riders.forEach((rider) => {
      // Skip if rider has never transmitted GPS coordinate
      if (!rider.current_lat || !rider.current_lng) return;

      const lat = Number(rider.current_lat);
      const lng = Number(rider.current_lng);
      bounds.push([lat, lng]);

      const isActive = rider.tracking_status === "active";
      const isIdle = rider.tracking_status === "idle";

      const pinBg = isActive
        ? "bg-emerald-600 border-emerald-300 ring-4 ring-emerald-400/30"
        : isIdle
        ? "bg-amber-500 border-amber-300 ring-4 ring-amber-400/30"
        : "bg-gray-500 border-gray-300 ring-2 ring-gray-400/20";

      // Custom Div Icon
      const customIcon = L.divIcon({
        className: "custom-rider-marker",
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group">
            <div class="px-2 py-0.5 rounded-md bg-espresso text-cream-light font-bold text-[10px] shadow-md border border-amber-200/50 whitespace-nowrap mb-1">
              ${rider.name.split(" ")[0]}
            </div>
            <div class="w-9 h-9 rounded-full ${pinBg} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
            <div class="w-2 h-2 bg-espresso rotate-45 -mt-1 shadow-xs"></div>
          </div>
        `,
        iconSize: [40, 56],
        iconAnchor: [20, 56],
        popupAnchor: [0, -56],
      });

      const popupHtml = `
        <div style="font-family: inherit; padding: 4px; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #261b17;">${rider.name}</strong>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; background: ${
              isActive ? "#ecfdf5; color: #047857;" : "#fef3c7; color: #b45309;"
            }">
              ${isActive ? "Online" : "Standby"}
            </span>
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Kode: <b>${rider.code}</b></div>
          <div style="font-size: 11px; color: #261b17; margin-bottom: 2px;">Penjualan Hari Ini: <b>${formatRupiah(
            rider.today_sales_amount || 0
          )}</b> (${rider.today_cups_sold || 0} cup)</div>
          <div style="font-size: 10px; color: #9ca3af; margin-top: 6px;">Update: ${
            rider.last_location_time ? new Date(rider.last_location_time).toLocaleTimeString("id-ID") : "-"
          }</div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupHtml);

      marker.on("click", () => {
        setSelectedRider(rider);
      });

      markersGroup.addLayer(marker);
    });

    // Auto-fit bounds if we have points and not manually zoomed
    if (bounds.length > 0 && !selectedRider) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [riders]);

  // Center on rider
  const handleFocusRider = (rider) => {
    setSelectedRider(rider);
    if (mapInstanceRef.current && rider.current_lat && rider.current_lng) {
      mapInstanceRef.current.flyTo([Number(rider.current_lat), Number(rider.current_lng)], 15, {
        duration: 1.2,
      });
    } else {
      toast("Rider belum memancarkan koordinat GPS hari ini", { icon: "📍" });
    }
  };

  const filteredRiders = riders.filter((r) => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());

    const matchDuty =
      filterDuty === "all" ||
      (filterDuty === "duty" && r.is_duty === 1) ||
      (filterDuty === "active" && r.tracking_status === "active");

    return matchSearch && matchDuty;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-espresso">
              Live Tracking Armada Rider
            </h1>
            <Badge variant="coffee">GPS Realtime</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Pantau pergerakan posisi armada kopi keliling, status keliling, dan omzet harian secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLiveLocations(true)}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white hover:bg-gray-50 text-coffee-800 border border-amber-200/80 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Update Lokasi</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-amber-200/70 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-50 text-coffee-700 flex items-center justify-center shrink-0">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Armada
            </span>
            <span className="text-lg sm:text-xl font-black text-espresso">
              {summary.total_riders || 0} Rider
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-amber-200/70 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Sedang Keliling
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-700">
              {summary.total_on_duty || 0} Rider
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              GPS Aktif (Online)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600">
              {summary.total_active_gps || 0} Rider
            </span>
          </div>
        </div>
      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Leaflet Map Canvas (Takes 8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-amber-200/80 shadow-sm overflow-hidden h-[480px] sm:h-[560px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Legend Overlay */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-gray-200 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
            <div className="font-bold text-gray-800 text-[11px]">Legenda Status:</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-gray-600">Aktif Bergerak (&lt;15m)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-gray-600">Keliling / Idle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
              <span className="text-gray-600">Offline / Belum GPS</span>
            </div>
          </div>
        </div>

        {/* Riders List Sidebar (Takes 4 cols on desktop) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-amber-200/80 shadow-sm p-4 flex flex-col h-[480px] sm:h-[560px]">
          <div className="space-y-2.5 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-espresso">Daftar Armada Rider</h3>
              <span className="text-[11px] text-gray-400 font-semibold">
                {filteredRiders.length} ditemukan
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau kode rider..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-espresso outline-hidden focus:ring-2 focus:ring-coffee-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold text-gray-600 text-center">
              <button
                type="button"
                onClick={() => setFilterDuty("all")}
                className={`py-1 rounded-lg transition-colors ${
                  filterDuty === "all" ? "bg-white text-espresso shadow-xs" : "hover:text-espresso"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterDuty("duty")}
                className={`py-1 rounded-lg transition-colors ${
                  filterDuty === "duty" ? "bg-white text-espresso shadow-xs" : "hover:text-espresso"
                }`}
              >
                Keliling
              </button>
              <button
                type="button"
                onClick={() => setFilterDuty("active")}
                className={`py-1 rounded-lg transition-colors ${
                  filterDuty === "active" ? "bg-white text-espresso shadow-xs" : "hover:text-espresso"
                }`}
              >
                Online
              </button>
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 py-2 space-y-1">
            {filteredRiders.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Tidak ada rider yang sesuai filter.
              </div>
            ) : (
              filteredRiders.map((rider) => {
                const isActive = rider.tracking_status === "active";
                const isSelected = selectedRider?.id === rider.id;
                const hasLocation = rider.current_lat && rider.current_lng;

                return (
                  <div
                    key={rider.id}
                    onClick={() => handleFocusRider(rider)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-50/80 border border-amber-300 shadow-xs"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-600 font-bold"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-espresso flex items-center gap-1.5">
                            {rider.name}
                            <span
                              className={`w-2 h-2 rounded-full inline-block ${
                                isActive
                                  ? "bg-emerald-500 animate-pulse"
                                  : rider.is_duty === 1
                                  ? "bg-amber-500"
                                  : "bg-gray-300"
                              }`}
                            />
                          </div>
                          <div className="text-[11px] text-gray-400">{rider.code}</div>
                        </div>
                      </div>

                      {hasLocation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusRider(rider);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-coffee-700 text-xs shadow-2xs"
                          title="Fokus ke Peta"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Rider Performance Snippet */}
                    <div className="mt-2.5 pt-2 border-t border-gray-100/60 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">
                        Omzet:{" "}
                        <strong className="text-coffee-800">
                          {formatRupiah(rider.today_sales_amount || 0)}
                        </strong>
                      </span>
                      <span className="text-gray-400">
                        {rider.today_cups_sold || 0} cup terjual
                      </span>
                    </div>

                    {/* Contact button if phone available */}
                    {rider.phone && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          {rider.last_location_time
                            ? `GPS: ${new Date(rider.last_location_time).toLocaleTimeString("id-ID")}`
                            : "Belum update"}
                        </span>
                        <a
                          href={`https://wa.me/${rider.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                        >
                          <Phone className="w-2.5 h-2.5" /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
