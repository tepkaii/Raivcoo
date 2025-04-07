// components/ui/time-select.tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isEndTime?: boolean;
  startTime?: string; // Only needed for end time selection
}

interface TimeOption {
  value: string;
  label: string;
  period: string;
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  isEndTime = false,
  startTime,
}: TimeSelectProps) {
  const getTimePeriod = (hour: number): string => {
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  };

  const getDuration = (start: string, end: string): string => {
    const startHour = parseInt(start.split(":")[0]);
    const endHour = parseInt(end.split(":")[0]);
    const duration = endHour - startHour;
    if (duration <= 0) return `${24 + duration} hours`;
    return `${duration} hours`;
  };

  const getAvailableHours = (startTime?: string): TimeOption[] => {
    const options: TimeOption[] = [];
    const startHour = startTime ? parseInt(startTime.split(":")[0]) : 0;

    // If this is an end time selector, only show times after the start time
    const range = isEndTime
      ? Array.from({ length: 24 - startHour }, (_, i) => startHour + i + 1)
      : Array.from({ length: 24 }, (_, i) => i);

    range.forEach((hour) => {
      const period = getTimePeriod(hour);
      const hourStr = hour.toString().padStart(2, "0");
      const ampm = hour < 12 ? "AM" : "PM";
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

      options.push({
        value: `${hourStr}:00`,
        label: `${hour12}:00 ${ampm}`,
        period,
      });
    });

    return options;
  };

  const timeOptions = getAvailableHours(startTime);

  // Group times by period
  const groupedOptions: Record<string, TimeOption[]> = timeOptions.reduce(
    (acc, time) => {
      if (!acc[time.period]) acc[time.period] = [];
      acc[time.period].push(time);
      return acc;
    },
    {} as Record<string, TimeOption[]>
  );

  const getDisplayTime = (timeValue: string): string => {
    const hour = parseInt(timeValue.split(":")[0]);
    const ampm = hour < 12 ? "AM" : "PM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:00 ${ampm}`;
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={isEndTime ? "End time" : "Start time"}>
            {value && (
              <div className="flex items-center gap-2">
                <span>{getDisplayTime(value)}</span>
                {isEndTime && startTime && (
                  <span className="text-xs text-muted-foreground">
                    ({getDuration(startTime, value)})
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedOptions).map(([period, times]) => (
          <SelectGroup key={period}>
            <SelectLabel className="text-xs font-semibold text-muted-foreground">
              {period}
            </SelectLabel>
            {times.map((time) => (
              <SelectItem
                key={time.value}
                value={time.value}
                className="text-sm"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{time.label}</span>
                  {isEndTime && startTime && (
                    <span className="text-xs text-muted-foreground">
                      ({getDuration(startTime, time.value)})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
