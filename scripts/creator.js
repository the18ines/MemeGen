// creator.js - Déplacement texte libre (X et Y) après double-clic + zoom/pan image + sauvegarde

// Variables globales
let canvas, ctx;
let uploadedImage = null;
let currentImageData = null;
let imageZoom = 100;
let imagePosX = 0;
let imagePosY = 0;

// Positions et X pour les textes (on stocke X & Y pour déplacer librement)
let topTextX = null;
let topTextY = null;
let bottomTextX = null;
let bottomTextY = null;

// Drag texte state
let draggingText = null; // 'top' | 'bottom' | null
let dragPointerId = null;
let dragOffset = { x: 0, y: 0 };

// Éléments DOM
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const canvasElement = document.getElementById('memeCanvas');
const canvasPlaceholder = document.getElementById('canvasPlaceholder');

// Contrôles de texte
const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const topTextSizeSlider = document.getElementById('topTextSize');
const bottomTextSizeSlider = document.getElementById('bottomTextSize');
const topTextColorPicker = document.getElementById('topTextColor');
const bottomTextColorPicker = document.getElementById('bottomTextColor');

// Contrôles d'image
const imageZoomSlider = document.getElementById('imageZoom');
const imagePosXSlider = document.getElementById('imagePosX');
const imagePosYSlider = document.getElementById('imagePosY');
const zoomValueSpan = document.getElementById('zoomValue');
const resetImageBtn = document.getElementById('resetImageBtn');

// Options
const textShadowCheckbox = document.getElementById('textShadow');
const textOutlineCheckbox = document.getElementById('textOutline');

// Boutons d'action
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');


// Initialisation
function init() {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    // set default UI values
    if (imageZoomSlider) imageZoomSlider.value = imageZoom;
    if (imagePosXSlider) imagePosXSlider.value = imagePosX;
    if (imagePosYSlider) imagePosYSlider.value = imagePosY;
    if (zoomValueSpan) zoomValueSpan.textContent = imageZoom;

    setupEventListeners();
    console.log('✅ Créateur de mèmes initialisé (drag XY activé)');
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Upload d'image
    if (uploadArea) {
        uploadArea.addEventListener('click', () => imageInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-red)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--secondary-blue)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--secondary-blue)';
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file && file.type && file.type.startsWith('image/')) {
                handleImageUpload(file);
            } else {
                showNotification('⚠️ Fichier non-image détecté', 'warning');
            }
        });
    }

    // Input change
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showNotification('⚠️ Sélectionnez un fichier image', 'warning');
                    imageInput.value = '';
                    return;
                }
                handleImageUpload(file);
            }
        });
    }

    // Contrôles de texte avec mise à jour en temps réel
    topTextInput && topTextInput.addEventListener('input', onTextChange);
    bottomTextInput && bottomTextInput.addEventListener('input', onTextChange);
    topTextSizeSlider && topTextSizeSlider.addEventListener('input', onTextSizeChange);
    bottomTextSizeSlider && bottomTextSizeSlider.addEventListener('input', onTextSizeChange);
    topTextColorPicker && topTextColorPicker.addEventListener('input', updateMeme);
    bottomTextColorPicker && bottomTextColorPicker.addEventListener('input', updateMeme);
    textShadowCheckbox && textShadowCheckbox.addEventListener('change', updateMeme);
    textOutlineCheckbox && textOutlineCheckbox.addEventListener('change', updateMeme);

    // ---- handlers pour zoom / position ----
    if (imageZoomSlider) {
        imageZoomSlider.addEventListener('input', (e) => {
            imageZoom = parseInt(e.target.value, 10) || 100;
            if (zoomValueSpan) zoomValueSpan.textContent = imageZoom;
            updateMeme();
        });
    }
    if (imagePosXSlider) {
        imagePosXSlider.addEventListener('input', (e) => {
            imagePosX = parseInt(e.target.value, 10) || 0;
            updateMeme();
        });
    }
    if (imagePosYSlider) {
        imagePosYSlider.addEventListener('input', (e) => {
            imagePosY = parseInt(e.target.value, 10) || 0;
            updateMeme();
        });
    }

    // reset image controls
    resetImageBtn && resetImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imageZoom = 100;
        imagePosX = 0;
        imagePosY = 0;
        if (imageZoomSlider) imageZoomSlider.value = imageZoom;
        if (imagePosXSlider) imagePosXSlider.value = imagePosX;
        if (imagePosYSlider) imagePosYSlider.value = imagePosY;
        if (zoomValueSpan) zoomValueSpan.textContent = imageZoom;
        updateMeme();
        showNotification('🔄 Image réinitialisée', 'info');
    });

    // Boutons d'action
    saveBtn && saveBtn.addEventListener('click', saveMeme);
    downloadBtn && downloadBtn.addEventListener('click', downloadMeme);
    resetBtn && resetBtn.addEventListener('click', resetCanvas);

    // Double-click to start moving text
    canvas && canvas.addEventListener('dblclick', onCanvasDblClick);

    // pointer events to support dragging after dblclick
    // we will attach pointermove/pointerup dynamically when dragging starts
}

// When text content or size changes, ensure default positions are set sensibly
function onTextChange() {
    if (topTextX === null) topTextX = canvas ? canvas.width / 2 : 200;
    if (bottomTextX === null) bottomTextX = canvas ? canvas.width / 2 : 200;
    if (topTextY === null) topTextY = (topTextSizeSlider ? parseInt(topTextSizeSlider.value, 10) || 40 : 40) * 0.9;
    if (bottomTextY === null) bottomTextY = canvas ? canvas.height - ((bottomTextSizeSlider ? parseInt(bottomTextSizeSlider.value, 10) || 40 : 40) * 0.9) : 400;
    updateMeme();
}
function onTextSizeChange() {
    if (topTextX === null) topTextX = canvas ? canvas.width / 2 : 200;
    if (bottomTextX === null) bottomTextX = canvas ? canvas.width / 2 : 200;
    if (topTextY === null) topTextY = (parseInt(topTextSizeSlider.value, 10) || 40) * 0.9;
    if (bottomTextY === null) bottomTextY = canvas ? canvas.height - ((parseInt(bottomTextSizeSlider.value, 10) || 40) * 0.9) : 400;
    updateMeme();
}

// Gérer le téléchargement d'image
function handleImageUpload(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            currentImageData = e.target.result;

            // Ajuster la taille du canvas : on conserve le comportement existant (cap)
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = Math.round(width);
            canvas.height = Math.round(height);

            // reset image pan/zoom on new upload
            imageZoom = 100;
            imagePosX = 0;
            imagePosY = 0;
            if (imageZoomSlider) imageZoomSlider.value = imageZoom;
            if (imagePosXSlider) imagePosXSlider.value = imagePosX;
            if (imagePosYSlider) imagePosYSlider.value = imagePosY;
            if (zoomValueSpan) zoomValueSpan.textContent = imageZoom;

            // set sensible default X/Y positions for texts (centered top/bottom)
            topTextX = canvas.width / 2;
            bottomTextX = canvas.width / 2;
            topTextY = (parseInt(topTextSizeSlider.value, 10) || 40) * 0.9;
            bottomTextY = canvas.height - ((parseInt(bottomTextSizeSlider.value, 10) || 40) * 0.9);

            // Afficher le canvas et masquer le placeholder
            canvas.classList.add('active');
            canvasPlaceholder.classList.add('hidden');

            updateMeme();
            showNotification('✅ Image chargée avec succès!', 'success');

            // reset input to allow same-file re-upload later
            imageInput.value = '';
        };
        img.onerror = () => {
            showNotification('❌ Impossible de lire l\'image', 'error');
        };
        img.src = e.target.result;
    };

    reader.onerror = (err) => {
        console.error('FileReader error', err);
        showNotification('❌ Erreur lecture fichier', 'error');
    };

    reader.readAsDataURL(file);
}

// Mettre à jour le mème (aperçu en temps réel)
// applique désormais zoom + pan + positions de texte (topTextX/Y, bottomTextX/Y)
function updateMeme() {
    if (!uploadedImage) return;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- compute draw size from zoom ---
    const zoomFactor = (imageZoom || 100) / 100;
    const drawWidth = canvas.width * zoomFactor;
    const drawHeight = canvas.height * zoomFactor;

    // compute maximum offsets for panning when zoom > 100
    const maxOffsetX = Math.max(0, (drawWidth - canvas.width) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - canvas.height) / 2);

    // imagePosX / imagePosY sont dans [-100,100] ; map to [-maxOffset, +maxOffset]
    const offsetX = (imagePosX / 100) * maxOffsetX;
    const offsetY = (imagePosY / 100) * maxOffsetY;

    // top-left position where to draw the scaled image
    const drawX = (canvas.width - drawWidth) / 2 - offsetX;
    const drawY = (canvas.height - drawHeight) / 2 - offsetY;

    // Draw the uploaded image scaled to drawWidth x drawHeight
    ctx.drawImage(uploadedImage, 0, 0, uploadedImage.width, uploadedImage.height, drawX, drawY, drawWidth, drawHeight);

    // Ensure default positions exist
    if (topTextX === null) topTextX = canvas.width / 2;
    if (bottomTextX === null) bottomTextX = canvas.width / 2;
    if (topTextY === null) topTextY = (parseInt(topTextSizeSlider.value, 10) || 40) * 0.9;
    if (bottomTextY === null) bottomTextY = canvas.height - ((parseInt(bottomTextSizeSlider.value, 10) || 40) * 0.9);

    // Configuration du texte
    const topText = (topTextInput.value || '').toUpperCase();
    const bottomText = (bottomTextInput.value || '').toUpperCase();
    const topSize = parseInt(topTextSizeSlider.value, 10) || 40;
    const bottomSize = parseInt(bottomTextSizeSlider.value, 10) || 40;
    const topColor = topTextColorPicker.value || '#FFFFFF';
    const bottomColor = bottomTextColorPicker.value || '#FFFFFF';
    const withShadow = textShadowCheckbox.checked;
    const withOutline = textOutlineCheckbox.checked;

    // Dessiner le texte du haut — utilise topTextX/Y (modifiable par drag)
    if (topText) {
        drawText(topText, topTextX, topTextY, topSize, topColor, withShadow, withOutline);
    }

    // Dessiner le texte du bas — utilise bottomTextX/Y
    if (bottomText) {
        drawText(bottomText, bottomTextX, bottomTextY, bottomSize, bottomColor, withShadow, withOutline);
    }
}

// Dessiner du texte sur le canvas
function drawText(text, x, y, fontSize, color, withShadow, withOutline) {
    ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Ombre
    if (withShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
    }

    // Contour noir (outline)
    if (withOutline) {
        ctx.lineWidth = Math.max(2, Math.floor(fontSize / 15));
        ctx.strokeStyle = 'black';
        ctx.strokeText(text, x, y);
    }

    // Texte principal
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    // Réinitialiser l'ombre
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// Double-click handler : if user double-clicks on top or bottom text, start dragging that text (X & Y)
function onCanvasDblClick(ev) {
    if (!uploadedImage) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = (ev.clientX - rect.left);
    const clientY = (ev.clientY - rect.top);

    const topSize = parseInt(topTextSizeSlider.value, 10) || 40;
    const bottomSize = parseInt(bottomTextSizeSlider.value, 10) || 40;
    const topText = (topTextInput.value || '').toUpperCase();
    const bottomText = (bottomTextInput.value || '').toUpperCase();

    const isInsideText = (text, centerX, centerY, size) => {
        if (!text) return false;
        ctx.font = `bold ${size}px Impact, "Arial Black", sans-serif`;
        const w = ctx.measureText(text).width;
        const h = size;
        const left = centerX - w / 2 - 8;
        const right = centerX + w / 2 + 8;
        const top = centerY - h;
        const bottom = centerY + 8;
        return clientX >= left && clientX <= right && clientY >= top && clientY <= bottom;
    };

    if (isInsideText(topText, topTextX || canvas.width / 2, topTextY || (topSize * 0.9), topSize)) {
        startDraggingText('top', ev);
        return;
    }

    if (isInsideText(bottomText, bottomTextX || canvas.width / 2, bottomTextY || (canvas.height - bottomSize * 0.9), bottomSize)) {
        startDraggingText('bottom', ev);
        return;
    }
}

// Start dragging a text element (called on dblclick)
function startDraggingText(which, ev) {
    draggingText = which; // 'top' or 'bottom'
    dragPointerId = ev.pointerId || null;

    const rect = canvas.getBoundingClientRect();
    const clientX = ev.clientX - rect.left;
    const clientY = ev.clientY - rect.top;

    const currentX = (which === 'top') ? (topTextX || canvas.width / 2) : (bottomTextX || canvas.width / 2);
    const currentY = (which === 'top') ? (topTextY || (parseInt(topTextSizeSlider.value, 10) || 40) * 0.9) : (bottomTextY || (canvas.height - ((parseInt(bottomTextSizeSlider.value, 10) || 40) * 0.9)));

    dragOffset.x = clientX - currentX;
    dragOffset.y = clientY - currentY;

    // change cursor to grabbing
    canvas.style.cursor = 'grabbing';
    showNotification('✋ Mode déplacement : déplace la souris (X/Y) puis relâche pour poser', 'info');

    // attach pointermove/pointerup to window so moving outside canvas still works
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // prevent text selection while dragging
    document.body.style.userSelect = 'none';
}

// pointermove while dragging text (updates X & Y)
function handlePointerMove(e) {
    if (!draggingText) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    let newX = clientX - dragOffset.x;
    let newY = clientY - dragOffset.y;

    // clamp inside canvas with small margins
    const margin = 8;
    newX = Math.max(margin, Math.min(canvas.width - margin, newX));
    newY = Math.max(margin, Math.min(canvas.height - margin, newY));

    if (draggingText === 'top') {
        topTextX = newX;
        topTextY = newY;
    } else if (draggingText === 'bottom') {
        bottomTextX = newX;
        bottomTextY = newY;
    }

    updateMeme();
}

// pointerup ends dragging
function handlePointerUp(e) {
    if (!draggingText) return;
    draggingText = null;
    dragPointerId = null;
    dragOffset = { x: 0, y: 0 };
    canvas.style.cursor = 'default';
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    showNotification('✅ Position du texte enregistrée', 'success');
}

// Sauvegarder le mème (fallback si memeDB indisponible)
function saveMeme() {
    if (!uploadedImage) {
        showNotification('⚠️ Veuillez d\'abord charger une image', 'warning');
        return;
    }

    const imageData = canvas.toDataURL('image/png');
    const metadata = {
        topText: topTextInput.value,
        bottomText: bottomTextInput.value,
        topTextSize: topTextSizeSlider.value,
        bottomTextSize: bottomTextSizeSlider.value,
        topTextColor: topTextColorPicker.value,
        bottomTextColor: bottomTextColorPicker.value,
        zoom: imageZoom,
        posX: imagePosX,
        posY: imagePosY,
        // include text positions for precise restore
        topTextX: topTextX,
        topTextY: topTextY,
        bottomTextX: bottomTextX,
        bottomTextY: bottomTextY
    };

    if (typeof memeDB !== 'undefined' && memeDB && typeof memeDB.saveMeme === 'function') {
        try {
            const result = memeDB.saveMeme(imageData, metadata);
            if (result && result.success) {
                showNotification('💾 Mème sauvegardé dans la galerie!', 'success');
                saveBtn.style.transform = 'scale(0.95)';
                setTimeout(() => { saveBtn.style.transform = ''; }, 200);
            } else {
                showNotification('❌ Erreur lors de la sauvegarde', 'error');
            }
        } catch (err) {
            console.error('Erreur memeDB.saveMeme', err);
            showNotification('❌ Erreur serveur lors de la sauvegarde', 'error');
        }
    } else {
        // fallback local
        try {
            const key = 'memegen_local_gallery_v1';
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            arr.unshift({ name: `meme_${Date.now()}.png`, data: imageData, meta: metadata });
            localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
            showNotification('💾 Mème sauvegardé localement (galerie)', 'success');
            saveBtn.style.transform = 'scale(0.95)';
            setTimeout(() => { saveBtn.style.transform = ''; }, 200);
        } catch (err) {
            console.error('Erreur sauvegarde locale', err);
            showNotification('❌ Impossible de sauvegarder localement', 'error');
        }
    }
}

// Télécharger le mème
function downloadMeme() {
    if (!uploadedImage) {
        showNotification('⚠️ Veuillez d\'abord charger une image', 'warning');
        return;
    }

    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.download = `meme_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();

    showNotification('⬇️ Mème téléchargé avec succès!', 'success');
    downloadBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { downloadBtn.style.transform = ''; }, 200);
}

// Réinitialiser le canvas entièrement
function resetCanvas() {
    if (confirm('Voulez-vous vraiment réinitialiser? Toutes les modifications non sauvegardées seront perdues.')) {
        uploadedImage = null;
        currentImageData = null;

        canvas.classList.remove('active');
        canvasPlaceholder.classList.remove('hidden');

        // Réinitialiser les contrôles
        topTextInput.value = '';
        bottomTextInput.value = '';
        topTextSizeSlider.value = 40;
        bottomTextSizeSlider.value = 40;
        topTextColorPicker.value = '#ffffff';
        bottomTextColorPicker.value = '#ffffff';
        textShadowCheckbox.checked = true;
        textOutlineCheckbox.checked = true;

        imageZoom = 100;
        imagePosX = 0;
        imagePosY = 0;
        if (imageZoomSlider) imageZoomSlider.value = imageZoom;
        if (imagePosXSlider) imagePosXSlider.value = imagePosX;
        if (imagePosYSlider) imagePosYSlider.value = imagePosY;
        if (zoomValueSpan) zoomValueSpan.textContent = imageZoom;

        topTextX = null;
        topTextY = null;
        bottomTextX = null;
        bottomTextY = null;

        imageInput.value = '';

        showNotification('🔄 Canvas réinitialisé', 'info');
    }
}

// Notification helper
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
    switch (type) {
        case 'success': notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; break;
        case 'error': notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; break;
        case 'warning': notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; break;
        default: notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1f6feb 100%)';
    }
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animations CSS dynamiques (si pas déjà)
(function addAnimations() {
    if (document.getElementById('memegen-notif-anim')) return;
    const style = document.createElement('style');
    style.id = 'memegen-notif-anim';
    style.textContent = `
        @keyframes slideInRight { from { transform: translateX(400px); opacity: 0;} to { transform: translateX(0); opacity: 1;} }
        @keyframes slideOutRight { from { transform: translateX(0); opacity: 1;} to { transform: translateX(400px); opacity: 0;} }
    `;
    document.head.appendChild(style);
})();

// Initialiser au chargement de la page
window.addEventListener('DOMContentLoaded', init);
