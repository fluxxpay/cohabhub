'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  WifiHigh, 
  Coffee, 
  Users, 
  Calendar, 
  Shield, 
  Lightning, 
  Printer, 
  Phone,
  Envelope,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  Buildings,
  CreditCard,
  Plant
} from '@phosphor-icons/react';

export const ServicesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const services = [
    {
      icon: WifiHigh,
      title: "WiFi haute performance",
      description: "Connexion fibre optique 1Gbps pour une productivité optimale",
      features: ["1Gbps symétrique", "Réseau sécurisé", "Support technique 24/7", "Backup 4G"],
      color: "from-accent-400 to-accent-600"
    },
    {
      icon: Coffee,
      title: "Café & restauration",
      description: "Café bio, thé d'exception et snacks healthy disponibles sur place",
      features: ["Café bio équitable", "Thé premium", "Snacks healthy", "Service traiteur"],
      color: "from-accent-400 to-accent-600"
    },
    {
      icon: Users,
      title: "Communauté & networking",
      description: "Rejoignez une communauté active de professionnels et entrepreneurs",
      features: ["Événements mensuels", "Programme de mentorat", "Plateforme de collaboration"],
      color: "from-accent-400 to-accent-600"
    },
    {
      icon: Calendar,
      title: "Événements & formations",
      description: "Workshops, conférences et formations pour développer vos compétences",
      features: ["50+ événements/an", "Experts internationaux", "Formations certifiantes"],
      color: "from-accent-400 to-accent-600"
    },
    {
      icon: Shield,
      title: "Sécurité & accès",
      description: "Accès sécurisé 24/7 avec système de contrôle d'accès",
      features: ["Accès 24/7", "Surveillance vidéo", "Casiers sécurisés", "Contrôle d'accès"],
      color: "from-accent-400 to-accent-600"
    },
    {
      icon: Buildings,
      title: "Services administratifs",
      description: "Réception de courrier, adresse professionnelle et support administratif",
      features: ["Réception de courrier", "Adresse professionnelle", "Support administratif"],
      color: "from-accent-400 to-accent-600"
    }
  ];

  const additionalServices = [
    {
      icon: Printer,
      title: "Impression & Numérisation",
      description: "Impression couleur et noir & blanc, scanners haute résolution"
    },
    {
      icon: Phone,
      title: "Téléphonie & Visio",
      description: "Cabines téléphoniques insonorisées et équipements de visioconférence"
    },
    {
      icon: CreditCard,
      title: "Paiement Flexible",
      description: "Forfaits journaliers, mensuels et annuels adaptés à vos besoins"
    },
    {
      icon: Plant,
      title: "Environnement",
      description: "Espaces verts, air purifié et éclairage naturel pour votre bien-être"
    }
  ];

  return (
    <section id="services" ref={ref} className="py-20 bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ float: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-accent-100 rounded-full opacity-10 blur-3xl"
        />
        <motion.div
          animate={{ float: [0, -15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary-100 rounded-full opacity-10 blur-3xl"
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
            Services inclus dans <span className="text-gradient-accent">tous nos forfaits</span>
          </h2>
          <p className="text-xl text-primary-600 max-w-3xl mx-auto font-body">
            Tout ce dont vous avez besoin pour travailler efficacement et développer votre réseau professionnel, inclus dans tous nos forfaits.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" weight="light" />
                </div>
                
                <h3 className="text-2xl font-semibold text-primary-900 mb-4">{service.title}</h3>
                <p className="text-primary-600 mb-6 leading-relaxed">{service.description}</p>
                
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                      <span className="text-sm text-primary-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Services */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-semibold text-primary-900 mb-4">
              Services supplémentaires inclus
            </h3>
            <p className="text-primary-600 max-w-2xl mx-auto">
              Ces services sont inclus dans tous nos forfaits.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="text-center p-6 rounded-xl hover:bg-primary-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary-600" weight="light" />
                  </div>
                  <h4 className="font-semibold text-primary-900 mb-2">{service.title}</h4>
                  <p className="text-sm text-primary-600">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-16"
        >
          <motion.button
            onClick={() => {
              // Scroll vers la section tarifs
              const pricingSection = document.getElementById('tarifs');
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary-900 text-white px-8 py-4 rounded-2xl text-lg font-medium hover:bg-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
          >
            <span>Voir nos tarifs</span>
            <ArrowRight className="h-5 w-5" weight="light" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
