import React from 'react';
import { Shield, Upload, CheckCircle, CreditCard } from 'lucide-react';

export default function Process() {
  const steps = [
    { number: 1, title: "Verify Identity", description: "Enter your National ID and verify via OTP", icon: Shield },
    { number: 2, title: "Upload Documents", description: "Submit driving school certificate & docs", icon: Upload },
    { number: 3, title: "Get Approved", description: "Admin reviews and issues your license", icon: CheckCircle },
    { number: 4, title: "Digital License", description: "Access your license instantly online", icon: CreditCard },
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-4xl font-bold text-black">How It Works</h2>
          <p className="text-lg text-gray-600 mt-4">
            Complete your license application in just 4 simple steps
          </p>
        </div>

        {/* Steps with connector */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8">
          {/* Horizontal connector line */}
          <div className="hidden lg:block absolute inset-0 top-1/2 h-px bg-gradient-to-r from-[#2C8E5D] to-[#144CBB]"></div>

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative z-10 flex-1 flex flex-col items-center w-full max-w-[280px] mx-auto lg:mx-0">
                {/* Aligned Number Bubble */}
                <div className="h-16 flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2C8E5D] to-[#144CBB] flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">{step.number}</span>
                  </div>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Icon className="w-6 h-6 text-[#2C8E5D]" />
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold text-black mb-2 text-center">{step.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}