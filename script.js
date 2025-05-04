// Fetch album data and initialize the page
document.addEventListener('DOMContentLoaded', () => {
  fetchAlbums();
  setupVinylControls();
  setupAppleMusicButton();
});

// Additional setup for Apple Music button
function setupAppleMusicButton() {
  const appleMusicButton = document.querySelector('.apple-music-button');
  
  // For iOS devices, we need to ensure the URL opens in Safari first
  // which will then hand off to the Apple Music app
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    appleMusicButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the href which should be a properly formatted web URL
      const musicUrl = this.href;
      
      // Open in the same window to ensure proper handoff to Apple Music app
      window.location.href = musicUrl;
    });
  }
}

// Fetch albums from the API
async function fetchAlbums() {
  try {
    const response = await fetch('https://www.russ.fm/index.json');
    const data = await response.json();
    
    if (data && data.documents && data.documents.length > 0) {
      const randomAlbum = getRandomAlbum(data.documents);
      displayAlbum(randomAlbum);
    } else {
      console.error('No album data found');
    }
  } catch (error) {
    console.error('Error fetching album data:', error);
  }
}

// Get a random album from the list
function getRandomAlbum(albums) {
  const validAlbums = albums.filter(album => 
    album.coverImage && album.artist && album.title && album.album
  );
  return validAlbums[Math.floor(Math.random() * validAlbums.length)];
}

// Display the album data in the UI
function displayAlbum(album) {
  // Update cover art and wrap it in a link
  const coverArt = document.querySelector('.cover-art img');
  coverArt.src = album.coverImage;
  coverArt.alt = `${album.artist} - ${album.album} Album Cover`;
  
  // Wrap the cover art in a link to the album
  const coverArtContainer = document.querySelector('.cover-art');
  const albumLink = document.createElement('a');
  albumLink.href = album.albumUri || album.albumFullUri || '#';
  albumLink.target = '_blank';
  albumLink.rel = 'noopener noreferrer';
  
  // Replace the img with the linked version
  const oldImg = coverArtContainer.querySelector('img');
  coverArtContainer.innerHTML = '';
  albumLink.appendChild(oldImg);
  coverArtContainer.appendChild(albumLink);
  
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
  
  // Update artist with a link
  const artistElement = document.querySelector('.album-artist');
  artistElement.innerHTML = '';
  
  const artistLink = document.createElement('a');
  artistLink.href = album.artistUri || '#';
  artistLink.textContent = album.artist;
  artistLink.target = '_blank';
  artistLink.rel = 'noopener noreferrer';
  
  artistElement.appendChild(artistLink);
  
  // Show genres and styles if available
  const genresEl = document.querySelector('.album-genres');
  const stylesEl = document.querySelector('.album-styles');
  
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
  
  // Update date if available
  const dateEl = document.querySelector('.album-date');
  if (album.date && album.date !== '0001-01-01') {
    const date = new Date(album.date);
    dateEl.textContent = date.getFullYear();
    dateEl.parentElement.style.display = 'block';
  } else {
    dateEl.parentElement.style.display = 'none';
  }
  
  // Set up Apple Music button
  const appleMusicButton = document.querySelector('.apple-music-button');
  if (album.appleMusicUrl && album.appleMusicUrl.trim() !== '') {
    let musicUrl = album.appleMusicUrl;
    
    // Check if we need to reformat the URL for iOS
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Convert to universal link format that works better on iOS
      if (musicUrl.includes('music.apple.com')) {
        // Make sure we're using https://
        if (!musicUrl.startsWith('https://')) {
          musicUrl = 'https://' + musicUrl.replace(/^https?:\/\//, '');
        }
      } else if (musicUrl.includes('itunes.apple.com')) {
        // Convert iTunes links to music.apple.com links which work better
        musicUrl = musicUrl.replace('itunes.apple.com', 'music.apple.com');
      }
    }
    
    appleMusicButton.href = musicUrl;
    appleMusicButton.classList.remove('hidden');
  } else {
    appleMusicButton.classList.add('hidden');
  }
}

// Vinyl spin control
function setupVinylControls() {
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

// Get a new random album when refreshing button is clicked
document.querySelector('.refresh-button').addEventListener('click', () => {
  fetchAlbums();
}); 