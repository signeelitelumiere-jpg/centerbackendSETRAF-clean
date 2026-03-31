const multer = require('multer');
let cloudinary;
let CloudinaryStorage;
let cloudinaryAvailable = false;

try {
    // Essayer d'initialiser Cloudinary. Si la configuration est invalide,
    // la librairie peut lancer une exception: nous l'attrapons pour
    // permettre au serveur de démarrer en mode développement.
    cloudinary = require('cloudinary').v2;
    ({ CloudinaryStorage } = require('multer-storage-cloudinary'));

    // Only configure if env vars look present
    if (process.env.CLOUDINARY_CLOUD_NAME && (process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_URL)) {
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
        cloudinaryAvailable = true;
        console.log('✅ Cloudinary configuré');
    } else {
        console.warn('⚠️ Cloudinary non configuré (variables d\'environnement manquantes). Utilisation du stockage local pour les tests.');
    }
} catch (err) {
    console.warn('⚠️ Impossible d\'initialiser Cloudinary:', err && err.message ? err.message : err);
    console.warn('⚠️ Basculage vers stockage local (uploads/) pour permettre le démarrage du serveur en développement.');
    cloudinaryAvailable = false;
}

// ========================================
// CONFIGURATION POUR PHOTOS DE PROFIL
// ========================================
let uploadCloudinary;
if (cloudinaryAvailable && CloudinaryStorage) {
  const profileStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
          folder: 'center-app/profiles',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
          transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
          public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              return 'profile-' + uniqueSuffix;
          }
      }
  });

  uploadCloudinary = multer({
      storage: profileStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
          const allowedMimes = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
              'image/webp', 'image/bmp', 'image/svg+xml'
          ];
          
          if (allowedMimes.includes(file.mimetype)) {
              cb(null, true);
          } else {
              cb(new Error('Format image non supporté'), false);
          }
      }
  });
} else {
  // Fallback: stockage local pour le développement
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, 'uploads', 'profiles');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `profile-${uniqueSuffix}${ext}`);
    }
  });

  uploadCloudinary = multer({
    storage: localStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/bmp','image/svg+xml'];
      if (allowedMimes.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Format image non supporté'), false);
    }
  });
}

// ========================================
// CONFIGURATION POUR PUBLICATIONS (Images + Vidéos)
// ========================================
let publicationUpload;
if (cloudinaryAvailable && CloudinaryStorage) {
  const publicationStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
          folder: 'center-app/publications',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'],
          resource_type: 'auto', // Auto-détecte image ou vidéo
          transformation: [{ quality: 'auto:good' }],
          public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              return 'pub-' + uniqueSuffix;
          }
      }
  });

  publicationUpload = multer({
      storage: publicationStorage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
          const allowed = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
              'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'
          ];
          if (allowed.includes(file.mimetype)) {
              cb(null, true);
          } else {
              cb(new Error('Seules les images et vidéos sont autorisées'), false);
          }
      }
  });
} else {
  // Fallback local storage for publications
  const pubDir = path.join(__dirname, 'uploads', 'publications');
  const localPubStorage = multer.diskStorage({
    destination: (req, file, cb) => { fs.mkdirSync(pubDir, { recursive: true }); cb(null, pubDir); },
    filename: (req, file, cb) => { const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1E9); const ext=path.extname(file.originalname)||''; cb(null, `pub-${uniqueSuffix}${ext}`); }
  });
  publicationUpload = multer({ storage: localPubStorage, limits: { fileSize: 50*1024*1024 }, fileFilter: (req,file,cb)=>{ const allowed=['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/avi','video/mov','video/wmv','video/flv','video/webm','video/mkv']; if (allowed.includes(file.mimetype)) cb(null,true); else cb(new Error('Seules les images et vidéos sont autorisées'), false); } });
}

// ========================================
// CONFIGURATION POUR STORIES (Images + Vidéos)
// ========================================
let storyUpload;
if (cloudinaryAvailable && CloudinaryStorage) {
  const storyStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
          folder: 'center-app/stories',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'mkv'],
          resource_type: 'auto',
          transformation: [{ quality: 'auto:good' }],
          public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              return 'story-' + uniqueSuffix;
          }
      }
  });

  storyUpload = multer({
      storage: storyStorage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
          const allowed = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
              'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv'
          ];
          if (allowed.includes(file.mimetype)) cb(null, true);
          else cb(new Error('Format non autorisé pour les stories'), false);
      }
  });
} else {
  const dir = path.join(__dirname, 'uploads', 'stories');
  const localStorage = multer.diskStorage({ destination: (req,file,cb)=>{ fs.mkdirSync(dir,{recursive:true}); cb(null,dir); }, filename:(req,file,cb)=>{ const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9); const ext=path.extname(file.originalname)||''; cb(null,`story-${uniqueSuffix}${ext}`); } });
  storyUpload = multer({ storage: localStorage, limits:{ fileSize:50*1024*1024 }, fileFilter:(req,file,cb)=>{ const allowed=['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/avi','video/mov','video/wmv','video/webm','video/mkv']; if (allowed.includes(file.mimetype)) cb(null,true); else cb(new Error('Format non autorisé pour les stories'), false); } });
}

// ========================================
// CONFIGURATION POUR COMMENTAIRES (Images + Vidéos + Audio)
// ========================================
let commentUpload;
if (cloudinaryAvailable && CloudinaryStorage) {
  const commentStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
          folder: 'center-app/comments',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg', 'm4a', 'aac'],
          resource_type: 'auto',
          transformation: [{ quality: 'auto:good' }],
          public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              return 'comment-' + uniqueSuffix;
          }
      }
  });

  commentUpload = multer({
      storage: commentStorage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
          const allowed = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
              'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv',
              'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm', 'audio/aac'
          ];
          if (allowed.includes(file.mimetype)) cb(null, true);
          else cb(new Error('Format de fichier non autorisé'), false);
      }
  });
} else {
  const dir = path.join(__dirname, 'uploads', 'comments');
  const localStorage = multer.diskStorage({ destination: (req,file,cb)=>{ fs.mkdirSync(dir,{recursive:true}); cb(null,dir); }, filename:(req,file,cb)=>{ const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9); const ext=path.extname(file.originalname)||''; cb(null,`comment-${uniqueSuffix}${ext}`); } });
  commentUpload = multer({ storage: localStorage, limits:{ fileSize:50*1024*1024 }, fileFilter:(req,file,cb)=>{ const allowed=['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/avi','video/mov','video/wmv','video/flv','video/webm','video/mkv','audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/m4a','audio/webm','audio/aac']; if (allowed.includes(file.mimetype)) cb(null,true); else cb(new Error('Format de fichier non autorisé'), false); } });
}

// ========================================
// CONFIGURATION POUR MARKERS (Images + Vidéos)
// ========================================
let markerUpload;
if (cloudinaryAvailable && CloudinaryStorage) {
  const markerStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
          folder: 'center-app/markers',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'mkv'],
          resource_type: 'auto',
          transformation: [{ quality: 'auto:good' }],
          public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              return 'marker-' + uniqueSuffix;
          }
      }
  });

  markerUpload = multer({
      storage: markerStorage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
          const allowed = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
              'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'
          ];
          if (allowed.includes(file.mimetype)) cb(null, true);
          else cb(new Error('Seules les images et vidéos sont autorisées'), false);
      }
  });
} else {
  const dir = path.join(__dirname, 'uploads', 'markers');
  const localStorage = multer.diskStorage({ destination: (req,file,cb)=>{ fs.mkdirSync(dir,{recursive:true}); cb(null,dir); }, filename:(req,file,cb)=>{ const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9); const ext=path.extname(file.originalname)||''; cb(null,`marker-${uniqueSuffix}${ext}`); } });
  markerUpload = multer({ storage: localStorage, limits:{ fileSize:50*1024*1024 }, fileFilter:(req,file,cb)=>{ const allowed=['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/avi','video/mov','video/wmv','video/flv','video/webm','video/mkv']; if (allowed.includes(file.mimetype)) cb(null,true); else cb(new Error('Seules les images et vidéos sont autorisées'), false); } });
}

// ========================================
// CONFIGURATION POUR EMPLOYÉS (Images + PDF)
// ========================================
let employeeUpload;
if (cloudinaryAvailable && CloudinaryStorage) {
  const employeeStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
          folder: 'center-app/employees',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
          resource_type: 'auto',
          transformation: [{ quality: 'auto:good' }],
          public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              return 'employee-' + uniqueSuffix;
          }
      }
  });

  employeeUpload = multer({
      storage: employeeStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
          const allowed = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
              'application/pdf'
          ];
          const ext = file.originalname.toLowerCase().split('.').pop();
          if (allowed.includes(file.mimetype) || ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'].includes('.' + ext)) cb(null, true);
          else cb(new Error('Seules les images et PDFs sont autorisés'), false);
      }
  });
} else {
  const dir = path.join(__dirname, 'uploads', 'employees');
  const localStorage = multer.diskStorage({ destination: (req,file,cb)=>{ fs.mkdirSync(dir,{recursive:true}); cb(null,dir); }, filename:(req,file,cb)=>{ const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9); const ext=path.extname(file.originalname)||''; cb(null,`employee-${uniqueSuffix}${ext}`); } });
  employeeUpload = multer({ storage: localStorage, limits:{ fileSize:10*1024*1024 }, fileFilter:(req,file,cb)=>{ const allowed=['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf']; const ext=file.originalname.toLowerCase().split('.').pop(); if (allowed.includes(file.mimetype) || ['.pdf','.jpg','.jpeg','.png','.gif','.webp'].includes('.'+ext)) cb(null,true); else cb(new Error('Seules les images et PDFs sont autorisés'), false); } });
}

// ========================================
// CONFIGURATION POUR CARTES D'IDENTITÉ VIRTUELLES (Images)
// ========================================
let virtualIDCardUpload;
if (cloudinaryAvailable && CloudinaryStorage) {
  const virtualIDCardStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
          folder: 'center-app/virtual-id-cards',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
          resource_type: 'auto',
          access_mode: 'public', // ✅ AJOUTÉ - Rendre les fichiers publics
          transformation: [{ quality: 'auto:good' }],
          public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              return 'card-' + uniqueSuffix;
          }
      }
  });

  virtualIDCardUpload = multer({
      storage: virtualIDCardStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
          const allowed = [
              'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
              'application/pdf'
          ];
          const ext = file.originalname.toLowerCase().split('.').pop();
          if (allowed.includes(file.mimetype) || ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'].includes('.' + ext)) cb(null, true);
          else cb(new Error('Seules les images et PDFs sont autorisés pour les cartes d\'identité'), false);
      }
  });
} else {
  const dir = path.join(__dirname, 'uploads', 'virtual-id-cards');
  const localStorage = multer.diskStorage({ destination: (req,file,cb)=>{ fs.mkdirSync(dir,{recursive:true}); cb(null,dir); }, filename:(req,file,cb)=>{ const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9); const ext=path.extname(file.originalname)||''; cb(null,`card-${uniqueSuffix}${ext}`); } });
  virtualIDCardUpload = multer({ storage: localStorage, limits:{ fileSize:10*1024*1024 }, fileFilter:(req,file,cb)=>{ const allowed=['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf']; const ext=file.originalname.toLowerCase().split('.').pop(); if (allowed.includes(file.mimetype) || ['.pdf','.jpg','.jpeg','.png','.gif','.webp'].includes('.'+ext)) cb(null,true); else cb(new Error('Seules les images et PDFs sont autorisés pour les cartes d\'identité'), false); } });
}

// ========================================
// FONCTION DE SUPPRESSION
// ========================================
const deleteFromCloudinary = async (publicId) => {
    if (!cloudinaryAvailable) {
        console.warn('⚠️ Tentative de suppression Cloudinary alors que Cloudinary n\'est pas disponible. Ignoré en développement.');
        return null;
    }
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Image supprimée de Cloudinary:', result);
        return result;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        throw error;
    }
};

// Fonction pour obtenir l'URL optimisée d'une image
const getOptimizedUrl = (publicId, options = {}) => {
    if (!cloudinaryAvailable) {
        const prefix = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : '';
        return `${prefix}/uploads/${publicId}`;
    }
    return cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
        ...options
    });
};

// Fonction pour obtenir une URL avec transformation (crop, resize, etc.)
const getTransformedUrl = (publicId, transformations = {}) => {
    if (!cloudinaryAvailable) {
        const prefix = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : '';
        return `${prefix}/uploads/${publicId}`;
    }
    return cloudinary.url(publicId, transformations);
};

module.exports = {
    cloudinary,
    uploadCloudinary,
    publicationUpload,
    storyUpload,
    commentUpload,
    markerUpload,
    employeeUpload,
    virtualIDCardUpload,
    deleteFromCloudinary,
    getOptimizedUrl,
    getTransformedUrl
};