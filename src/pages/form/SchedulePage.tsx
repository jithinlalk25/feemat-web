import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import ApiService from "@/lib/api/api";
import { toast } from "sonner";

type ScheduleType = "no_schedule" | "one_time" | "recurring";

interface ScheduleOption {
  id: ScheduleType;
  title: string;
  description: string;
}

const scheduleOptions: ScheduleOption[] = [
  {
    id: "no_schedule",
    title: "No Schedule",
    description: "Form will not be automatically sent",
  },
  {
    id: "one_time",
    title: "One Time",
    description: "Send form once at a specific date and time",
  },
  {
    id: "recurring",
    title: "Recurring",
    description: "Send form repeatedly on a schedule",
  },
];

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

type EndConditionType = "no_end_date" | "end_by_date";

interface EndConditionOption {
  id: EndConditionType;
  label: string;
}

const endConditionOptions: EndConditionOption[] = [
  { id: "no_end_date", label: "No end date" },
  { id: "end_by_date", label: "End by date" },
];

type TimeOption = {
  value: string;
  label: string;
};

const timeOptions: TimeOption[] = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, "0")}:00`,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

type WeekDay = {
  id: number;
  name: string;
  selected: boolean;
};

const weekDays: WeekDay[] = [
  { id: 1, name: "Monday", selected: true },
  { id: 2, name: "Tuesday", selected: false },
  { id: 3, name: "Wednesday", selected: false },
  { id: 4, name: "Thursday", selected: false },
  { id: 5, name: "Friday", selected: false },
  { id: 6, name: "Saturday", selected: false },
  { id: 7, name: "Sunday", selected: false },
];

type MonthDay = {
  id: number;
  name: string;
  selected: boolean;
};

const monthDays: MonthDay[] = Array.from({ length: 27 }, (_, i) => ({
  id: i + 2,
  name: `${i + 2}`,
  selected: i === 0,
}));

interface SchedulePageProps {
  formData: {
    _id: string;
    schedule: {
      type: ScheduleType;
      date?: string;
      time?: string;
      recurringTime?: string;
      frequency?: "daily" | "weekly" | "monthly";
      weekDays?: number[];
      monthDays?: number[];
      endCondition?: EndConditionType;
      endDate?: string;
    };
  };
  onUpdate: (updates: any) => void;
}

export const SchedulePage = ({ formData, onUpdate }: SchedulePageProps) => {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType>(
    formData.schedule?.type || "no_schedule"
  );

  const getInitialDate = () => {
    const schedule = formData.schedule;
    if (!schedule) {
      return undefined;
    }

    if (schedule.type === "one_time" && schedule.date && schedule.time) {
      const dateTime = new Date(`${schedule.date}T${schedule.time}`);
      return isNaN(dateTime.getTime()) ? undefined : dateTime;
    }

    return undefined;
  };

  const [date, setDate] = useState<Date | undefined>(getInitialDate());

  const [recurringTime, setRecurringTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(10, 0, 0, 0);
    return now;
  });

  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    (formData.schedule?.frequency as "daily" | "weekly" | "monthly") || "daily"
  );

  const [endCondition, setEndCondition] = useState<EndConditionType>(
    (formData.schedule?.endCondition as EndConditionType) || "no_end_date"
  );

  const getInitialEndDate = () => {
    const schedule = formData.schedule;
    if (schedule?.endDate) {
      return new Date(schedule.endDate);
    }
    return undefined;
  };

  const [endDate, setEndDate] = useState<Date | undefined>(getInitialEndDate());

  const [selectedWeekDays, setSelectedWeekDays] = useState<WeekDay[]>(
    weekDays.map((day) => ({
      ...day,
      selected: formData.schedule?.weekDays
        ? formData.schedule.weekDays.includes(day.id)
        : day.id === 1,
    }))
  );

  const [selectedMonthDays, setSelectedMonthDays] = useState<MonthDay[]>(
    monthDays.map((day) => ({
      ...day,
      selected: formData.schedule?.monthDays
        ? formData.schedule.monthDays.includes(day.id)
        : day.id === 1,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedSchedule === "one_time" && !date) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 2);
      defaultDate.setHours(10, 0, 0, 0);
      setDate(defaultDate);
    }
  }, [selectedSchedule]);

  const handleSaveSchedule = async () => {
    try {
      setIsSaving(true);
      let scheduleData;

      if (selectedSchedule === "no_schedule") {
        scheduleData = {
          schedule: {
            type: "no_schedule",
          },
        };
      } else if (selectedSchedule === "one_time") {
        if (!date) {
          toast.error("Please select a date and time");
          return;
        }

        scheduleData = {
          schedule: {
            type: "one_time",
            date: format(date, "yyyy-MM-dd"),
            time: format(date, "HH:mm"),
          },
        };
      } else {
        // Base recurring schedule data
        const baseRecurringData = {
          type: "recurring",
          recurringTime: recurringTime
            ? format(recurringTime, "HH:mm")
            : undefined,
          frequency: frequency,
          endCondition: endCondition,
          ...(endCondition === "end_by_date" && {
            endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          }),
        };

        // Add frequency-specific data
        let frequencyData = {};
        if (frequency === "weekly") {
          frequencyData = {
            weekDays: selectedWeekDays
              .filter((day) => day.selected)
              .map((day) => day.id),
          };
        } else if (frequency === "monthly") {
          frequencyData = {
            monthDays: selectedMonthDays
              .filter((day) => day.selected)
              .map((day) => day.id),
          };
        }

        scheduleData = {
          schedule: {
            ...baseRecurringData,
            ...frequencyData,
          },
        };
      }

      const loadingToast = toast.loading("Saving schedule...");
      await ApiService.updateForm(formData._id, scheduleData);
      toast.dismiss(loadingToast);
      toast.success("Schedule saved successfully");

      // Pass the complete schedule data to parent
      onUpdate(scheduleData);
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl px-8 pt-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Schedule Form
        </h2>
        <p className="text-sm text-gray-500">
          Choose when to automatically send this form to members
        </p>
      </div>

      <RadioGroup
        defaultValue={selectedSchedule}
        onValueChange={(value) => setSelectedSchedule(value as ScheduleType)}
        className="space-y-4"
      >
        {scheduleOptions.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={option.id} />
            <Label htmlFor={option.id} className="flex flex-col cursor-pointer">
              <span className="font-medium text-gray-900">{option.title}</span>
              <span className="text-sm text-gray-500">
                {option.description}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedSchedule !== "no_schedule" && (
        <div className="mt-6 space-y-4">
          {selectedSchedule === "one_time" ? (
            <div className="flex flex-col space-y-2 max-w-[260px]">
              <Label>Date and Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP HH:mm")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Select
                      value={date ? format(date, "HH:mm") : ""}
                      onValueChange={(time) => {
                        const [hours] = time.split(":");
                        const newDate = date || new Date();
                        newDate.setHours(parseInt(hours), 0);
                        setDate(new Date(newDate));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            selectedSchedule === "recurring" && (
              <div className="flex flex-col space-y-2 max-w-[200px]">
                <Label>Start Time</Label>
                <Select
                  value={recurringTime ? format(recurringTime, "HH:mm") : ""}
                  onValueChange={(time) => {
                    const [hours] = time.split(":");
                    const newDate = new Date();
                    newDate.setHours(parseInt(hours), 0);
                    setRecurringTime(newDate);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          )}

          {selectedSchedule === "recurring" && (
            <>
              <div className="space-y-2 max-w-[200px]">
                <Label>Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(value) =>
                    setFrequency(value as typeof frequency)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {frequency === "weekly" && (
                <div className="space-y-2">
                  <Label>Select Days</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {selectedWeekDays.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`day-${day.id}`}
                          checked={day.selected}
                          onChange={() => {
                            setSelectedWeekDays(
                              selectedWeekDays.map((d) =>
                                d.id === day.id
                                  ? { ...d, selected: !d.selected }
                                  : d
                              )
                            );
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`day-${day.id}`}>{day.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {frequency === "monthly" && (
                <div className="space-y-2">
                  <Label>Select Days of Month</Label>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {selectedMonthDays.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`month-day-${day.id}`}
                          checked={day.selected}
                          onChange={() => {
                            setSelectedMonthDays(
                              selectedMonthDays.map((d) =>
                                d.id === day.id
                                  ? { ...d, selected: !d.selected }
                                  : d
                              )
                            );
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`month-day-${day.id}`}>
                          {day.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-w-[200px]">
                <Label>End Condition</Label>
                <Select
                  value={endCondition}
                  onValueChange={(value) =>
                    setEndCondition(value as EndConditionType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {endConditionOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {endCondition === "end_by_date" && (
                <div className="flex flex-col space-y-2 max-w-[260px]">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="pt-4">
        <Button onClick={handleSaveSchedule} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Schedule"}
        </Button>
      </div>
    </div>
  );
};
