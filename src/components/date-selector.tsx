'use client'

import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { RotateCcw, CalendarCheck2 } from 'lucide-react';

const DateSelector: React.FC<{ width: number }> = ({ width }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    if (width >= 900) {
      setNumberOfMonths(3);
    } else if (width >= 600) {
      setNumberOfMonths(2);
    } else {
      setNumberOfMonths(1);
    }
  }, [width]);

  useEffect(() => {
    const savedRange = getCookie('dateRange');
    if (savedRange) {
      const parsedRange = JSON.parse(savedRange);
      setDateRange({
        from: new Date(parsedRange.from),
        to: new Date(parsedRange.to),
      });
    }
  }, []);

  // -----------------------------------------
  // Cookie handlers
  // -----------------------------------------
  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]?.trim();
      if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; Max-Age=-99999999;`;
  };

  // -----------------------------------------
  // Range selection handlers
  // -----------------------------------------
  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range) {
      setCookie('dateRange', JSON.stringify(range), 7);
    } else {
      deleteCookie('dateRange');
    }
  };

  const selectPeriod = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const newRange = { from, to };
    handleSelect(newRange);
  };

  const selectThisMonth = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date();
    handleSelect({ from, to });
  };

  const selectLastMonth = () => {
    const now = new Date();
    // from: first day of previous month
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // to: last day of previous month
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    handleSelect({ from, to });
  };

  const selectThisYear = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date();
    handleSelect({ from, to });
  };

  // -----------------------------------------
  // Quick ranges configuration
  // -----------------------------------------
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
      {/* Quick ranges buttons */}
      <ScrollArea className="w-[99%] h-12 overflow-hidden">
        <div className='flex w-72 gap-2 items-center">'>
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
        <button title='Appliquer' onClick={applyCustomRange} className='bg-neutral-800 p-2 rounded-sm'>
          <CalendarCheck2 className='h-4' />
        </button>
      </div>
      {/* Calendar */}
      <div className="w-full h-full overflow-hidden relative rounded-2xl flex justify-center items-center py-2 text-white bg-neutral-800 border border-gray-300/50">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          className="bg-neutral-800 text-blue border-gray-700"
          numberOfMonths={numberOfMonths}
        />
        <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSelect(undefined)}
            className="h-8 w-8 text-white hover:bg-neutral-700 transition-colors absolute top-4 right-4"
            title="Réinitialiser"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
      </div>

      {/* Displayed range */}
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