'use client'

import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

const DateSelector: React.FC<{ width: number }> = ({ width }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [numberOfMonths, setNumberOfMonths] = useState(1);

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

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range) {
      setCookie('dateRange', JSON.stringify(range), 7);
    } else {
      deleteCookie('dateRange');
    }
  };

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c && c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c && c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; Max-Age=-99999999;`;
  };

  return (
    <div className="relative flex flex-col w-full">
      <div className="w-full h-full overflow-hidden relative rounded-2xl flex justify-center items-center py-2 text-white bg-neutral-800 border border-gray-300/50">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          className="bg-neutral-800 text-blue border-gray-700"
          numberOfMonths={numberOfMonths}
        />
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