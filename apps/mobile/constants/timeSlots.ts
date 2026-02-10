export interface TimeSlot {
  label: string;
  value: number;
  hour: number;
}

export const TIME_SLOTS: TimeSlot[] = [
  { label: "8:00 AM", value: 8, hour: 8 },
  { label: "9:00 AM", value: 9, hour: 9 },
  { label: "10:00 AM", value: 10, hour: 10 },
  { label: "11:00 AM", value: 11, hour: 11 },
  { label: "12:00 PM", value: 12, hour: 12 },
  { label: "1:00 PM", value: 13, hour: 13 },
  { label: "2:00 PM", value: 14, hour: 14 },
  { label: "3:00 PM", value: 15, hour: 15 },
  { label: "4:00 PM", value: 16, hour: 16 },
  { label: "5:00 PM", value: 17, hour: 17 },
  { label: "6:00 PM", value: 18, hour: 18 },
  { label: "7:00 PM", value: 19, hour: 19 },
  { label: "8:00 PM", value: 20, hour: 20 },
  { label: "9:00 PM", value: 21, hour: 21 },
];

export const getTimeSlotLabel = (hour: number): string => {
  const slot = TIME_SLOTS.find(s => s.hour === hour);
  return slot?.label || `${hour}:00`;
};

export const isValidTimeSlot = (hour: number): boolean => {
  return TIME_SLOTS.some(s => s.hour === hour);
};
