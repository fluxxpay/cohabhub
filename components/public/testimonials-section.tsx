'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Star, 
  Quotes,
  User,
  Buildings,
  Rocket,
  Heart,
  ArrowRight
} from '@phosphor-icons/react';

export const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Designer UX/UI",
      company: "Studio Créatif",
      content: "Cohab a transformé ma façon de travailler. L'ambiance est incroyable et j'ai rencontré des professionnels passionnés qui m'ont aidée à développer mon activité.",
      rating: 5,
      avatar: "/api/placeholder/80/80",
      icon: User
    },
    {
      name: "Thomas Martin",
      role: "Développeur Full-Stack",
      company: "TechStart",
      content: "L'espace est parfait pour coder, avec une connexion WiFi ultra-rapide et un environnement calme. Les événements tech sont vraiment enrichissants.",
      rating: 5,
      avatar: "/api/placeholder/80/80",
      icon: Rocket
    },
    {
      name: "Sophie Bernard",
      role: "Consultante Marketing",
      company: "Growth Agency",
      content: "J'ai trouvé ma place ici. L'équipe est aux petits soins et l'ambiance collaborative m'a permis de développer mon réseau professionnel.",
      rating: 5,
      avatar: "/api/placeholder/80/80",
      icon: Heart
    },
    {
      name: "Alexandre Moreau",
      role: "Entrepreneur",
      company: "InnovTech",
      content: "Cohab m'a donné l'environnement parfait pour lancer ma startup. Les ressources et le réseau m'ont été précieux pour mon développement.",
      rating: 5,
      avatar: "/api/placeholder/80/80",
      icon: Buildings
    }
  ];

  const stats = [
    { number: "98%", label: "Satisfaction client", icon: Heart },
    { number: "150+", label: "Membres actifs", icon: User },
    { number: "50+", label: "Événements par an", icon: Rocket },
    { number: "4.9/5", label: "Note moyenne", icon: Star }
  ];

  return (
    <section id="temoignages" ref={ref} className="py-20 bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ float: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-64 h-64 bg-accent-100 rounded-full opacity-10 blur-3xl"
        />
        <motion.div
          animate={{ float: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-10 left-10 w-80 h-80 bg-primary-100 rounded-full opacity-10 blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display text-primary-900 mb-6">
            Ils nous font <span className="text-gradient-accent">confiance</span>
          </h2>
          <p className="text-xl text-primary-600 max-w-3xl mx-auto font-body">
            Découvrez ce que nos membres disent de leur expérience 
            dans notre espace de coworking.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group bg-white rounded-2xl p-8 hover:shadow-medium transition-all duration-300 border border-primary-100"
            >
              {/* Quote Icon */}
              <div className="flex items-start justify-between mb-6">
                <Quotes className="h-8 w-8 text-accent-500" weight="duotone" />
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-accent-400" weight="fill" />
                  ))}
                </div>
              </div>

              {/* Testimonial Content */}
              <blockquote className="text-primary-600 mb-6 font-body leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-100 to-accent-200 rounded-full flex items-center justify-center">
                  <testimonial.icon className="h-5 w-5 text-accent-600" weight="duotone" />
                </div>
                <div>
                  <div className="font-display text-primary-900 font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-primary-500 font-body">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-medium border border-primary-100"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-display text-primary-900 mb-4">
              En quelques chiffres
            </h3>
            <p className="text-primary-600 font-body">
              L'impact de notre communauté en quelques chiffres
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-8 w-8 text-accent-600" weight="duotone" />
                </div>
                <div className="text-3xl md:text-4xl font-display text-primary-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-600 font-body">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-3xl p-8 md:p-12 border border-accent-200">
            <h3 className="text-3xl md:text-4xl font-display text-primary-900 mb-4">
              Rejoignez notre communauté
            </h3>
            <p className="text-primary-600 mb-8 font-body max-w-2xl mx-auto">
              Rejoignez une communauté dynamique de professionnels 
              et transformez votre façon de travailler.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-primary-900 text-white rounded-full text-sm font-light flex items-center space-x-2 transition-all hover:bg-primary-800 shadow-lg hover:shadow-xl"
              >
                <span>Réserver une visite gratuite</span>
                <ArrowRight className="h-3.5 w-3.5" weight="light" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-transparent text-primary-700 rounded-full text-sm font-light flex items-center space-x-2 border border-primary-200 hover:border-primary-300"
              >
                <span>Découvrir nos tarifs</span>
                <ArrowRight className="h-3.5 w-3.5" weight="light" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
