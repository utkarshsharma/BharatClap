import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/bookings";

export function useRealtime(bookingId: string | null) {
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { data } = useQuery({
    queryKey: ["booking-realtime", bookingId],
    queryFn: () => bookingService.getBookingById(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 10000, // Poll every 10 seconds for live updates
  });

  useEffect(() => {
    if (data) {
      setBookingStatus(data.status);
      setLastUpdate(new Date());
    }
  }, [data]);

  return { bookingStatus, lastUpdate, booking: data };
}
