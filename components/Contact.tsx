'use client';

import { useTranslations } from 'next-intl';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

export function Contact() {
  const t = useTranslations('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: t('form.success') || 'Hvala vam! Vaša poruka je uspješno poslata.',
        });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus({
          type: 'error',
          message: data.error || t('form.error') || 'Greška pri slanju poruke. Molimo pokušajte ponovo.',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: t('form.error') || 'Greška pri slanju poruke. Molimo pokušajte ponovo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      label: t('phone'),
      value: '+387 62 266 662',
      href: 'tel:+38762266662',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Mail,
      label: t('email'),
      value: 'realestatebenco@gmail.com',
      href: 'mailto:realestatebenco@gmail.com',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: MapPin,
      label: t('address'),
      value: 'Gajev Trg 4, Sarajevo',
      href: 'https://maps.google.com/?q=Gajev+Trg+4+Sarajevo',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: Clock,
      label: t('hours'),
      value: 'Pon - Sub 09:00 - 17:00',
      href: null,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                const content = (
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                    <div className={`w-12 h-12 ${info.bg} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={info.color} size={24} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{info.label}</h3>
                    <p className="text-gray-600 text-sm">{info.value}</p>
                  </div>
                );

                return info.href ? (
                  <a
                    key={index}
                    href={info.href}
                    target={info.href.startsWith('http') ? '_blank' : undefined}
                    rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="block hover:scale-105 transition-transform duration-300"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={index}>
                    {content}
                  </div>
                );
              })}
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden shadow-lg h-64">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2876.4947358850446!2d18.404973776536957!3d43.85971497109589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4758c8f5d1f1b1ab%3A0x1f1f1f1f1f1f1f1f!2sGajev%20Trg%204%2C%20Sarajevo!5e0!3m2!1sen!2sba!4v1234567890123!5m2!1sen!2sba"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-8 rounded-2xl shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('form.name')}
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-600 focus:border-transparent transition-all outline-none"
                  placeholder={t('form.namePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('form.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-600 focus:border-transparent transition-all outline-none"
                  placeholder={t('form.emailPlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('form.phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-600 focus:border-transparent transition-all outline-none"
                  placeholder={t('form.phonePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('form.message')}
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-600 focus:border-transparent transition-all outline-none resize-none"
                  placeholder={t('form.messagePlaceholder')}
                ></textarea>
              </div>

              {status.type && (
                <div
                  className={`p-4 rounded-lg ${
                    status.type === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gold-600 hover:bg-gold-700 text-white font-semibold py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('form.sending') || 'Šaljem...'}
                  </span>
                ) : (
                  t('form.submit')
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
