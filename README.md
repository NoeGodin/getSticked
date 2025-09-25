# 🎯 GetSticked

Une application web moderne pour compter et suivre les "bâtons" en équipe, idéale pour les défis, paris, objectifs ou tout système de points collaboratif.

## Description

GetSticked permet de créer des "salons" où plusieurs joueurs peuvent compter leurs bâtons individuellement. Chaque action est tracée avec commentaires et horodatage, offrant un historique complet des progressions.

### Configuration

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/getsticked.git
cd getsticked
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Firebase**
   - Créez un projet Firebase
   - Activez Firestore Database
   - Copiez la configuration dans `src/utils/firebase.ts`

4. **Lancer en développement**
```bash
npm run dev
```

5. **Build pour production**
```bash
npm run build
```

## Utilisation

### 1. Créer un salon
- Cliquez "Créer un salon"
- Renseignez nom, description, clé secrète et noms des joueurs
- Le salon est créé et vous y êtes automatiquement dirigé

### 2. Rejoindre un salon
- **Via formulaire** : "Rejoindre un salon" → nom + clé secrète
- **Via invitation** : Cliquer sur un lien d'invitation partagé

### 3. Compter des bâtons
- Utilisez les boutons +/- pour ajuster votre compteur
- Cliquez ✓ pour valider et ajouter un commentaire
- Consultez l'historique avec le bouton 📜

### 4. Partager un salon
- Dans un salon, cliquez "Inviter".
- Le lien est automatiquement copié dans votre presse-papiers.
- Partagez ce lien pour inviter d'autres personnes