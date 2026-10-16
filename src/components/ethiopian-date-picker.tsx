"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
} from "lucide-react";
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_WEEKDAYS,
  getCurrentEthiopianDate,
  getDaysInEthiopianMonth,
  ethiopianToGregorian,
  gregorianToEthiopian,
  parseEthiopianDateString,
  formatToEthiopianDate,
} from "@/lib/date-utils";

export interface EthiopianDatePickerProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (ethDateString: string, gregorianDate: Date) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
  /**
   * "ethiopian-date": The hidden input value is "YYYY-MM-DD" (Ethiopian Calendar date string).
   * "gregorian-iso": The hidden input value is converted to UTC ISO string (e.g. for visitDate).
   */
  mode?: "ethiopian-date" | "gregorian-iso";
  label?: string;
}

export function EthiopianDatePicker({
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "ቀን ይምረጡ (Select Date)",
  required = false,
  disabled = false,
  className = "",
  minYear = 1940,
  maxYear = 2035,
  mode = "ethiopian-date",
  label,
}: EthiopianDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const todayEth = useMemo(() => getCurrentEthiopianDate(), []);

  // Parse initial state
  const initialParts = useMemo(() => {
    const raw = value !== undefined ? value : defaultValue;
    if (!raw) return null;

    // Check if it's an ISO datetime
    if (raw.includes("T") || raw.includes("Z")) {
      try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          return gregorianToEthiopian(d);
        }
      } catch {
        // ignore
      }
    }

    // Try parsing as Ethiopian date string
    const parsed = parseEthiopianDateString(raw);
    if (parsed) {
      return {
        year: parsed.year,
        month: parsed.month,
        date: parsed.day,
        hour: 0,
        minute: 0,
      };
    }
    return null;
  }, [value, defaultValue]);

  const [selectedYear, setSelectedYear] = useState<number | null>(initialParts?.year ?? null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initialParts?.month ?? null);
  const [selectedDay, setSelectedDay] = useState<number | null>(initialParts?.date ?? null);

  // View state for browsing months without changing selection
  const [viewYear, setViewYear] = useState<number>(initialParts?.year ?? todayEth.year);
  const [viewMonth, setViewMonth] = useState<number>(initialParts?.month ?? todayEth.month);

  // Sync when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      if (!value) {
        setSelectedYear(null);
        setSelectedMonth(null);
        setSelectedDay(null);
      } else {
        let p: { year: number; month: number; date: number } | null = null;
        if (value.includes("T") || value.includes("Z")) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) p = gregorianToEthiopian(d);
        } else {
          const parsed = parseEthiopianDateString(value);
          if (parsed) p = { year: parsed.year, month: parsed.month, date: parsed.day };
        }
        if (p) {
          setSelectedYear(p.year);
          setSelectedMonth(p.month);
          setSelectedDay(p.date);
          setViewYear(p.year);
          setViewMonth(p.month);
        }
      }
    }
  }, [value]);

  // Close calendar on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const daysInViewMonth = getDaysInEthiopianMonth(viewYear, viewMonth);

  // Calculate day of week for the 1st of view month
  // Ethiopian 1st of month converted to European date tells us the weekday
  const firstDayWeekday = useMemo(() => {
    try {
      const gDate = ethiopianToGregorian(viewYear, viewMonth, 1);
      // getDay: 0 = Sunday, 1 = Monday ... 6 = Saturday
      // In Ethiopian calendars, Monday (ሰኞ) is typically the first column, so shift Sunday to 6
      const d = gDate.getDay();
      return (d + 6) % 7; // Monday = 0, Sunday = 6
    } catch {
      return 0;
    }
  }, [viewYear, viewMonth]);

  function handlePrevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(13);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 13) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSelectDate(day: number) {
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);

    const ethStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const greg = ethiopianToGregorian(viewYear, viewMonth, day);

    if (onChange) {
      onChange(ethStr, greg);
    }
    setIsOpen(false);
  }

  function handleSelectToday() {
    setViewYear(todayEth.year);
    setViewMonth(todayEth.month);
    handleSelectDate(todayEth.date);
  }

  function handleClear() {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    if (onChange) {
      onChange("", new Date());
    }
    setIsOpen(false);
  }

  // Display text in the input button
  const displayText = useMemo(() => {
    if (!selectedYear || !selectedMonth || !selectedDay) return "";
    const m = ETHIOPIAN_MONTHS.find((item) => item.id === selectedMonth);
    const mName = m ? m.amharic : `ወር ${selectedMonth}`;
    return `${mName} ${selectedDay}, ${selectedYear} ዓ.ም.`;
  }, [selectedYear, selectedMonth, selectedDay]);

  // Form value for hidden input
  const formValue = useMemo(() => {
    if (!selectedYear || !selectedMonth || !selectedDay) return "";
    if (mode === "gregorian-iso") {
      try {
        return ethiopianToGregorian(selectedYear, selectedMonth, selectedDay).toISOString();
      } catch {
        return "";
      }
    }
    // "ethiopian-date": YYYY-MM-DD
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  }, [selectedYear, selectedMonth, selectedDay, mode]);

  const currentMonthObj = ETHIOPIAN_MONTHS.find((m) => m.id === viewMonth) || ETHIOPIAN_MONTHS[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Hidden input for standard HTML Form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={formValue}
          required={required && !formValue}
        />
      )}

      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-lg border transition-all ${
            isOpen
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-400"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900" : ""}`}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            {displayText ? (
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {displayText}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-xs">{placeholder}</span>
            )}
          </div>
          {displayText && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              title="Clear date"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </div>

      {/* Calendar Dropdown Modal */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3.5 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500"
              >
                {ETHIOPIAN_MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.amharic} ({m.name})
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500 font-mono"
              >
                {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels (Monday to Sunday) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["ሰኞ", "ማክ", "ረቡ", "ሐሙ", "ዓር", "ቅዳ", "እሑ"].map((dayName, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-0.5"
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInViewMonth }, (_, i) => i + 1).map((day) => {
              const isSelected =
                selectedYear === viewYear &&
                selectedMonth === viewMonth &&
                selectedDay === day;
              const isToday =
                todayEth.year === viewYear &&
                todayEth.month === viewMonth &&
                todayEth.date === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : isToday
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-400 dark:border-blue-700"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Bottom Toolbar: Today / Clear */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              ዛሬ (Today: {todayEth.date}/{todayEth.month}/{todayEth.year})
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              አጽዳ (Clear)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ethiopian Date and Time Picker for scheduling appointments & queuing visits.
 */
export function EthiopianDateTimePicker({
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "የቀጠሮ ቀን እና ሰዓት ይምረጡ (Pick Date & Time)",
  required = false,
  disabled = false,
  className = "",
  label,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (isoString: string, ethFormatted: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const todayEth = useMemo(() => getCurrentEthiopianDate(), []);

  // Parse initial
  const initialData = useMemo(() => {
    const raw = value !== undefined ? value : defaultValue;
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const eth = gregorianToEthiopian(d);
        const hours = d.getHours();
        const minutes = d.getMinutes();
        return {
          year: eth.year,
          month: eth.month,
          date: eth.date,
          hours,
          minutes,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }, [value, defaultValue]);

  const [selectedYear, setSelectedYear] = useState<number | null>(initialData?.year ?? todayEth.year);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initialData?.month ?? todayEth.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(initialData?.date ?? todayEth.date);
  const [selectedHour, setSelectedHour] = useState<number>(initialData?.hours ?? 9);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialData?.minutes ?? 0);

  const [viewYear, setViewYear] = useState<number>(initialData?.year ?? todayEth.year);
  const [viewMonth, setViewMonth] = useState<number>(initialData?.month ?? todayEth.month);

  useEffect(() => {
    if (value !== undefined) {
      if (!value) {
        setSelectedDay(null);
      } else {
        try {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const eth = gregorianToEthiopian(d);
            setSelectedYear(eth.year);
            setSelectedMonth(eth.month);
            setSelectedDay(eth.date);
            setSelectedHour(d.getHours());
            setSelectedMinute(d.getMinutes());
            setViewYear(eth.year);
            setViewMonth(eth.month);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const daysInViewMonth = getDaysInEthiopianMonth(viewYear, viewMonth);

  const firstDayWeekday = useMemo(() => {
    try {
      const gDate = ethiopianToGregorian(viewYear, viewMonth, 1);
      const d = gDate.getDay();
      return (d + 6) % 7;
    } catch {
      return 0;
    }
  }, [viewYear, viewMonth]);

  function emitChange(year: number, month: number, day: number, hour: number, minute: number) {
    const greg = ethiopianToGregorian(year, month, day, hour, minute);
    const iso = greg.toISOString();
    const formatted = formatToEthiopianDate(greg, { includeTime: true });
    if (onChange) {
      onChange(iso, formatted);
    }
  }

  function handleSelectDate(day: number) {
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);
    emitChange(viewYear, viewMonth, day, selectedHour, selectedMinute);
  }

  function handleQuickDays(daysToAdd: number) {
    const targetGreg = new Date();
    targetGreg.setDate(targetGreg.getDate() + daysToAdd);
    targetGreg.setHours(selectedHour, selectedMinute, 0, 0);

    const eth = gregorianToEthiopian(targetGreg);
    setViewYear(eth.year);
    setViewMonth(eth.month);
    setSelectedYear(eth.year);
    setSelectedMonth(eth.month);
    setSelectedDay(eth.date);

    emitChange(eth.year, eth.month, eth.date, selectedHour, selectedMinute);
  }

  const formValue = useMemo(() => {
    if (!selectedYear || !selectedMonth || !selectedDay) return "";
    try {
      return ethiopianToGregorian(selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute).toISOString();
    } catch {
      return "";
    }
  }, [selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute]);

  const displayText = useMemo(() => {
    if (!selectedYear || !selectedMonth || !selectedDay) return "";
    const m = ETHIOPIAN_MONTHS.find((item) => item.id === selectedMonth);
    const mName = m ? m.amharic : `ወር ${selectedMonth}`;
    const timeStr = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    return `${mName} ${selectedDay}, ${selectedYear} ዓ.ም. (${timeStr})`;
  }, [selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={formValue}
          required={required && !formValue}
        />
      )}

      {/* Trigger */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-lg border transition-all ${
            isOpen
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-400"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}`}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            {displayText ? (
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {displayText}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-xs">{placeholder}</span>
            )}
          </div>
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* Dropdown Calendar + Time */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-76 sm:w-84 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3.5 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Quick Presets */}
          <div className="flex items-center justify-between gap-1 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ፈጣን ምርጫ:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickDays(0)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 font-medium"
              >
                ዛሬ (Today)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDays(1)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 font-medium"
              >
                ነገ (Tmrw)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDays(7)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 font-medium"
              >
                1 ሳምንት (+1Wk)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDays(30)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 font-medium"
              >
                1 ወር (+1Mo)
              </button>
            </div>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between gap-1 mb-2.5">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 1) {
                  setViewYear((y) => y - 1);
                  setViewMonth(13);
                } else {
                  setViewMonth((m) => m - 1);
                }
              }}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 border-0"
              >
                {ETHIOPIAN_MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.amharic}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 border-0 font-mono"
              >
                {Array.from({ length: 15 }, (_, i) => todayEth.year - 2 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                if (viewMonth === 13) {
                  setViewYear((y) => y + 1);
                  setViewMonth(1);
                } else {
                  setViewMonth((m) => m + 1);
                }
              }}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["ሰኞ", "ማክ", "ረቡ", "ሐሙ", "ዓር", "ቅዳ", "እሑ"].map((dayName, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-0.5"
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {Array.from({ length: daysInViewMonth }, (_, i) => i + 1).map((day) => {
              const isSelected =
                selectedYear === viewYear &&
                selectedMonth === viewMonth &&
                selectedDay === day;
              const isToday =
                todayEth.year === viewYear &&
                todayEth.month === viewMonth &&
                todayEth.date === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={`h-7 w-7 rounded-md text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : isToday
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-400 dark:border-blue-700"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Selector */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> ሰዓት (Time):
            </span>
            <div className="flex items-center gap-1">
              {/* Hours */}
              <select
                value={selectedHour}
                onChange={(e) => {
                  const h = parseInt(e.target.value, 10);
                  setSelectedHour(h);
                  if (selectedYear && selectedMonth && selectedDay) {
                    emitChange(selectedYear, selectedMonth, selectedDay, h, selectedMinute);
                  }
                }}
                className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-1.5 py-1 border-0"
              >
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-xs font-bold">:</span>
              {/* Minutes */}
              <select
                value={selectedMinute}
                onChange={(e) => {
                  const m = parseInt(e.target.value, 10);
                  setSelectedMinute(m);
                  if (selectedYear && selectedMonth && selectedDay) {
                    emitChange(selectedYear, selectedMonth, selectedDay, selectedHour, m);
                  }
                }}
                className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-1.5 py-1 border-0"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => (
                  <option key={min} value={min}>
                    {String(min).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              አረጋግጥ (Confirm)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
