'use client'

import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { RotateCcw, CalendarCheck2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateSelectorProps {
  width: number;
  onDateRangeChange?: () => void; // Nouvelle prop pour rappeler le parent
}

const DateSelector: React.FC<DateSelectorProps> = ({ width, onDateRangeChange }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (width >= 900) setNumberOfMonths(3);
    else if (width >= 600) setNumberOfMonths(2);
    else setNumberOfMonths(1);
  }, [width]);

  useEffect(() => {
    const getCookie = (name: string) => {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]?.trim();
        if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    };

    const savedRange = getCookie('dateRange');
    if (savedRange) {
      const parsedRange = JSON.parse(savedRange);
      setDateRange({
        from: new Date(parsedRange.from),
        to: new Date(parsedRange.to),
      });
    }
  }, []);

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const handleSelect = (range: DateRange | undefined) => {
    setTempDateRange(range);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (tempDateRange) {
      setCookie('dateRange', JSON.stringify(tempDateRange), 7);
      setDateRange(tempDateRange);
      setIsDirty(false);
      onDateRangeChange?.();
    }
  };

  const handleCancel = () => {
    setTempDateRange(dateRange);
    setIsDirty(false);
  };

  const selectPeriod = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    handleSelect({ from, to });
  };

  const selectThisMonth = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    handleSelect({ from, to: new Date() });
  };

  const selectLastMonth = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    handleSelect({ from, to });
  };

  const selectThisYear = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), 0, 1);
    handleSelect({ from, to: new Date() });
  };

  const quickRanges = [
    { label: '7 derniers jours', action: () => selectPeriod(7) },
    { label: '30 derniers jours', action: () => selectPeriod(30) },
    { label: 'Ce mois', action: selectThisMonth },
    { label: 'Mois dernier', action: selectLastMonth },
    { label: 'Cette année', action: selectThisYear },
  ];

  const applyCustomRange = () => {
    if (customFrom && customTo) {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      if (from <= to) {
        handleSelect({ from, to });
      } else {
        alert('La date de début doit être antérieure à la date de fin.');
      }
    } else {
      alert('Veuillez sélectionner les deux dates.');
    }
  };

  return (
    <div className="relative flex flex-col w-full gap-4">
      <ScrollArea className="w-[99.5%] h-12 overflow-hidden">
        <div className="flex w-72 gap-2 items-center">
          {quickRanges.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={item.action}
              className="text-sm"
            >
              {item.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="w-full" />
      </ScrollArea>
      <div className="flex gap-2 items-end flex-wrap text-sm">
        <div className="flex flex-col">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded border px-1 py-1 text-white bg-neutral-800"
          />
        </div>
        <p>à</p>
        <div className="flex flex-col">
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded border px-1 py-1 text-white bg-neutral-800"
          />
        </div>
        <button
          title="Appliquer"
          onClick={applyCustomRange}
          className="bg-neutral-800 p-2 rounded-sm"
        >
          <CalendarCheck2 className="h-4" />
        </button>
      </div>
      <div className="w-full h-full overflow-hidden relative rounded-2xl flex flex-col justify-between items-center py-2 text-white bg-neutral-800 border border-gray-300/50">
        <Calendar
          mode="range"
          selected={tempDateRange || dateRange}
          onSelect={handleSelect}
          className="bg-neutral-800 text-blue border-gray-700"
          numberOfMonths={numberOfMonths}
        />
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full px-4 mt-4 flex justify-between items-center"
            >
              <Button
                onClick={handleCancel}
                variant="outline"
                className="text-neutral-300"
              >
                Annuler
              </Button>
              <button
                onClick={handleSave}
                className="relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              >
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                  Sauvegarder
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {dateRange && (
        <div className="mt-4 text-lg">
          <p>Période sélectionnée :</p>
          <p>Du : {dateRange.from?.toLocaleDateString('fr-FR')}</p>
          <p>Au : {dateRange.to?.toLocaleDateString('fr-FR')}</p>
        </div>
      )}
    </div>
  );
};

export default DateSelector;