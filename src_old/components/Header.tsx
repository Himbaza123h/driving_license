"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCarSide, faGlobe, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setLanguage(e.target.value as Language);

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element)?.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const headerBg = scrolled
    ? 'bg-white/90 backdrop-blur-md shadow-md'
    : 'bg-white';

  return (
    <header className={`${headerBg} sticky top-0 z-50 border-b border-gray-200 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Made smaller for mobile */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2C8E5D] to-[#1f6a44] rounded-lg p-1.5 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
              <FontAwesomeIcon icon={faCarSide} className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-2 sm:ml-3">
              <h1 className="font-inter font-bold text-lg sm:text-xl text-black">DLV Burundi</h1>
              <p className="font-inter text-xs sm:text-sm text-gray-600">Digital License Verification</p>
            </div>
          </Link>

          {/* Desktop Nav and Login */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="font-inter font-medium text-sm text-black hover:text-[#2C8E5D]">
              Home
            </Link>
            <Link href="/about" className="font-inter font-medium text-sm text-black hover:text-[#2C8E5D]">
              About
            </Link>
            <Link href="/how-it-works" className="font-inter font-medium text-sm text-black hover:text-[#2C8E5D]">
              How it Works
            </Link>
            <Link href="/apply" className="font-inter font-medium text-sm text-black hover:text-[#2C8E5D]">
              Apply for License
            </Link>            <Link href="/verify" className="font-inter font-medium text-sm text-black hover:text-[#2C8E5D]">
              Verify License
            </Link>
              {/* Desktop Auth Section */}
            {user ? (
              <div className="relative user-menu-container">                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-all"
                >
                  <div className="w-8 h-8 bg-[#2C8E5D] rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-inter font-medium text-sm text-black">{user.name}</span>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-inter font-medium text-sm text-gray-900">{user.name}</p>
                      <p className="font-inter text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-inter">
                      Profile
                    </Link>
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-inter">
                      Dashboard
                    </Link>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-inter flex items-center space-x-2"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="bg-[#2C8E5D] hover:bg-[#245A47] text-white font-inter font-medium px-5 py-2 rounded-full shadow-sm hover:shadow transition-all"
              >
                Login
              </Link>
            )}
          </div>

          {/* Language & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language switcher - Improved dropdown positioning */}
            <div className="relative flex items-center">
              <FontAwesomeIcon icon={faGlobe} className="text-[#2C8E5D] w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <select
                value={language}
                onChange={handleLanguageChange}
                aria-label="Select language"
                className="text-xs sm:text-sm bg-transparent pr-5 pl-1 py-1 focus:outline-none cursor-pointer font-medium text-gray-800 appearance-none [-webkit-appearance:none] [-moz-appearance:none] [box-sizing:border-box]"
              >
                <option value="en" className="text-xs sm:text-sm py-1 px-1">EN</option>
                <option value="fr" className="text-xs sm:text-sm py-1 px-1">FR</option>
                <option value="rn" className="text-xs sm:text-sm py-1 px-1">RN</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-[#2C8E5D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Mobile Menu Toggle */}            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-[#2C8E5D] hover:bg-gray-100 focus:outline-none"
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Improved Mobile menu */}
        <div 
          className={`md:hidden bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`} 
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-4 py-2 text-base font-medium text-black hover:text-[#2C8E5D] hover:bg-gray-50 rounded-md">
              Home
            </Link>
            <Link href="/about" className="block px-4 py-2 text-base font-medium text-black hover:text-[#2C8E5D] hover:bg-gray-50 rounded-md">
              About
            </Link>
            <Link href="/how-it-works" className="block px-4 py-2 text-base font-medium text-black hover:text-[#2C8E5D] hover:bg-gray-50 rounded-md">
              How it Works
            </Link>
            <Link href="/apply" className="block px-4 py-2 text-base font-medium text-black hover:text-[#2C8E5D] hover:bg-gray-50 rounded-md">
              Apply for License
            </Link>            <Link href="/verify" className="block px-4 py-2 text-base font-medium text-black hover:text-[#2C8E5D] hover:bg-gray-50 rounded-md">
              Verify License
            </Link>
            
            {/* Mobile Auth Section */}
            {user ? (
              <div className="mt-3 px-4 py-2 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[#2C8E5D] rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-inter font-medium text-black">{user.name}</p>
                    <p className="font-inter text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link href="/profile" className="block px-4 py-2 text-base font-medium text-black hover:text-[#2C8E5D] hover:bg-gray-50 rounded-md">
                    Profile
                  </Link>
                  <Link href="/dashboard" className="block px-4 py-2 text-base font-medium text-black hover:text-[#2C8E5D] hover:bg-gray-50 rounded-md">
                    Dashboard
                  </Link>
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                className="block w-full mt-3 px-4 py-2 bg-[#2C8E5D] hover:bg-[#245A47] text-center text-white font-medium rounded-md"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;