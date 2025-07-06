"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faLock } from '@fortawesome/free-solid-svg-icons';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <div className="relative pt-14 pb-8 sm:pt-24 sm:pb-10 lg:pt-28 lg:pb-10">
         <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
            
           {/* Left Content - Added text-center for mobile */}
           <div className="lg:col-span-7 mt-8 lg:mt-0 text-center sm:text-left">
              {/* Main Heading - Centered on mobile */}
              <h1 className="font-inter font-semibold text-2xl sm:text-3xl md:text-4xl leading-tight text-black mb-3 md:mb-4 max-w-[95%] sm:max-w-md md:max-w-xl mx-auto sm:mx-0">
                Digital Driver&apos;s License <span className="bg-gradient-to-r from-[#2C8E5D] to-[#144CBB] bg-clip-text text-transparent">Verification System</span> for Burundi
              </h1>
              
              {/* Description - Centered on mobile */}
              <p className="font-inter font-normal text-sm sm:text-base md:text-lg leading-6 md:leading-7 text-black text-center sm:text-justify mb-4 md:mb-6 max-w-[90%] sm:max-w-md md:max-w-lg mx-auto sm:mx-0">
                A secure, digital platform for applying, managing, and verifying driver&apos;s licenses in Burundi. 
                Built with modern technology for transparency and efficiency.
              </p>
              
              {/* CTA Buttons - Centered on mobile */}
              <div className="flex flex-row gap-4 mb-8 justify-center sm:justify-start">
                {/* Apply Now Button */}
                <Link 
                  href="/apply"
                  className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-b from-[#2C8E5D] to-[#144CBB] rounded-lg font-inter font-normal text-sm sm:text-base text-white hover:opacity-90 transition-opacity duration-200"
                >
                  Apply Now
                </Link>
                
                {/* Learn More Button */}
                <Link 
                  href="/about"
                  className="inline-flex items-center justify-center px-4 py-2 border border-black rounded-lg font-inter font-normal text-sm sm:text-base text-black hover:bg-gray-50 transition-colors duration-200"
                >
                  Learn More
                </Link>
              </div>
              
              {/* Features - Centered on mobile */}
              <div className="flex flex-row gap-4 sm:gap-8 items-center justify-center sm:justify-start">
                {/* Government Approved */}
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon 
                    icon={faShield} 
                    className="w-4 h-4 text-[#2C8E5D]" 
                  />
                  <span className="font-inter font-normal text-xs sm:text-sm md:text-base leading-4 text-black">
                    Government Approved
                  </span>
                </div>
                
                {/* Secure & Fast */}
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon 
                    icon={faLock} 
                    className="w-4 h-4 text-[#144CBB]" 
                  />
                  <span className="font-inter font-normal text-xs sm:text-sm md:text-base leading-4 text-black">
                    Secure & Fast
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right Content - Hero Image - Centered on mobile */}
           <div className="mt-0 lg:mt-0 lg:col-span-5 flex justify-center lg:justify-start">
              <div className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px] lg:w-[450px] lg:h-[450px] relative">
                <Image
                  src="/dlv-hero.png"
                  alt="Digital License Verification Hero"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-50 to-transparent opacity-50 -z-10"></div>
    </section>
  );
};

export default Hero;