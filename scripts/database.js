/*
 * Copyright (c) - All Rights Reserved.
 */

// Système de base de données pour les mèmes
// Utilise localStorage comme base de données

class MemeDatabase {
    constructor() {
        this.dbName = 'memeGeneratorDB';
        this.memesKey = 'memes';
        this.statsKey = 'stats';
        this.init();
    }

    // Initialiser la base de données
    init() {
        if (!localStorage.getItem(this.memesKey)) {
            localStorage.setItem(this.memesKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.statsKey)) {
            localStorage.setItem(this.statsKey, JSON.stringify({
                totalMemes: 0,
                lastCreated: null,
                favorites: 0
            }));
        }
    }

    // Générer un ID unique
    generateId() {
        return 'meme_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Sauvegarder un nouveau mème
    saveMeme(imageData, metadata = {}) {
        try {
            const memes = this.getAllMemes();
            const newMeme = {
                id: this.generateId(),
                imageData: imageData,
                createdAt: new Date().toISOString(),
                topText: metadata.topText || '',
                bottomText: metadata.bottomText || '',
                isFavorite: false,
                ...metadata
            };

            memes.push(newMeme);
            localStorage.setItem(this.memesKey, JSON.stringify(memes));

            // Mettre à jour les statistiques
            this.updateStats();

            console.log('Mème sauvegardé avec succès!', newMeme.id);
            return { success: true, meme: newMeme };
        } catch (error) {
            console.error(' Erreur lors de la sauvegarde:', error);
            return { success: false, error: error.message };
        }
    }

    // Récupérer tous les mèmes
    getAllMemes() {
        try {
            const memes = localStorage.getItem(this.memesKey);
            return memes ? JSON.parse(memes) : [];
        } catch (error) {
            console.error(' Erreur lors de la récupération des mèmes:', error);
            return [];
        }
    }

    // Récupérer un mème par ID
    getMemeById(id) {
        const memes = this.getAllMemes();
        return memes.find(meme => meme.id === id);
    }

    // Supprimer un mème
    deleteMeme(id) {
        try {
            let memes = this.getAllMemes();
            const initialLength = memes.length;
            memes = memes.filter(meme => meme.id !== id);

            if (memes.length < initialLength) {
                localStorage.setItem(this.memesKey, JSON.stringify(memes));
                this.updateStats();
                console.log('Mème supprimé avec succès!', id);
                return { success: true };
            } else {
                console.warn(' Mème non trouvé:', id);
                return { success: false, error: 'Mème non trouvé' };
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return { success: false, error: error.message };
        }
    }

    // Supprimer tous les mèmes
    deleteAllMemes() {
        try {
            localStorage.setItem(this.memesKey, JSON.stringify([]));
            this.updateStats();
            console.log('Tous les mèmes ont été supprimés!');
            return { success: true };
        } catch (error) {
            console.error(' Erreur lors de la suppression:', error);
            return { success: false, error: error.message };
        }
    }

    // Basculer le statut favori
    toggleFavorite(id) {
        try {
            const memes = this.getAllMemes();
            const meme = memes.find(m => m.id === id);
            
            if (meme) {
                meme.isFavorite = !meme.isFavorite;
                localStorage.setItem(this.memesKey, JSON.stringify(memes));
                this.updateStats();
                console.log('Statut favori mis à jour!', id);
                return { success: true, isFavorite: meme.isFavorite };
            }
            
            return { success: false, error: 'Mème non trouvé' };
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            return { success: false, error: error.message };
        }
    }

    // Mettre à jour les statistiques
    updateStats() {
        const memes = this.getAllMemes();
        const stats = {
            totalMemes: memes.length,
            lastCreated: memes.length > 0 ? memes[memes.length - 1].createdAt : null,
            favorites: memes.filter(m => m.isFavorite).length
        };
        localStorage.setItem(this.statsKey, JSON.stringify(stats));
    }

    // Récupérer les statistiques
    getStats() {
        try {
            const stats = localStorage.getItem(this.statsKey);
            return stats ? JSON.parse(stats) : {
                totalMemes: 0,
                lastCreated: null,
                favorites: 0
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
            return {
                totalMemes: 0,
                lastCreated: null,
                favorites: 0
            };
        }
    }

    // Rechercher des mèmes
    searchMemes(query) {
        const memes = this.getAllMemes();
        const lowerQuery = query.toLowerCase();
        
        return memes.filter(meme => 
            (meme.topText && meme.topText.toLowerCase().includes(lowerQuery)) ||
            (meme.bottomText && meme.bottomText.toLowerCase().includes(lowerQuery))
        );
    }

    // Obtenir les mèmes favoris
    getFavorites() {
        return this.getAllMemes().filter(meme => meme.isFavorite);
    }

    // Obtenir les mèmes triés par date
    getMemesSortedByDate(ascending = false) {
        const memes = this.getAllMemes();
        return memes.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    }

    // Obtenir la taille de la BD en bytes
    getDatabaseSize() {
        const memes = localStorage.getItem(this.memesKey) || '';
        const stats = localStorage.getItem(this.statsKey) || '';
        return (memes.length + stats.length) * 2; // approximation en bytes
    }

    // Formater la taille en lecture humaine
    getReadableSize() {
        const bytes = this.getDatabaseSize();
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// Créer une instance globale
const memeDB = new MemeDatabase();

// Logger les stats au chargement
console.log('Base de données initialisée');
console.log('Statistiques:', memeDB.getStats());
console.log('Taille BD:', memeDB.getReadableSize());