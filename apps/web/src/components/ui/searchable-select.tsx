'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  sublabel?: string;
  group?: string;
}

interface SearchableSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  helperText?: string;
}

export function SearchableSelect({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  error,
  id,
  helperText,
}: SearchableSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normalize options
  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  // Filtered options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)),
    );
  }, [normalizedOptions, searchQuery]);

  // Selected option label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setHighlightedIndex(
        filteredOptions.findIndex((opt) => opt.value === value),
      );
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="space-y-1 w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-slate-700"
        >
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Main Trigger Button */}
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full min-h-[56px] h-14 px-3.5 bg-amber-50/40 border rounded-xl text-xs font-bold text-left transition flex items-center justify-between gap-2 cursor-pointer ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
              : error
              ? 'border-rose-400 ring-1 ring-rose-400 focus:bg-white'
              : isOpen
              ? 'border-amber-500 ring-2 ring-amber-400/40 bg-white shadow-sm'
              : 'border-amber-200 hover:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-500'
          }`}
        >
          <span
            className={`truncate block ${
              selectedOption ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-white border border-amber-300 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Search Input Filter */}
            <div className="p-2 border-b border-amber-100 bg-amber-50/50 sticky top-0 z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-amber-700 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Options */}
            <ul
              ref={listRef}
              role="listbox"
              tabIndex={-1}
              className="max-h-56 overflow-y-auto py-1 divide-y divide-amber-50/50"
            >
              {filteredOptions.length === 0 ? (
                <li className="p-3 text-center text-xs text-slate-400 font-medium">
                  No matching options found
                </li>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 text-amber-950 font-black'
                          : isHighlighted
                          ? 'bg-amber-50 text-slate-900'
                          : 'text-slate-700 hover:bg-amber-50/70'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-800 shrink-0 ml-2" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
      {helperText && !error && (
        <p className="text-[10px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
