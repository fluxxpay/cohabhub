'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  MapPin,
  Phone,
  Envelope,
  Clock,
  ArrowUp,
  InstagramLogo,
  TwitterLogo,
  LinkedinLogo,
  YoutubeLogo,
  FacebookLogo
} from '@phosphor-icons/react';

export const PublicFooter = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    services: [
      { name: "Espace Open Space", href: "#espace", isAnchor: true },
      { name: "Bureaux Privatifs", href: "#espace", isAnchor: true },
      { name: "Salles de Réunion", href: "#espace", isAnchor: true },
      { name: "Événements", href: "#events", isAnchor: true }
    ],
    company: [
      { name: "À propos de nous", href: "#accueil", isAnchor: true },
      { name: "Notre équipe", href: "#contact", isAnchor: true },
      { name: "Rejoindre l'équipe", href: "#contact", isAnchor: true },
      { name: "Blog & actualités", href: "#events", isAnchor: true }
    ],
    support: [
      { name: "Centre d'aide", href: "#contact", isAnchor: true },
      { name: "Nous contacter", href: "#contact", isAnchor: true },
      { name: "Questions fréquentes", href: "#contact", isAnchor: true },
      { name: "Support technique", href: "#contact", isAnchor: true }
    ],
    legal: [
      { name: "Mentions légales", href: "#", isAnchor: false },
      { name: "Politique de confidentialité", href: "#", isAnchor: false },
      { name: "CGU", href: "#", isAnchor: false },
      { name: "Cookies", href: "#", isAnchor: false }
    ]
  };

  const socialLinks = [
    { icon: InstagramLogo, href: "#", label: "Instagram" },
    { icon: TwitterLogo, href: "#", label: "Twitter" },
    { icon: LinkedinLogo, href: "#", label: "LinkedIn" },
    { icon: YoutubeLogo, href: "#", label: "YouTube" },
    { icon: FacebookLogo, href: "#", label: "Facebook" }
  ];

  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <Link href="/">
                  <img
                    src="/logo blanc.png"
                    alt="Cohab Logo"
                    className="h-12 w-auto object-contain"
                  />
                </Link>
              </div>
              <p className="text-primary-600 mb-6 max-w-md">
                Votre espace de coworking moderne et inspirant 
                au cœur d'Abomey Calavi, Bénin.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-primary-300">
                  <MapPin className="h-5 w-5 text-accent-400" weight="duotone" />
                  <span className="font-body">Rue avant ISM Adonaï,Ilot 1214, Abomey Calavi, Bénin</span>
                </div>
                <div className="flex items-center space-x-3 text-primary-300">
                  <Phone className="h-5 w-5 text-accent-400" weight="duotone" />
                  <div className="flex flex-col space-y-1">
                    <a href="tel:0192999000" className="font-body hover:text-accent-400 transition-colors">01 92 99 90 00</a>
                    <a href="tel:0121329471" className="font-body hover:text-accent-400 transition-colors">01 21 32 94 71</a>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-primary-300">
                  <Envelope className="h-5 w-5 text-accent-400" weight="duotone" />
                  <span className="font-body">contact@cohabhub.com</span>
                </div>
                <div className="flex items-center space-x-3 text-primary-300">
                  <Clock className="h-5 w-5 text-accent-400" weight="duotone" />
                  <span className="font-body">Lun-Ven : 8h-20h | Sam : 9h-18h | Dim : Fermé</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-display font-semibold mb-6 text-white">Services</h3>
              <ul className="space-y-3">
                {footerLinks.services.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      onClick={(e) => {
                        if (link.isAnchor) {
                          e.preventDefault();
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      className="text-primary-300 hover:text-accent-400 transition-colors duration-200 font-body cursor-pointer"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-display font-semibold mb-6 text-white">Entreprise</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      onClick={(e) => {
                        if (link.isAnchor) {
                          e.preventDefault();
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      className="text-primary-300 hover:text-accent-400 transition-colors duration-200 font-body cursor-pointer"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-display font-semibold mb-6 text-white">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      onClick={(e) => {
                        if (link.isAnchor) {
                          e.preventDefault();
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      className="text-primary-300 hover:text-accent-400 transition-colors duration-200 font-body cursor-pointer"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-display font-semibold mb-6 text-white">Légal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      className="text-primary-300 hover:text-accent-400 transition-colors duration-200 font-body"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-primary-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-primary-400 font-body">
              © 2024 Cohab. Tous droits réservés.
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-primary-800 rounded-full flex items-center justify-center text-primary-300 hover:text-accent-400 hover:bg-primary-700 transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" weight="duotone" />
                </motion.a>
              ))}
            </div>

            {/* Back to Top */}
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-primary-800 rounded-full flex items-center justify-center text-primary-300 hover:text-accent-400 hover:bg-primary-700 transition-all duration-200"
              aria-label="Retour en haut"
            >
              <ArrowUp className="h-5 w-5" weight="duotone" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
};
