'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const navT = useTranslations('nav');

  const quickLinks = [
    { href: '#home', label: navT('home') },
    { href: '#properties', label: navT('properties') },
    { href: '#about', label: navT('about') },
    { href: '#contact', label: navT('contact') },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-6 group">
              <div className="relative w-48 h-16 group-hover:scale-105 transition-transform">
                <Image
                  src="/benco-logo.jpg"
                  alt="Ben&Co"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              {t('description')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-gold-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-gold-500 transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-gold-500 group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-6">{t('contactInfo')}</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+38762266662"
                  className="flex items-start space-x-3 text-gray-400 hover:text-gold-500 transition-colors duration-300 group"
                >
                  <Phone className="flex-shrink-0 mt-1 group-hover:rotate-12 transition-transform" size={18} />
                  <span>+387 62 266 662</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:realestatebenco@gmail.com"
                  className="flex items-start space-x-3 text-gray-400 hover:text-gold-500 transition-colors duration-300 group"
                >
                  <Mail className="flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" size={18} />
                  <span className="break-all">realestatebenco@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?q=Gajev+Trg+4+Sarajevo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start space-x-3 text-gray-400 hover:text-gold-500 transition-colors duration-300 group"
                >
                  <MapPin className="flex-shrink-0 mt-1 group-hover:bounce transition-transform" size={18} />
                  <span>Gajev Trg 4, Sarajevo</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="text-center text-gray-400 text-sm">
            <p>{t('copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
