// Script pour la page galerie

// Éléments DOM
const galleryGrid = document.getElementById('galleryGrid');
const emptyGallery = document.getElementById('emptyGallery');
const clearAllBtn = document.getElementById('clearAllBtn');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');

// Statistiques
const totalMemesEl = document.getElementById('totalMemes');
const lastCreatedEl = document.getElementById('lastCreated');
const favoritesEl = document.getElementById('favorites');

// Modal
const memeModal = document.getElementById('memeModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalDate = document.getElementById('modalDate');
const modalId = document.getElementById('modalId');
const modalDownload = document.getElementById('modalDownload');
const modalShare = document.getElementById('modalShare');
const modalDelete = document.getElementById('modalDelete');
const modalFavorite = document.getElementById('modalFavorite');
const favoriteText = document.getElementById('favoriteText');
const favoriteIcon = document.getElementById('favoriteIcon');

let currentMemeId = null;
let showOnlyFavorites = false;

// Initialisation
function init() {
    loadGallery();
    updateStats();
    setupEventListeners();
    console.log('✅ Galerie initialisée');
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    clearAllBtn.addEventListener('click', clearAllMemes);
    showFavoritesBtn.addEventListener('click', toggleFavorites);
    modalClose.addEventListener('click', closeModal);
    modalDownload.addEventListener('click', downloadCurrentMeme);
    modalShare.addEventListener('click', shareCurrentMeme);
    modalDelete.addEventListener('click', deleteCurrentMeme);
    modalFavorite.addEventListener('click', toggleCurrentMemeFavorite);
    
    // Fermer la modal en cliquant à l'extérieur
    memeModal.addEventListener('click', (e) => {
        if (e.target === memeModal) {
            closeModal();
        }
    });
    
    // Fermer avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && memeModal.classList.contains('show')) {
            closeModal();
        }
    });
}

// Basculer l'affichage des favoris
function toggleFavorites() {
    showOnlyFavorites = !showOnlyFavorites;
    
    if (showOnlyFavorites) {
        showFavoritesBtn.innerHTML = '<i class="fas fa-images"></i><span>Voir tout</span>';
        showFavoritesBtn.classList.remove('btn-outline');
        showFavoritesBtn.classList.add('btn-primary');
    } else {
        showFavoritesBtn.innerHTML = '<i class="fas fa-star"></i><span>Voir Favoris</span>';
        showFavoritesBtn.classList.remove('btn-primary');
        showFavoritesBtn.classList.add('btn-outline');
    }
    
    loadGallery();
}

// Charger la galerie
function loadGallery() {
    let memes;
    
    if (showOnlyFavorites) {
        memes = memeDB.getFavorites();
    } else {
        memes = memeDB.getMemesSortedByDate(false);
    }
    
    if (memes.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    galleryGrid.innerHTML = '';
    
    memes.forEach((meme, index) => {
        const card = createMemeCard(meme, index);
        galleryGrid.appendChild(card);
    });
}

// Créer une carte de mème
function createMemeCard(meme, index) {
    const card = document.createElement('div');
    card.className = 'meme-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const date = new Date(meme.createdAt);
    const formattedDate = formatDate(date);
    const isFavorite = meme.isFavorite || false;
    
    card.innerHTML = `
        <div class="meme-image-container">
            <img src="${meme.imageData}" alt="Mème" class="meme-image">
            ${isFavorite ? '<div class="favorite-badge"><i class="fas fa-star"></i></div>' : ''}
            <div class="meme-overlay">
                <span style="color: white; font-weight: 600;">Cliquez pour voir</span>
            </div>
        </div>
        <div class="meme-info">
            <div class="meme-date"><i class="fas fa-calendar-alt"></i> ${formattedDate}</div>
            ${meme.topText ? `<div style="font-weight: 600; color: var(--primary-blue); margin-top: 0.5rem;">"${meme.topText}"</div>` : ''}
            ${meme.bottomText ? `<div style="color: var(--secondary-blue); margin-top: 0.3rem;">"${meme.bottomText}"</div>` : ''}
            <div class="meme-actions">
                <button class="icon-btn favorite ${isFavorite ? 'active' : ''}" data-id="${meme.id}" data-action="favorite" title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <i class="fas fa-star"></i>
                </button>
                <button class="icon-btn download" data-id="${meme.id}" data-action="download" title="Télécharger">
                    <i class="fas fa-download"></i>
                </button>
                <button class="icon-btn share" data-id="${meme.id}" data-action="share" title="Partager">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="icon-btn delete" data-id="${meme.id}" data-action="delete" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    // Événement clic sur la carte
    card.querySelector('.meme-image-container').addEventListener('click', () => {
        openModal(meme);
    });
    
    // Événements sur les boutons d'action
    card.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            
            switch(action) {
                case 'favorite':
                    toggleMemeFavorite(id);
                    break;
                case 'download':
                    downloadMemeById(id);
                    break;
                case 'share':
                    shareMeme(id);
                    break;
                case 'delete':
                    deleteMemeById(id);
                    break;
            }
        });
    });
    
    return card;
}

// Basculer le statut favori d'un mème
function toggleMemeFavorite(id) {
    const result = memeDB.toggleFavorite(id);
    if (result.success) {
        showNotification(result.isFavorite ? 'Ajouté aux favoris!' : 'Retiré des favoris', 'success');
        loadGallery();
        updateStats();
    } else {
        showNotification('Erreur', 'error');
    }
}

// Ouvrir la modal
function openModal(meme) {
    currentMemeId = meme.id;
    modalImage.src = meme.imageData;
    modalDate.textContent = formatDate(new Date(meme.createdAt));
    modalId.textContent = meme.id;
    
    // Mettre à jour le bouton favori
    const isFavorite = meme.isFavorite || false;
    if (isFavorite) {
        favoriteIcon.className = 'fas fa-star';
        favoriteText.textContent = 'Retirer des favoris';
        modalFavorite.classList.remove('btn-primary');
        modalFavorite.classList.add('btn-secondary');
    } else {
        favoriteIcon.className = 'far fa-star';
        favoriteText.textContent = 'Ajouter aux favoris';
        modalFavorite.classList.remove('btn-secondary');
        modalFavorite.classList.add('btn-primary');
    }
    
    memeModal.classList.add('show');
}

// Basculer le favori du mème actuel
function toggleCurrentMemeFavorite() {
    if (currentMemeId) {
        toggleMemeFavorite(currentMemeId);
        // Recharger la modal avec les nouvelles données
        const meme = memeDB.getMemeById(currentMemeId);
        if (meme) {
            const isFavorite = meme.isFavorite || false;
            if (isFavorite) {
                favoriteIcon.className = 'fas fa-star';
                favoriteText.textContent = 'Retirer des favoris';
                modalFavorite.classList.remove('btn-primary');
                modalFavorite.classList.add('btn-secondary');
            } else {
                favoriteIcon.className = 'far fa-star';
                favoriteText.textContent = 'Ajouter aux favoris';
                modalFavorite.classList.remove('btn-secondary');
                modalFavorite.classList.add('btn-primary');
            }
        }
    }
}

// Fermer la modal
function closeModal() {
    memeModal.classList.remove('show');
    currentMemeId = null;
}

// Télécharger un mème par ID
function downloadMemeById(id) {
    const meme = memeDB.getMemeById(id);
    if (meme) {
        const link = document.createElement('a');
        link.download = `meme_${id}.png`;
        link.href = meme.imageData;
        link.click();
        showNotification('⬇️ Mème téléchargé!', 'success');
    }
}

// Télécharger le mème actuel de la modal
function downloadCurrentMeme() {
    if (currentMemeId) {
        downloadMemeById(currentMemeId);
    }
}

// Partager un mème
function shareMeme(id) {
    const meme = memeDB.getMemeById(id);
    if (!meme) return;
    
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
        // Convertir le data URL en blob
        fetch(meme.imageData)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], 'meme.png', { type: 'image/png' });
                return navigator.share({
                    title: 'Mon Mème',
                    text: `${meme.topText || ''} ${meme.bottomText || ''}`.trim(),
                    files: [file]
                });
            })
            .then(() => showNotification('🔗 Mème partagé!', 'success'))
            .catch(err => {
                if (err.name !== 'AbortError') {
                    fallbackShare(meme);
                }
            });
    } else {
        fallbackShare(meme);
    }
}

// Partage de secours (copier le texte)
function fallbackShare(meme) {
    const shareText = `Regardez mon mème! 🎭\n${meme.topText || ''}\n${meme.bottomText || ''}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText)
            .then(() => showNotification('📋 Texte copié dans le presse-papiers!', 'success'))
            .catch(() => showNotification('⚠️ Impossible de copier', 'warning'));
    } else {
        showNotification('⚠️ Partage non disponible sur cet appareil', 'warning');
    }
}

// Partager le mème actuel de la modal
function shareCurrentMeme() {
    if (currentMemeId) {
        shareMeme(currentMemeId);
    }
}

// Supprimer un mème par ID
function deleteMemeById(id) {
    if (confirm('Voulez-vous vraiment supprimer ce mème?')) {
        const result = memeDB.deleteMeme(id);
        if (result.success) {
            showNotification('🗑️ Mème supprimé!', 'success');
            loadGallery();
            updateStats();
        } else {
            showNotification('❌ Erreur lors de la suppression', 'error');
        }
    }
}

// Supprimer le mème actuel de la modal
function deleteCurrentMeme() {
    if (currentMemeId) {
        deleteMemeById(currentMemeId);
        closeModal();
    }
}

// Supprimer tous les mèmes
function clearAllMemes() {
    const stats = memeDB.getStats();
    
    if (stats.totalMemes === 0) {
        showNotification('⚠️ Aucun mème à supprimer', 'warning');
        return;
    }
    
    if (confirm(`Voulez-vous vraiment supprimer TOUS les mèmes (${stats.totalMemes})? Cette action est irréversible!`)) {
        const result = memeDB.deleteAllMemes();
        if (result.success) {
            showNotification('🗑️ Tous les mèmes ont été supprimés!', 'success');
            loadGallery();
            updateStats();
        } else {
            showNotification('❌ Erreur lors de la suppression', 'error');
        }
    }
}

// Mettre à jour les statistiques
function updateStats() {
    const stats = memeDB.getStats();
    
    totalMemesEl.textContent = stats.totalMemes;
    favoritesEl.textContent = stats.favorites;
    
    if (stats.lastCreated) {
        const date = new Date(stats.lastCreated);
        lastCreatedEl.textContent = formatRelativeDate(date);
    } else {
        lastCreatedEl.textContent = '-';
    }
}

// Formater une date
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
}

// Formater une date relative
function formatRelativeDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Afficher l'état vide
function showEmptyState() {
    galleryGrid.style.display = 'none';
    emptyGallery.classList.add('show');
}

// Masquer l'état vide
function hideEmptyState() {
    galleryGrid.style.display = 'grid';
    emptyGallery.classList.remove('show');
}

// Afficher une notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 2rem',
        borderRadius: '50px',
        color: 'white',
        fontWeight: '600',
        fontSize: '1rem',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
    });
    
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialiser au chargement
window.addEventListener('DOMContentLoaded', init);