"use client";

import { useState, useEffect } from "react";
import {
  ETHIOPIAN_MILITARY_RANKS,
  ALL_MILITARY_RANK_VALUES,
} from "../constants/military-ranks";

interface MilitaryRankSelectProps {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}

export function MilitaryRankSelect({
  name = "rank",
  defaultValue = "",
  required = false,
  className = "",
  onChange,
}: MilitaryRankSelectProps) {
  const isPreset = defaultValue ? ALL_MILITARY_RANK_VALUES.includes(defaultValue) : false;
  const initialMode = defaultValue ? (isPreset ? defaultValue : "__OTHER__") : "";
  const initialCustom = !isPreset && defaultValue ? defaultValue : "";

  const [selectedOption, setSelectedOption] = useState<string>(initialMode);
  const [customRank, setCustomRank] = useState<string>(initialCustom);

  useEffect(() => {
    if (defaultValue) {
      if (ALL_MILITARY_RANK_VALUES.includes(defaultValue)) {
        setSelectedOption(defaultValue);
        setCustomRank("");
      } else {
        setSelectedOption("__OTHER__");
        setCustomRank(defaultValue);
      }
    } else {
      setSelectedOption("");
      setCustomRank("");
    }
  }, [defaultValue]);

  const isCustom = selectedOption === "__OTHER__";
  const finalValue = isCustom ? customRank.trim() : selectedOption;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedOption(val);
    if (val === "__OTHER__") {
      onChange?.(customRank.trim());
    } else {
      setCustomRank("");
      onChange?.(val);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomRank(val);
    onChange?.(val.trim());
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Hidden input to guarantee form submission receives the finalized rank string */}
      <input type="hidden" name={name} value={finalValue} />

      <select
        value={selectedOption}
        onChange={handleSelectChange}
        required={required && !isCustom}
        className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
      >
        <option value="">ማዕረግ ይምረጡ / Select Rank...</option>
        {ETHIOPIAN_MILITARY_RANKS.map((group) => (
          <optgroup
            key={group.groupNameAm}
            label={`${group.groupNameAm} (${group.groupNameEn})`}
          >
            {group.ranks.map((rank) => (
              <option key={rank.value} value={rank.value}>
                {rank.amharic} ({rank.english})
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="ሌላ / Other">
          <option value="__OTHER__">ሌላ (በእጅ አስገባ) / Other (Specify)...</option>
        </optgroup>
      </select>

      {isCustom && (
        <div className="mt-1.5">
          <input
            type="text"
            required={required}
            value={customRank}
            onChange={handleCustomChange}
            placeholder="ማዕረግ በእጅ ያስገቡ / Enter custom rank..."
            className="block w-full rounded border border-blue-400 dark:border-blue-600 dark:bg-slate-950 px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            የማዕረጉን ስም እዚህ ይጻፉ (Please enter rank title)
          </span>
        </div>
      )}
    </div>
  );
}
