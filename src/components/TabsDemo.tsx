// TabsDemo.tsx
'use client';

import Image from 'next/image';
import { Tabs } from '@/components/ui/tabs';

const TabsDemo: React.FC = () => {
  const tabs = [
    {
      title: 'Product',
      value: 'product',
      content: (
          <div className="w-full h-[20rem] overflow-hidden relative rounded-2xl p-4 text-xl font-bold text-white bg-white/20 backdrop-blur-lg border border-gray-300/50">
          <p className='text-4xl'>Product Tab</p>
        </div>
      ),
    },
    {
      title: 'Services',
      value: 'services',
      content: (
          <div className="w-full h-[20rem] overflow-hidden relative rounded-2xl p-4 text-xl font-bold text-white bg-white/20 backdrop-blur-lg border border-gray-300/50">
              <p className='text-4xl'>Services Tab</p>
        </div>
      ),
    },
  ];

  return (
    <div className="relative flex flex-col w-full">
      <Tabs tabs={tabs} />
    </div>
  );
};

export default TabsDemo;