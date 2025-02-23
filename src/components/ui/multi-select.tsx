// components/ui/multi-select.tsx
import * as React from "react";
import { Checkbox } from "./checkbox";

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleItem = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
      >
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selected.map(value => (
              <span
                key={value}
                className="bg-accent text-accent-foreground rounded px-2 py-1 text-xs"
              >
                {options.find(opt => opt.value === value)?.label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder || "Selecione..."}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
          <div className="max-h-60 overflow-y-auto p-2">
            {options.map(option => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-accent"
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleItem(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}