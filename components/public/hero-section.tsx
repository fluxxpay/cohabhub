'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, MapPin, Clock } from '@phosphor-icons/react';

export const HeroSection = () => {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/media/images/2600x1600/hall.jpg')",
          }}
        />
        {/* Overlay sombre pour la lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-black/75"></div>
      </div>

      {/* Nouveau fond sophistiqué - ajusté pour fonctionner avec l'image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Texture granuleuse subtile - réduite pour ne pas masquer l'image */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-primary-50/10"></div>
        
        {/* Motif géométrique organique - légèrement plus visible */}
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              d="M30,-40C36.7,-33.3,38.5,-20.5,42.6,-6.9C46.7,6.7,53.1,21.1,49.1,32.4C45.1,43.7,30.7,51.9,15.1,58.3C-0.5,64.7,-17.3,69.3,-30.1,63.4C-42.9,57.5,-51.6,41.2,-56.7,24.6C-61.8,8,-63.3,-9,-56.2,-21.7C-49.1,-34.4,-33.3,-42.8,-18.7,-46.6C-4.1,-50.4,9.3,-49.6,30,-40Z" 
              fill="none" 
              stroke="#fff" 
              strokeWidth="0.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Formes flottantes améliorées - ajustées pour l'overlay sombre */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, -15, 0],
            y: [0, 30, 0],
            rotate: [0, 3, 0]
          }}
          transition={{ 
            duration: 14, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/4 left-1/6 w-48 h-48 border border-white/20 rounded-lg opacity-12"
        />
        <motion.div
          animate={{ 
            x: [0, 25, 0],
            y: [0, -15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 16, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2 
          }}
          className="absolute bottom-1/3 right-1/5 w-32 h-32 border border-white/20 rounded-full opacity-12"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.08, 0.14, 0.08]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1 
          }}
          className="absolute top-1/3 right-1/4 w-64 h-64 border border-white/15 rounded-full"
        />
      </div>

      {/* Contenu principal (identique à votre version précédente) */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-24 lg:pt-32">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 bg-white/95 backdrop-blur-sm text-primary-700 px-4 py-1.5 rounded-full text-xs font-light mb-8 border border-white/20 shadow-lg">
          <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
          <span>Nouveau : Espace créatif disponible dès maintenant</span>
        </div>

        {/* Main Title */}
        <div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-white mb-4 leading-[1.1] drop-shadow-lg">
            <span className="block font-normal">Votre espace de travail</span>
            <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-400 drop-shadow-md">minimaliste & inspirant</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
          Un cadre épuré conçu pour la concentration et la créativité. Rejoignez une communauté dynamique au cœur d'Abomey Calavi.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center items-center gap-6 mb-12 text-white/80 text-sm">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-4 w-4 text-accent-300" weight="thin" />
            <span>Abomey Calavi</span>
          </div>
          <div className="w-px h-4 bg-white/30"></div>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-4 w-4 text-accent-300" weight="thin" />
            <span>Ouvert 24/7</span>
          </div>
          <div className="w-px h-4 bg-white/30"></div>
          <div className="flex items-center space-x-1.5">
            <span className="text-accent-300">•</span>
            <span>WiFi ultra-rapide</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-20">
          <motion.button
            onClick={() => {
              // Vérifier si l'utilisateur est connecté
              const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
              if (!isAuthenticated) {
                // Rediriger vers signup avec redirect vers booking
                window.location.href = `/signup?redirect=${encodeURIComponent('/booking')}`;
              } else {
                window.location.href = '/booking';
              }
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-primary-900 text-white rounded-full text-sm font-light flex items-center space-x-2 transition-all hover:bg-primary-800"
          >
            <span>Réserver une visite gratuite</span>
            <ArrowRight className="h-3.5 w-3.5" weight="light" />
          </motion.button>
          
          <motion.button
            onClick={() => {
              // Scroll vers la section des espaces
              const spaceSection = document.getElementById('espace');
              if (spaceSection) {
                spaceSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-transparent text-white rounded-full text-sm font-light flex items-center space-x-2 border border-white/40 hover:border-white/60 hover:bg-white/10 transition-all duration-200"
          >
            <Play className="h-3.5 w-3.5" weight="fill" />
            <span>Découvrir nos espaces</span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-8 max-w-xl mx-auto border-t border-white/20 pt-8 mb-8">
          {[
            { number: "150", label: "Membres" },
            { number: "500m²", label: "Espace" },
            { number: "24/7", label: "Accès" },
            { number: "50+", label: "Événements" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-light text-white mb-1 drop-shadow-md">
                {stat.number}
              </div>
              <div className="text-xs text-white/70 tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="flex flex-col items-center mt-8 mb-12 lg:mb-16">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center"
          >
            <div className="text-xs text-white/70 mb-2">Explorer</div>
            <div className="w-4 h-6 border border-white/40 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-0.5 h-2 bg-white/60 rounded-full mt-1"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};