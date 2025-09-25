# 🎯 GetSticked

Une application web collaborative de comptage d'items. Idéale pour suivre des scores, des consommations, des activités sportives ou tout autre système de points entre amis.

### Configuration

**Cloner le projet**
```bash
git clone https://github.com/votre-username/getsticked.git
cd getsticked
```

**Installer les dépendances**
```bash
npm install
```

**Configuration Firebase**
   - Créez un projet Firebase
   - Activez Firestore Database, Storage et Authentication
   - Mettre les variables d'environnement dans un fichier `.env` à la racine.

**Lancer en développement**
```bash
npm run dev
```

**Build pour production**
```bash
npm run build
```

## Utilisation

### 1. Créer un salon
- Cliquez "Créer un salon"
- Renseignez nom, description et un type de compétition
- Le salon est créé et vous y êtes automatiquement dirigé

### 2. Rejoindre un salon
- **Via invitation** : Cliquer sur un lien d'invitation partagé

### 3. Compter les points
- Allez sur votre profil et utilisez le bouton ➕ pour ajouter des points
- Cliquez ✓ pour valider et ajouter un commentaire

### 4. Partager un salon
- Dans un salon, cliquez "Inviter".
- Le lien est automatiquement copié dans votre presse-papiers.
- Partagez ce lien pour inviter d'autres personnes