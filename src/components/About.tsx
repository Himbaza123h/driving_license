"use client";
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQrcode,
  faLaptopCode,
  faClock,
  faLock,
} from '@fortawesome/free-solid-svg-icons';

const About: React.FC = () => {
  const features = [
    {
      icon: faLaptopCode,
      title: 'Online Application',
      desc: 'Apply for your license anytime, anywhere through our intuitive web portal.',
    },
    {
      icon: faQrcode,
      title: 'QR Code Verification',
      desc: 'Instantly verify licenses with secure QR scanning on any mobile device.',
    },
    {
      icon: faClock,
      title: 'Real-Time Status',
      desc: 'Track your application progress in real time with live updates.',
    },
    {
      icon: faLock,
      title: 'Secure Storage',
      desc: 'All data is encrypted and stored on government-approved secure servers.',
    },
  ];

  return (
    <section className="bg-white pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-inter font-semibold text-4xl text-black mb-4">
          Modern & Secure License System
        </h2>
        <p className="font-inter text-gray-600 text-lg mb-12">
          Experience a fully digital licensing workflow, from application to verification, built for speed, security, and transparency.
        </p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-[#2C8E5D]/10 text-[#2C8E5D] rounded-full mb-4">
                <FontAwesomeIcon icon={icon} className="w-6 h-6" />
              </div>
              <h3 className="font-inter font-semibold text-xl text-black mb-2">
                {title}
              </h3>
              <p className="font-inter text-gray-600 text-sm text-center">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
