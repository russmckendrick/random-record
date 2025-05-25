// Enhanced Album Collection with swipe gestures and advanced features
class AlbumCollection {
  constructor() {
    this.albums = [];
    this.currentAlbum = null;
    this.albumHistory = [];
    this.maxHistory = 10;
    this.isLoading = false;
    this.swipeThreshold = 100;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.currentSwipeOffset = 0;
    
    this.init();
  }

  async init() {
    await this.fetchAlbums();
    this.setupEventListeners();
    this.setupSwipeGestures();
    this.setupKeyboardControls();
    this.showSwipeIndicator();
  }

  // Show swipe indicator on mobile
  showSwipeIndicator() {
    if (this.isMobile()) {
      const indicator = document.querySelector('.swipe-indicator');
      indicator.classList.add('show');
      
      // Hide after 3 seconds
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 3000);
    }
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  }

  // Fetch albums from API
  async fetchAlbums() {
    try {
      const response = await fetch('https://www.russ.fm/index.json');
      const data = await response.json();
      
      if (data && data.documents && data.documents.length > 0) {
        this.albums = data.documents.filter(album => 
          album.coverImage && album.artist && album.title && album.album
        );
        
        if (this.albums.length > 0) {
          await this.displayRandomAlbum();
        }
      } else {
        this.showError('No album data found');
      }
    } catch (error) {
      console.error('Error fetching album data:', error);
      this.showError('Failed to load albums');
    }
  }

  // Get random album avoiding recent history
  getRandomAlbum() {
    if (this.albums.length === 0) return null;
    
    let availableAlbums = this.albums;
    
    // If we have history, filter out recent albums
    if (this.albumHistory.length > 0 && this.albums.length > 5) {
      const recentIds = this.albumHistory.map(album => album.id || `${album.artist}-${album.album}`);
      availableAlbums = this.albums.filter(album => {
        const albumId = album.id || `${album.artist}-${album.album}`;
        return !recentIds.includes(albumId);
      });
      
      // If we filtered out too many, use all albums
      if (availableAlbums.length === 0) {
        availableAlbums = this.albums;
      }
    }
    
    return availableAlbums[Math.floor(Math.random() * availableAlbums.length)];
  }

  // Display random album with smooth transitions
  async displayRandomAlbum() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState();
    
    const album = this.getRandomAlbum();
    if (!album) return;
    
    // Add to history
    this.addToHistory(album);
    
    // Preload images
    await this.preloadImages(album);
    
    // Display with fade transition
    await this.displayAlbumWithTransition(album);
    
    this.currentAlbum = album;
    this.isLoading = false;
    this.hideLoadingState();
  }

  // Preload album images
  preloadImages(album) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Continue even if image fails
      img.src = album.coverImage;
    });
  }

  // Display album with smooth transition
  async displayAlbumWithTransition(album) {
    const container = document.querySelector('.container');
    const albumInfo = document.querySelector('.album-info');
    
    // Fade out
    container.style.opacity = '0.7';
    albumInfo.classList.add('loading');
    
    // Wait for fade
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Update content
    this.updateAlbumContent(album);
    
    // Fade in
    container.style.opacity = '1';
    albumInfo.classList.remove('loading');
  }

  // Update album content
  updateAlbumContent(album) {
    // Update cover art
    const coverArt = document.querySelector('.cover-art img');
    coverArt.classList.add('loading');
    coverArt.src = album.coverImage;
    coverArt.alt = `${album.artist} - ${album.album} Album Cover`;
    
    // When image loads, remove loading class
    coverArt.onload = () => {
      coverArt.classList.remove('loading');
      coverArt.classList.add('loaded');
    };
    
    // Wrap cover art in link
    const coverArtContainer = document.querySelector('.cover-art');
    const existingLink = coverArtContainer.querySelector('a');
    if (existingLink) {
      existingLink.href = album.albumUri || album.albumFullUri || '#';
    } else {
      const albumLink = document.createElement('a');
      albumLink.href = album.albumUri || album.albumFullUri || '#';
      albumLink.target = '_blank';
      albumLink.rel = 'noopener noreferrer';
      
      const oldImg = coverArtContainer.querySelector('img');
      coverArtContainer.innerHTML = '';
      albumLink.appendChild(oldImg);
      coverArtContainer.appendChild(albumLink);
    }
    
    // Update vinyl label
    const vinylLabel = document.querySelector('.label img');
    vinylLabel.src = album.coverImage;
    vinylLabel.alt = `${album.artist} - ${album.album} Record Label`;
    
    // Update page title
    document.title = `Album Collection - ${album.artist} - ${album.album}`;
    
    // Update album title
    const titleElement = document.querySelector('.album-title');
    titleElement.innerHTML = '';
    const titleLink = document.createElement('a');
    titleLink.href = album.albumUri || album.albumFullUri || '#';
    titleLink.textContent = album.album;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleElement.appendChild(titleLink);
    
    // Update artist
    const artistElement = document.querySelector('.album-artist');
    artistElement.innerHTML = '';
    const artistLink = document.createElement('a');
    artistLink.href = album.artistUri || '#';
    artistLink.textContent = album.artist;
    artistLink.target = '_blank';
    artistLink.rel = 'noopener noreferrer';
    artistElement.appendChild(artistLink);
    
    // Update metadata
    this.updateMetadata(album);
    
    // Update Apple Music button
    this.updateAppleMusicButton(album);
  }

  // Update metadata
  updateMetadata(album) {
    const genresEl = document.querySelector('.album-genres');
    const stylesEl = document.querySelector('.album-styles');
    const dateEl = document.querySelector('.album-date');
    
    if (album.genres && album.genres.length) {
      genresEl.textContent = album.genres.join(', ');
      genresEl.parentElement.style.display = 'block';
    } else {
      genresEl.parentElement.style.display = 'none';
    }
    
    if (album.styles && album.styles.length) {
      stylesEl.textContent = album.styles.join(', ');
      stylesEl.parentElement.style.display = 'block';
    } else {
      stylesEl.parentElement.style.display = 'none';
    }
    
    if (album.date && album.date !== '0001-01-01') {
      const date = new Date(album.date);
      dateEl.textContent = date.getFullYear();
      dateEl.parentElement.style.display = 'block';
    } else {
      dateEl.parentElement.style.display = 'none';
    }
  }

  // Update Apple Music button
  updateAppleMusicButton(album) {
    const appleMusicButton = document.querySelector('.apple-music-button');
    if (album.appleMusicUrl && album.appleMusicUrl.trim() !== '') {
      let musicUrl = album.appleMusicUrl;
      
      if (this.isMobile()) {
        if (musicUrl.includes('music.apple.com')) {
          if (!musicUrl.startsWith('https://')) {
            musicUrl = 'https://' + musicUrl.replace(/^https?:\/\//, '');
          }
        } else if (musicUrl.includes('itunes.apple.com')) {
          musicUrl = musicUrl.replace('itunes.apple.com', 'music.apple.com');
        }
      }
      
      appleMusicButton.href = musicUrl;
      appleMusicButton.classList.remove('hidden');
    } else {
      appleMusicButton.classList.add('hidden');
    }
  }

  // Add album to history
  addToHistory(album) {
    const albumId = album.id || `${album.artist}-${album.album}`;
    
    // Remove if already in history
    this.albumHistory = this.albumHistory.filter(historyAlbum => {
      const historyId = historyAlbum.id || `${historyAlbum.artist}-${historyAlbum.album}`;
      return historyId !== albumId;
    });
    
    // Add to beginning
    this.albumHistory.unshift(album);
    
    // Limit history size
    if (this.albumHistory.length > this.maxHistory) {
      this.albumHistory = this.albumHistory.slice(0, this.maxHistory);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Refresh button
    document.querySelector('.refresh-button').addEventListener('click', () => {
      this.displayRandomAlbum();
    });
    
    // Vinyl controls
    this.setupVinylControls();
    
    // Apple Music button for iOS
    this.setupAppleMusicButton();
  }

  // Setup vinyl controls
  setupVinylControls() {
    const vinyl = document.querySelector('.vinyl');
    let spinning = true;

    vinyl.addEventListener('mouseenter', () => {
      vinyl.style.animationDuration = '8s';
    });

    vinyl.addEventListener('mouseleave', () => {
      vinyl.style.animationDuration = '3s';
    });

    vinyl.addEventListener('click', () => {
      spinning = !spinning;
      vinyl.style.animationPlayState = spinning ? 'running' : 'paused';
    });
  }

  // Setup Apple Music button
  setupAppleMusicButton() {
    const appleMusicButton = document.querySelector('.apple-music-button');
    
    if (this.isMobile()) {
      appleMusicButton.addEventListener('click', function(e) {
        e.preventDefault();
        const musicUrl = this.href;
        window.location.href = musicUrl;
      });
    }
  }

  // Setup swipe gestures
  setupSwipeGestures() {
    const container = document.querySelector('.container');
    
    // Touch events
    container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    
    // Mouse events for desktop testing (only if not mobile)
    if (!this.isMobile()) {
      container.addEventListener('mousedown', (e) => this.handleMouseStart(e));
      container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      container.addEventListener('mouseup', (e) => this.handleMouseEnd(e));
      container.addEventListener('mouseleave', (e) => this.handleMouseEnd(e));
    }
  }

  // Touch start
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.currentSwipeOffset = 0;
  }

  // Touch move
  handleTouchMove(e) {
    if (!this.touchStartX) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - this.touchStartX;
    const diffY = currentY - this.touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault();
      
      this.currentSwipeOffset = diffX * 0.3; // Damping factor
      const container = document.querySelector('.container');
      container.style.setProperty('--swipe-offset', `${this.currentSwipeOffset}px`);
      container.classList.add('swiping');
    }
  }

  // Touch end
  handleTouchEnd(e) {
    if (!this.touchStartX) return;
    
    const container = document.querySelector('.container');
    container.classList.remove('swiping');
    container.classList.add('swipe-release');
    container.style.setProperty('--swipe-offset', '0px');
    
    // Check if swipe was significant enough
    if (Math.abs(this.currentSwipeOffset) > this.swipeThreshold) {
      this.displayRandomAlbum();
    }
    
    // Reset
    setTimeout(() => {
      container.classList.remove('swipe-release');
    }, 300);
    
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.currentSwipeOffset = 0;
  }

  // Mouse events (for desktop testing)
  handleMouseStart(e) {
    // Don't start drag if clicking on vinyl or buttons
    if (e.target.closest('.vinyl') || e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.currentSwipeOffset = 0;
    this.isDragging = true;
    e.preventDefault();
  }

  handleMouseMove(e) {
    if (!this.isDragging || !this.touchStartX) return;
    
    const diffX = e.clientX - this.touchStartX;
    const diffY = e.clientY - this.touchStartY;
    
    // Only start swiping if we've moved enough horizontally
    if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      this.currentSwipeOffset = diffX * 0.3;
      const container = document.querySelector('.container');
      container.style.setProperty('--swipe-offset', `${this.currentSwipeOffset}px`);
      container.classList.add('swiping');
      e.preventDefault();
    }
  }

  handleMouseEnd(e) {
    if (!this.isDragging) return;
    
    const container = document.querySelector('.container');
    container.classList.remove('swiping');
    container.classList.add('swipe-release');
    container.style.setProperty('--swipe-offset', '0px');
    
    if (Math.abs(this.currentSwipeOffset) > this.swipeThreshold) {
      this.displayRandomAlbum();
    }
    
    setTimeout(() => {
      container.classList.remove('swipe-release');
    }, 300);
    
    this.isDragging = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.currentSwipeOffset = 0;
  }

  // Setup keyboard controls
  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          const vinyl = document.querySelector('.vinyl');
          vinyl.click(); // Toggle vinyl spin
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          this.displayRandomAlbum();
          break;
        case 'KeyR':
          if (e.ctrlKey || e.metaKey) return; // Don't interfere with browser refresh
          e.preventDefault();
          this.displayRandomAlbum();
          break;
      }
    });
  }

  // Show loading state
  showLoadingState() {
    const existingSpinner = document.querySelector('.loading-spinner');
    if (!existingSpinner) {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      document.body.appendChild(spinner);
    }
  }

  // Hide loading state
  hideLoadingState() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  }

  // Show error message
  showError(message) {
    console.error(message);
    // Could add a toast notification here
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AlbumCollection();
}); 