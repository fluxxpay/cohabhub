'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X, SquaresFour } from '@phosphor-icons/react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export const PublicHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Accueil', href: '#accueil', isAnchor: true },
    { name: 'L\'espace', href: '#espace', isAnchor: true },
    { name: 'Services', href: '#services', isAnchor: true },
    { name: 'Tarifs', href: '#tarifs', isAnchor: true },
    { name: 'Événements', href: '#events', isAnchor: true },
    { name: 'Contact', href: '#contact', isAnchor: true },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-primary-100' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/">
              {isScrolled ? (
                <img
                  src="/logo_blue.png"
                  alt="Cohab Logo"
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <img
                  src="/logo blanc.png"
                  alt="Cohab Logo"
                  className="h-10 w-auto object-contain"
                />
              )}
            </Link>
          </motion.div>

          {/* Desktop Navigation - more refined */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.isAnchor) {
                    e.preventDefault();
                    const element = document.querySelector(item.href);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`text-sm transition-colors duration-200 relative group font-light cursor-pointer ${
                  isScrolled 
                    ? 'text-primary-600 hover:text-primary-900' 
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${
                  isScrolled ? 'bg-primary-900' : 'bg-white'
                }`}></span>
              </motion.a>
            ))}
          </nav>

          {/* Desktop CTA Buttons - more elegant */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
                <Link href="/dashboard" className="text-white flex items-center space-x-2">
                  <motion.button
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-primary-900 text-white rounded-full text-sm font-light hover:bg-primary-800 transition-all duration-200 flex items-center space-x-2"
                  >
                    <SquaresFour className="h-4 w-4" weight="light" />
                    <span>Dashboard</span>
                  </motion.button>
                </Link>
            ) : (
              <>
                <div
                  className="transition-colors duration-200"
                >
                  <Link 
                    href="/signin"
                    className={`px-6 py-2 text-sm font-light transition-colors duration-200 ${
                      isScrolled 
                        ? 'text-primary-700 hover:text-primary-900' 
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    Se connecter
                  </Link>
                </div>
                <motion.button
                  onClick={() => {
                    const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
                    if (!isAuthenticated) {
                      window.location.href = `/signup?redirect=${encodeURIComponent('/booking')}`;
                    } else {
                      window.location.href = '/booking';
                    }
                  }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-primary-900 text-white rounded-full text-sm font-light hover:bg-primary-800 transition-all duration-200"
                >
                  Réserver
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button - more subtle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors duration-200 ${
              isScrolled ? 'hover:bg-primary-50' : 'hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className={`h-5 w-5 ${isScrolled ? 'text-primary-900' : 'text-white'}`} weight="light" />
            ) : (
              <List className={`h-5 w-5 ${isScrolled ? 'text-primary-900' : 'text-white'}`} weight="light" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - more refined */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-primary-100 shadow-xs"
          >
            <div className="px-6 py-6 space-y-4">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    setIsOpen(false);
                    if (item.isAnchor) {
                      e.preventDefault();
                      setTimeout(() => {
                        const element = document.querySelector(item.href);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="block text-primary-600 hover:text-primary-900 transition-colors duration-200 py-2 font-light cursor-pointer"
                >
                  {item.name}
                </motion.a>
              ))}
              
              <div className="pt-4 space-y-3 border-t border-primary-100">
                {user ? (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(false)}
                    className="w-full px-6 py-2 bg-primary-900 text-white rounded-full text-sm font-light hover:bg-primary-800 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Link href="/dashboard" className="text-white flex items-center space-x-2">
                      <SquaresFour className="h-4 w-4" weight="light" />
                      <span>Dashboard</span>
                    </Link>
                  </motion.button>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link 
                        href="/signin"
                        onClick={() => setIsOpen(false)}
                        className="block w-full px-6 py-2 text-sm font-light text-primary-700 hover:text-primary-900 transition-colors duration-200"
                      >
                        Se connecter
                      </Link>
                    </motion.div>
                    <motion.button
                      onClick={() => {
                        setIsOpen(false);
                        const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
                        if (!isAuthenticated) {
                          window.location.href = `/signup?redirect=${encodeURIComponent('/booking')}`;
                        } else {
                          window.location.href = '/booking';
                        }
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-2 bg-primary-900 text-white rounded-full text-sm font-light hover:bg-primary-800 transition-all duration-200"
                    >
                      Réserver
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
