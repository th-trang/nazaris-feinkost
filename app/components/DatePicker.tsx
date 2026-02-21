"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: Date;
  label?: string;
  required?: boolean;
}

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_SHORT_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

export default function DatePicker({ 
  value, 
  onChange, 
  minDate,
  label,
  required 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Detect locale (simple check - in production you'd use next-intl)
  const isGerman = typeof window !== 'undefined' && 
    (window.location.pathname.includes('/de') || document.documentElement.lang === 'de');
  
  const daysShort = isGerman ? DAYS_SHORT_DE : DAYS_SHORT;
  const months = isGerman ? MONTHS_DE : MONTHS;

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const minDateNormalized = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return date < minDateNormalized;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return;
    
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const canGoToPreviousMonth = () => {
    if (!minDate) return true;
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    return prevMonth >= minMonth;
  };

  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const monthName = months[month - 1];
    return `${day}. ${monthName} ${year}`;
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all flex items-center justify-between group"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          <div>
            {value ? (
              <span className="text-gray-900 text-sm font-medium">{formatDisplayDate(value)}</span>
            ) : (
              <span className="text-gray-400 text-sm">{isGerman ? "Datum auswählen" : "Select date"}</span>
            )}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-green-500 to-green-600">
            <button
              type="button"
              onClick={goToPreviousMonth}
              disabled={!canGoToPreviousMonth()}
              className={`p-1.5 rounded-lg transition-all ${
                canGoToPreviousMonth() 
                  ? 'hover:bg-white/20 text-white' 
                  : 'text-white/30 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-white">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {daysShort.map((day) => (
              <div
                key={day}
                className="py-1.5 text-center text-xs font-semibold text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 p-1.5 gap-0.5">
            {days.map((day, index) => (
              <div key={index} className="aspect-square">
                {day !== null ? (
                  <button
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={isDateDisabled(day)}
                    className={`w-full h-full rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150
                      ${isDateSelected(day)
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                        : isToday(day)
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-500'
                          : isDateDisabled(day)
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                      }
                    `}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isGerman ? "Schließen" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
