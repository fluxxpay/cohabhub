'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { 
  MapPin,
  Phone,
  Envelope,
  Clock,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simuler l'envoi du formulaire (à remplacer par un vrai appel API)
    setTimeout(() => {
      toast.success('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" ref={ref} className="py-20 bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
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
            <span className="text-gradient-accent">Contactez-nous</span>
          </h2>
          <p className="text-xl text-primary-600 max-w-3xl mx-auto font-body">
            Une question ? Un projet ? N'hésitez pas à nous contacter, nous serons ravis de vous répondre.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-display text-primary-900 mb-6">
                Informations de contact
              </h3>
              <p className="text-primary-600 mb-8 font-body">
                Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner dans votre projet.
              </p>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-start space-x-4"
              >
                <div className="p-3 bg-accent-50 rounded-xl">
                  <MapPin className="h-6 w-6 text-accent-600" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 mb-1">Adresse</h4>
                  <p className="text-primary-600 font-body">
                    Rue avant ISM Adonaï, Ilot 1214<br />
                    Abomey Calavi, Bénin
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex items-start space-x-4"
              >
                <div className="p-3 bg-accent-50 rounded-xl">
                  <Phone className="h-6 w-6 text-accent-600" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 mb-1">Téléphone</h4>
                  <a href="tel:+22962000000" className="text-primary-600 hover:text-accent-600 transition-colors font-body">
                    +229 62 00 00 00
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-start space-x-4"
              >
                <div className="p-3 bg-accent-50 rounded-xl">
                  <Envelope className="h-6 w-6 text-accent-600" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 mb-1">Email</h4>
                  <a href="mailto:contact@cohabhub.com" className="text-primary-600 hover:text-accent-600 transition-colors font-body">
                    contact@cohabhub.com
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-start space-x-4"
              >
                <div className="p-3 bg-accent-50 rounded-xl">
                  <Clock className="h-6 w-6 text-accent-600" weight="duotone" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 mb-1">Horaires</h4>
                  <p className="text-primary-600 font-body">
                    Lun-Ven : 8h-20h<br />
                    Sam : 9h-18h<br />
                    Dim : Fermé
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-primary-100"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary-900 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all font-body"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all font-body"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-primary-900 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all font-body"
                    placeholder="+229 XX XX XX XX"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-primary-900 mb-2">
                    Sujet *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all font-body"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="reservation">Réservation d'espace</option>
                    <option value="event">Événement</option>
                    <option value="partnership">Partenariat</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-primary-900 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all resize-none font-body"
                  placeholder="Votre message..."
                />
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-8 py-3 bg-primary-900 text-white rounded-full text-sm font-light hover:bg-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt className="h-4 w-4" weight="light" />
                    <span>Envoyer le message</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

