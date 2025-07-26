import React, { useState, useRef, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize with a valid date, defaulting to current date if value is invalid
  const initializeDate = () => {
    if (value && isValid(new Date(value))) {
      return new Date(value);
    }
    return new Date(); // Default to current date
  };
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initializeDate());
  const [hours, setHours] = useState(selectedDate ? selectedDate.getHours() : new Date().getHours());
  const [minutes, setMinutes] = useState(selectedDate ? selectedDate.getMinutes() : new Date().getMinutes());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && isValid(new Date(value))) {
      const date = new Date(value);
      setSelectedDate(date);
      setHours(date.getHours());
      setMinutes(date.getMinutes());
    } else if (!selectedDate) {
      // If no valid value and no selectedDate, set to current date
      const now = new Date();
      setSelectedDate(now);
      setHours(now.getHours());
      setMinutes(now.getMinutes());
    }
  }, [value]);

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setSelectedDate(newDate);
      onChange(newDate.toISOString());
    }
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newHours);
      newDate.setMinutes(newMinutes);
      setSelectedDate(newDate);
      onChange(newDate.toISOString());
    }
  };

  const incrementHours = () => {
    const newHours = (hours + 1) % 24;
    setHours(newHours);
    handleTimeChange(newHours, minutes);
  };

  const decrementHours = () => {
    const newHours = (hours - 1 + 24) % 24;
    setHours(newHours);
    handleTimeChange(newHours, minutes);
  };

  const incrementMinutes = () => {
    const newMinutes = (minutes + 1) % 60;
    setMinutes(newMinutes);
    handleTimeChange(hours, newMinutes);
  };

  const decrementMinutes = () => {
    const newMinutes = (minutes - 1 + 60) % 60;
    setMinutes(newMinutes);
    handleTimeChange(hours, newMinutes);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange bg-white hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-5 h-5 text-gray-500" />
        <span className="flex-1 text-left">
          {selectedDate
            ? format(selectedDate, 'MMM d, yyyy h:mm a')
            : 'Select date and time'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-200"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              month={selectedDate || new Date()}
              onSelect={handleDaySelect}
              defaultMonth={selectedDate || new Date()}
              modifiersClassNames={{
                selected: 'bg-bears-orange text-white',
                today: 'text-bears-navy font-bold',
              }}
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium text-gray-900',
                nav: 'space-x-1 flex items-center',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-bears-orange first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                day_selected: 'bg-bears-orange text-white hover:bg-bears-orange hover:text-white focus:bg-bears-orange focus:text-white',
                day_today: 'bg-gray-100',
                day_outside: 'text-gray-400 opacity-50',
                day_disabled: 'text-gray-400 opacity-50',
                day_range_middle: 'aria-selected:bg-bears-orange aria-selected:text-white',
                day_hidden: 'invisible',
              }}
            />

            <div className="mt-4 flex items-center justify-center gap-4 p-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={incrementHours}
                      className="p-1 hover:text-bears-orange transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={hours.toString().padStart(2, '0')}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0 && val < 24) {
                          setHours(val);
                          handleTimeChange(val, minutes);
                        }
                      }}
                      className="w-12 text-center border border-gray-200 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={decrementHours}
                      className="p-1 hover:text-bears-orange transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xl">:</span>
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={incrementMinutes}
                      className="p-1 hover:text-bears-orange transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={minutes.toString().padStart(2, '0')}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0 && val < 60) {
                          setMinutes(val);
                          handleTimeChange(hours, val);
                        }
                      }}
                      className="w-12 text-center border border-gray-200 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={decrementMinutes}
                      className="p-1 hover:text-bears-orange transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}