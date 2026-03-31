# 🚀 Guide de Déploiement Backend Node.js sur Render

## 📋 Prérequis

- Compte Render.com
- Repository GitHub avec le code
- MongoDB Atlas (base de données cloud)

## 🔧 Étapes de Déploiement

### 1. Préparer MongoDB Atlas

1. Créer un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un utilisateur de base de données
3. Whitelist IP : `0.0.0.0/0` (autoriser toutes les connexions)
4. Copier la chaîne de connexion (MongoDB URI)

### 2. Configurer Render

1. Aller sur [render.com](https://render.com)
2. Se connecter avec GitHub
3. Cliquer sur **"New +"** → **"Web Service"**
4. Sélectionner le repository `BelikanM/CENTER`
5. Configurer :

   **Build & Deploy:**
   - **Name:** `center-backend-nodejs`
   - **Region:** `Oregon (US West)` ou le plus proche
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile.node`

   **Plan:**
   - Sélectionner **Free** ($0/mois)

   **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/centerDB?retryWrites=true&w=majority
   JWT_SECRET=<généré automatiquement ou votre clé>
   ADMIN_SECRET_KEY=<votre clé admin>
   ```

   **Health Check:**
   - **Health Check Path:** `/api/server-info`

6. Cliquer sur **"Create Web Service"**

### 3. Après le Déploiement

Une fois déployé, Render vous donnera une URL comme :
```
https://centerbackendsetraf-clean.onrender.com
```

**⚠️ Important :** Les services gratuits Render s'arrêtent après 15 minutes d'inactivité. Le premier appel après inactivité prendra ~30 secondes (démarrage à froid).

### 4. Tester l'API

```bash
# Test de santé
curl https://centerbackendsetraf-clean.onrender.com/api/server-info

# Test de connexion admin
curl -X POST https://centerbackendsetraf-clean.onrender.com/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"votre_mot_de_passe"}'
```

### 5. Mettre à Jour Flutter

Une fois que vous avez l'URI Render, mettez à jour `lib/config/server_config.dart` :

```dart
class ServerConfig {
  static const List<String> serverIPs = [
    'https://centerbackendsetraf-clean.onrender.com', // URI Render fixe
    'http://192.168.1.66:5000', // IP locale (fallback)
  ];
}
```

## 🔍 Surveillance et Logs

**Dans le Dashboard Render :**
- **Logs :** Voir les logs en temps réel
- **Metrics :** CPU, mémoire, requêtes
- **Events :** Historique des déploiements

**Commandes utiles :**
```bash
# Voir les logs en direct
# (depuis le Dashboard Render → Logs)

# Redémarrer le service
# (depuis le Dashboard Render → Manual Deploy → "Clear build cache & deploy")
```

## 🐛 Dépannage

### Problème : Service ne démarre pas
- Vérifier les logs Render
- Vérifier que `MONGODB_URI` est correcte
- Vérifier que toutes les variables d'environnement sont définies

### Problème : Timeout lors des requêtes
- Le service était inactif (cold start)
- Attendre 30 secondes et réessayer
- Utiliser un service de "ping" (ex: cron-job.org) pour garder le service actif

### Problème : Erreur de connexion MongoDB
- Vérifier la whitelist IP sur MongoDB Atlas
- Vérifier que l'utilisateur DB a les bonnes permissions
- Tester la connexion URI avec MongoDB Compass

## 📊 Structure des Fichiers Créés

```
backend/
├── Dockerfile.node          # Image Docker pour Node.js
├── .dockerignore.node       # Fichiers à exclure du build
├── docker-compose.node.yml  # Configuration Docker Compose (local)
├── render.yaml              # Configuration Render (automatique)
└── DEPLOY_GUIDE.md          # Ce guide
```

## 🎯 Prochaines Étapes

1. **Déployez** sur Render en suivant ce guide
2. **Testez** l'API avec l'URI fournie
3. **Donnez-moi l'URI Render** pour que je mette à jour la config Flutter
4. **Testez** l'application Flutter avec la nouvelle connexion fixe

## 💡 Avantages de Render

✅ URL fixe (pas de changement d'IP)  
✅ HTTPS automatique (sécurisé)  
✅ Déploiement automatique depuis GitHub  
✅ Logs centralisés  
✅ Healthcheck intégré  
✅ Free tier généreux (750h/mois)

## 🔗 Ressources

- [Documentation Render](https://render.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Docker Hub](https://hub.docker.com/)
