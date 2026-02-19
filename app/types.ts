export type ScheduleType = "daily" | "weekly_days" | "times_per_week";

export type Habit = {
  id: number;
  name: string;
  emoji?: string | null;
  schedule_type: ScheduleType;
  schedule_value: string; // JSON string
  is_active: number; // 0/1
};

export type HabitWithToday = Habit & {
  doneToday: boolean;
};