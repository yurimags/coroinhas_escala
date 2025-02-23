// components/ui/time-picker.tsx
import * as React from "react";
import { format } from "date-fns";

interface TimePickerProps {
  times: string[];
  onChange: (times: string[]) => void;
  interval?: number;
}

export function TimePicker({ times, onChange, interval = 30 }: TimePickerProps) {
  const generateTimeSlots = () => {
    const slots = [];
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    for (let i = 0; i < 24 * 60; i += interval) {
      date.setHours(Math.floor(i / 60));
      date.setMinutes(i % 60);
      slots.push(format(date, "HH:mm"));
    }
    return slots;
  };

  const toggleTime = (time: string) => {
    const newTimes = times.includes(time)
      ? times.filter(t => t !== time)
      : [...times, time];
    onChange(newTimes);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {generateTimeSlots().map(time => (
        <button
          key={time}
          type="button"
          onClick={() => toggleTime(time)}
          className={`rounded-md p-2 text-sm ${
            times.includes(time)
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {time}
        </button>
      ))}
    </div>
  );
}