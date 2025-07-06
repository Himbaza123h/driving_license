"use client";
import React from 'react';

const Stats: React.FC = () => {
  const stats = [
    { value: '99%', subtitle: 'Faster Processing' },
    { value: '24/7', subtitle: 'Online Access' },
    { value: '100%', subtitle: 'Secure Verification' },
  ];

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <h2 className="text-center font-inter font-semibold text-3xl text-black mb-12">
          Transforming License Services
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {stats.map(({ value, subtitle }, idx) => (
            <div 
              key={idx}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center mx-auto w-full max-w-[280px] sm:max-w-none"
            >
              <div className="font-inter font-bold text-4xl bg-gradient-to-r from-[#2C8E5D] to-[#144CBB] bg-clip-text text-transparent mb-3">
                {value}
              </div>
              <p className="font-inter font-medium text-lg text-gray-600">
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
