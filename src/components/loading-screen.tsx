'use client';
import React from 'react';
import { useData } from '@/app/(protected)/context/DataContext';

export const LoadingScreen = () => {
  const { isLoading } = useData();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-neutral-600 border-t-neutral-200 rounded-full animate-spin" />
        <p className="text-neutral-200 text-lg">Chargement des données...</p>
      </div>
    </div>
  );
}; 