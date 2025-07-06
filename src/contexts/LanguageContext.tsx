"use client";
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define available languages
export type Language = 'en' | 'fr' | 'rn';

// Define context types
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

// Translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.howItWorks': 'How it Works',
    'nav.apply': 'Apply for License',
    'nav.verify': 'Verify License',
    'nav.login': 'Login',
    
    // Hero
    'hero.title': 'Digital Driver\'s License Verification System for Burundi',
    'hero.description': 'A secure, digital platform for applying, managing, and verifying driver\'s licenses in Burundi. Built with modern technology for transparency and efficiency.',
    'hero.apply': 'Apply Now',
    'hero.learnMore': 'Learn More',
    'hero.govtApproved': 'Government Approved',
    'hero.secureFast': 'Secure & Fast',
    
    // About
    'about.title': 'Modern & Secure License System',
    'about.subtitle': 'Experience a fully digital licensing workflow, from application to verification, built for speed, security, and transparency.',
    'about.feature1.title': 'Online Application',
    'about.feature1.desc': 'Apply for your license anytime, anywhere through our intuitive web portal.',
    'about.feature2.title': 'QR Code Verification',
    'about.feature2.desc': 'Instantly verify licenses with secure QR scanning on any mobile device.',
    'about.feature3.title': 'Real-Time Status',
    'about.feature3.desc': 'Track your application progress in real time with live updates.',
    'about.feature4.title': 'Secure Storage',
    'about.feature4.desc': 'All data is encrypted and stored on government-approved secure servers.',
  },
  fr: {
    // Header
    'nav.home': 'Accueil',
    'nav.about': 'À propos',
    'nav.howItWorks': 'Comment ça marche',
    'nav.apply': 'Demander un permis',
    'nav.verify': 'Vérifier un permis',
    'nav.login': 'Connexion',
    
    // Hero
    'hero.title': 'Système de vérification numérique des permis de conduire au Burundi',
    'hero.description': 'Une plateforme numérique sécurisée pour demander, gérer et vérifier les permis de conduire au Burundi. Construite avec une technologie moderne pour la transparence et l\'efficacité.',
    'hero.apply': 'Demander maintenant',
    'hero.learnMore': 'En savoir plus',
    'hero.govtApproved': 'Approuvé par le gouvernement',
    'hero.secureFast': 'Sécurisé & Rapide',
    
    // About
    'about.title': 'Système de licence moderne & sécurisé',
    'about.subtitle': 'Expérimentez un flux de travail entièrement numérique, de la demande à la vérification, conçu pour la rapidité, la sécurité et la transparence.',
    'about.feature1.title': 'Demande en ligne',
    'about.feature1.desc': 'Demandez votre permis à tout moment, n\'importe où, grâce à notre portail web intuitif.',
    'about.feature2.title': 'Vérification par QR Code',
    'about.feature2.desc': 'Vérifiez instantanément les permis avec un scan QR sécurisé sur n\'importe quel appareil mobile.',
    'about.feature3.title': 'Statut en temps réel',
    'about.feature3.desc': 'Suivez la progression de votre demande en temps réel avec des mises à jour en direct.',
    'about.feature4.title': 'Stockage sécurisé',
    'about.feature4.desc': 'Toutes les données sont cryptées et stockées sur des serveurs sécurisés approuvés par le gouvernement.',
  },
  rn: {
    // Header (Kirundi)
    'nav.home': 'Muhira',
    'nav.about': 'Kuri twebwe',
    'nav.howItWorks': 'Ingene bikora',
    'nav.apply': 'Saba uruhushya',
    'nav.verify': 'Suzuma uruhushya',
    'nav.login': 'Injira',
    
    // Hero
    'hero.title': 'Uburyo bwo gusuzuma uruhushya rwo gutwara ibinyabiziga mu Burundi',
    'hero.description': 'Icuma gikora ku buryo bwa numerique kigenewe gusaba, gucunga no kugenzura impushya zo gutwara mu Burundi. Yakozwe n\'ikoranabuhanga rigezweho kugira ngo habe ukwiseruka n\'ukugira akamaro.',
    'hero.apply': 'Saba ubu nyene',
    'hero.learnMore': 'Menya vyinshi',
    'hero.govtApproved': 'Vyemejwe na Reta',
    'hero.secureFast': 'Bitabwaho & Vyihuta',
    
    // About
    'about.title': 'Uburyo buhereza uruhushya bugezweho kandi butobwaho',
    'about.subtitle': 'Gerageza uburyo bwuzuye bwo gukorera ku buryo bwa numeriki, kuva mu gusaba gushika ku kugenzura, buzwi ku vyerekeye ubwihute, umutekano nuko bukoreshwa biciye ku mucyo.',
    'about.feature1.title': 'Gusaba kuri internet',
    'about.feature1.desc': 'Saba uruhushya igihe ico arico cose, aho ariho hose ukoresheje urubuga rwacu rworoshe gukoresha.',
    'about.feature2.title': 'Kugenzura biciye kuri QR Code',
    'about.feature2.desc': 'Genzura vuba impushya biciye ku murongo QR utabwaho kuri terefone iyo ari yo yose.',
    'about.feature3.title': 'Ibiriko biraba mu gihe nyaco',
    'about.feature3.desc': 'Kurikirana ingene ibisabwa biriko biragenda mu gihe nyaco ukoresheje ibikorwa bishasha.',
    'about.feature4.title': 'Ukubikwa kutabwaho',
    'about.feature4.desc': 'Amakuru yose arahishwe kandi agakorerwa kuri serveri zitabwaho zemejwe na Reta.',
  }
};

// Provider component
export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext);
