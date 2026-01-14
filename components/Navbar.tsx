'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Menu, X, Globe } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'bs' ? 'en' : 'bs';
    router.replace(pathname, { locale: newLocale });
  };

  const navLinks = [
    { href: '#home', label: t('home') },
    { href: '#properties', label: t('properties') },
    { href: '#about', label: t('about') },
    { href: '#contact', label: t('contact') },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className={`relative transition-all duration-300 ${
              isScrolled ? 'w-10 h-10' : 'w-12 h-12'
            }`}>
              <Image
                src="/benco-logo.jpg"
                alt="Ben&Co"
                fill
                className="object-contain transition-all duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <span className={`text-2xl md:text-3xl font-bold transition-all duration-300 ${
              isScrolled ? 'text-black' : 'text-white'
            }`}>
              BEN<span className="text-gold-500">&</span>CO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors relative group ${
                  isScrolled ? 'text-gray-700 hover:text-gold-600' : 'text-white hover:text-gold-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
            
            <button
              onClick={toggleLanguage}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                isScrolled 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gold-600 hover:text-white' 
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-gold-600 hover:border-gold-600'
              }`}
            >
              <Globe size={18} />
              <span>{currentLocale.toUpperCase()}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'bg-gray-100 text-gray-700 hover:bg-gold-600 hover:text-white'
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-gold-600'
              }`}
            >
              <Globe size={20} />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-gray-700 hover:text-gold-600 font-medium py-2 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
