"use client";
import { CONFIG_LIMITS } from "@/config/config";
export function GoalSelect({
  value,
  onChange,
  label = "First to",
}: {
  value: number;
  onChange(value: number): void;
  label?: string;
}) {
  const options = CONFIG_LIMITS.goals.includes(value)
    ? CONFIG_LIMITS.goals
    : [...CONFIG_LIMITS.goals, value].sort((a, b) => a - b);
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {options.map((goal) => (
        <option key={goal} value={goal}>
          {goal} {goal === 1 ? "round" : "rounds"}
        </option>
      ))}
    </select>
  );
}
