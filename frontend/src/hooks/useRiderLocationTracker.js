import { useState, useEffect, useRef } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

export function useRiderLocationTracker() {
  const { isRider, riderInfo } = useAuth();
  const [isOnDuty, setIsOnDuty] = useState(() => {
    return localStorage.getItem("kopi_pos_rider_duty") === "true";
  });
  const [lastCoords, setLastCoords] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const sendLocation = async (lat, lng, dutyStatus = 1) => {
    if (!isRider || !riderInfo?.id) return;
    setIsSending(true);
    try {
      await request.post(API_ENDPOINTS.TRACKING.UPDATE_LOCATION, {
        rider_id: riderInfo.id,
        lat,
        lng,
        is_duty: dutyStatus,
      });
      setLastCoords({ lat, lng });
      setLastSentTime(new Date());
    } catch (err) {
      console.warn("Failed to broadcast rider location:", err.message);
    } finally {
      setIsSending(false);
    }
  };

  const getAndBroadcast = (dutyStatus = 1) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendLocation(pos.coords.latitude, pos.coords.longitude, dutyStatus);
      },
      (err) => {
        console.warn("Geolocation watch error:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const toggleDuty = () => {
    if (!isRider) return;
    const newStatus = !isOnDuty;
    setIsOnDuty(newStatus);
    localStorage.setItem("kopi_pos_rider_duty", String(newStatus));

    if (newStatus) {
      toast.success("Mode Keliling Aktif! Lokasi GPS Anda mulai dipantau oleh Owner & Kasir.");
      getAndBroadcast(1);
    } else {
      toast("Mode Keliling Dinonaktifkan.", { icon: "🛑" });
      if (lastCoords) {
        sendLocation(lastCoords.lat, lastCoords.lng, 0);
      }
    }
  };

  useEffect(() => {
    if (!isRider || !isOnDuty) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current) navigator.geolocation?.clearWatch(watchIdRef.current);
      return;
    }

    // Broadcast immediately on mount if active
    getAndBroadcast(1);

    // Set recurring ping every 30 seconds
    intervalRef.current = setInterval(() => {
      getAndBroadcast(1);
    }, 30000);

    // Also watch movement
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLastCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        null,
        { enableHighAccuracy: true, maximumAge: 15000 }
      );
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current) navigator.geolocation?.clearWatch(watchIdRef.current);
    };
  }, [isRider, isOnDuty, riderInfo]);

  return {
    isOnDuty,
    toggleDuty,
    lastCoords,
    lastSentTime,
    isSending,
  };
}
