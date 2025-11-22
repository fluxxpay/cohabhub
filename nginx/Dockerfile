FROM nginx:alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Créer les répertoires nécessaires
RUN mkdir -p /etc/nginx/ssl /var/log/nginx

# Exposer les ports
EXPOSE 80 443

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]