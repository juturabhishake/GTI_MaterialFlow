"use client";
import React, { useState } from "react";
import { Check, X, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface User {
  EmployeeId: number;
  Username: string;
  Position: string;
}

interface AuditorMultiSelectProps {
  selected: string[];
  users: User[];
  onChange: (values: string[]) => void;
  showNoShift?: boolean;
  disabled?: boolean;
  excludedIds?: string[];
}

const NO_SHIFT = "No Shift";

const AuditorMultiSelect: React.FC<AuditorMultiSelectProps> = ({
  selected = [],
  users = [],
  onChange,
  showNoShift = false,
  disabled = false,
  excludedIds = [],
}) => {
  const [open, setOpen] = useState(false);
  const hasNoShift = selected.includes(NO_SHIFT);

  const handleRemove = (idToRemove: string) => {
    onChange(selected.filter((id) => id !== idToRemove));
  };

  const getDisplayLabel = (id: string) => {
    if (id === NO_SHIFT) return NO_SHIFT;
    const user = users.find((u) => String(u.EmployeeId) === id);
    return user ? `${user.Username} - ${user.EmployeeId}` : id;
  };

  return (
    <Popover open={open} onOpenChange={(val) => { if (!disabled) setOpen(val); }}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "min-h-[38px] w-full p-1.5 border border-dashed rounded-md flex flex-wrap gap-1 items-center",
            disabled
              ? "bg-muted/50 border-border cursor-not-allowed opacity-60 pointer-events-none"
              : "bg-card border-border hover:border-muted-foreground/40 cursor-pointer"
          )}
        >
          {selected.length === 0 && (
            <span className="text-[11px] text-muted-foreground ml-1">
              {disabled ? "Locked" : "Select Auditors"}
            </span>
          )}
          {selected.map((val) => (
            <Badge
              key={val}
              variant={val === NO_SHIFT ? "destructive" : "secondary"}
              className="h-6 text-[10px] pr-1 flex items-center gap-1"
            >
              {getDisplayLabel(val)}
              {!disabled && (
                <X
                  className="h-3 w-3 cursor-pointer hover:bg-black/20 rounded-full"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(val);
                  }}
                />
              )}
            </Badge>
          ))}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search auditor..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs p-2">No results.</CommandEmpty>
            {showNoShift && (
              <>
                <CommandGroup heading="Options">
                  <CommandItem
                    value={NO_SHIFT} 
                    onSelect={() => {
                      if (hasNoShift) {
                        handleRemove(NO_SHIFT);
                      } else {
                        onChange([NO_SHIFT]); 
                      }
                      setOpen(false);
                    }}
                    className="text-xs cursor-pointer"
                  >
                    <div className={cn("mr-2 flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-destructive", hasNoShift ? "bg-destructive text-white" : "opacity-50")}>
                      {hasNoShift && <Check className="h-3 w-3" />}
                    </div>
                    <Ban className="mr-1 h-3 w-3 text-destructive" /> No Shift
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup heading="Auditors" className="max-h-48 overflow-y-auto">
              {users.map((user) => {
                const userIdStr = String(user.EmployeeId);
                const isSelected = selected.includes(userIdStr);
                const isExcluded = excludedIds.includes(userIdStr);
                const isDisabled = hasNoShift || isExcluded;

                return (
                  <CommandItem
                    key={user.EmployeeId}
                    value={`${user.Username} ${user.EmployeeId}`} 
                    disabled={isDisabled}
                    onSelect={() => {
                      if (isDisabled) return;
                      
                      if (isSelected) {
                        handleRemove(userIdStr);
                      } else {
                        onChange([...selected.filter(id => id !== NO_SHIFT), userIdStr]);
                      }
                    }}
                    className={cn("text-xs cursor-pointer", isDisabled && "opacity-50 cursor-not-allowed")}
                  >
                    <div className={cn("mr-2 flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-white" : "opacity-50")}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {user.Username} - {user.EmployeeId}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AuditorMultiSelect;