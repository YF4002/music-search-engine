const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const soundNamesContainer = document.querySelector('.sound-names');
const resultsContainer = document.querySelector('.results-container');
const titleContainer = document.querySelector('.title');
const descriptionContainer = document.querySelector('.description-container');
const audio = document.getElementById('audio-player');
const downloadButton = document.getElementById('download-button');
const fileInfo = document.getElementById('file-info');
const createdOn = document.getElementById('created-on');
const downloadCount = document.getElementById('download-count');
const averageRating = document.getElementById('average-rating');
const waveform = document.getElementById('wave');

// API token
const API_TOKEN = 'KcUGoRtRWRUYh17ZNx6iWLecwvjAHPzrcIN9CTQA';

// current selected sound details 
let currentSound = null;

// store sounds returned from search by id 
const soundsById = new Map();

// Search and display results
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query) return;

    // Clear previous search results  
    soundNamesContainer.innerHTML = '';
    soundsById.clear();

    fetch(`https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=${API_TOKEN}&page_size=20`)
        .then(response => response.json())
        .then(data => {
            if (!data || !Array.isArray(data.results)) return;
            data.results.forEach(sound => {
                soundsById.set(String(sound.id), sound);
                const soundElement = document.createElement('div');
                soundElement.classList.add('sound-item');
                soundElement.dataset.id = sound.id;
                soundElement.innerHTML = `
                    <div class="vl"></div>
                    <h2>${sound.name}</h2>
                    <p style="font-style: italic;" class="username">by ${sound.username}</p>
                    <hr>
                `;
                soundNamesContainer.appendChild(soundElement);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});

// Click on a song and show details in the right column
soundNamesContainer.addEventListener('click', (event) => {
    const item = event.target.closest('.sound-item');
    if (!item) return;
    const id = item.dataset.id;
    let sound = soundsById.get(String(id));
    fetch(`https://freesound.org/apiv2/sounds/${encodeURIComponent(id)}/?token=${API_TOKEN}`)
        .then(r => r.json())
        .then(s => {
            if (!s) return;
            soundsById.set(String(id), s);
            SoundDetails(s);
            playSound(s);
        })
        .catch(err => console.error('Error fetching sound details:', err));
});

//SOUND DETAILS FUNCTION
function SoundDetails(sound) {
    currentSound = sound;

    if (downloadButton) downloadButton.disabled = !sound.download;

    //file info (size and type)
    if (fileInfo) {
        const filesize = (typeof sound.filesize !== 'undefined' && sound.filesize !== null) ? formatBytes(sound.filesize) : 'N/A';
        const ftype = sound.type || sound.filetype || 'N/A';
        fileInfo.innerHTML = `Size: ${filesize}<br>Type: ${ftype}`;
    }

    // Title and username
    titleContainer.innerHTML = `
        <p style="font-size: 1.5em;" id="names">${sound.name || 'Unknown'}</p>
        <p style="font-size: 1em;" id="username">by ${sound.username || 'Unknown'}</p>
    `;

    // Description and tags 
    const descriptionText = sound.description ? sound.description : 'No description available.';
    const tagsText = Array.isArray(sound.tags) ? sound.tags.join(', ') : (sound.tags || 'No tags');
    descriptionContainer.innerHTML = `
        <p id="description">${descriptionText}</p>
        <p style="font-weight: bold" id="tags">Tags: ${tagsText}</p>
    `;


    // About container

    // Created date 
    let createdText = 'Unknown';
    if (sound.created) {
        try {
            createdText = new Date(sound.created).toISOString(); //format the date
        } catch (e) {
            createdText = sound.created;
        }
    }
    createdOn.innerHTML = `
        <h1>Created on</h1>
        <p>${createdText}</p>
    `;

    // Downloads and rating 
    const numofdownloads = (typeof sound.num_downloads !== 'undefined') ? sound.num_downloads : 'N/A';
    downloadCount.innerHTML = `
        <h1>Download Count</h1>
        <p>${numofdownloads}</p>
    `;

    // Render average rating as stars
    const avgValue = (typeof sound.avg_rating !== 'undefined' && sound.avg_rating !== null) ? Number(sound.avg_rating) : null;
    let ratingHtml = `<h1>Average Rating</h1>`;
    if (avgValue === null || Number.isNaN(avgValue)) {
        ratingHtml += `<p>N/A</p>`;
    } else {
        const clamped = Math.max(0, Math.min(5, avgValue));
        const pct = (clamped / 5) * 100; 
        ratingHtml += `
            <div class="star-rating" aria-label="Average rating: ${clamped} out of 5" title="${clamped} / 5">
                <div class="stars-outer">
                    <div class="stars-base">★★★★★</div>
                    <div class="stars-inner" style="width: ${pct}%">★★★★★</div>
                </div>
            </div>
        `;
    }
    averageRating.innerHTML = ratingHtml;

    // Waveform image
    let waveformHtml = '<h1>Waveform</h1>\n<p>No waveform available.</p>';
    if (sound.images) {
        const imgUrl = sound.images.waveform_l || sound.images.waveform_m || sound.images.waveform || sound.images.wave;
        if (imgUrl) {
            waveformHtml = `<h1>Waveform</h1>\n<img src="${imgUrl}" alt="waveform" style="max-width:100%;height:auto;">`;
        }
    }
    waveform.innerHTML = waveformHtml;

}

// Play the selected sound in the audio player
function playSound(sound) {
    if (!audio) return;
    if (sound && sound.previews) {
        const src = sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'] || sound.previews['preview-hq-ogg'] || sound.previews['preview-lq-ogg'];
        if (src) {
            audio.src = src;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                   
                });
            }
            return;
        }
    }
    audio.removeAttribute('src');
    audio.load();
}


// Download the selected sound
downloadButton.addEventListener('click', () => {
    if (!currentSound) {
        alert('No sound selected for download.');
        return;
    }
    if (!currentSound.download) {
        alert('Download link not available.');
        return;
    }
    let url = currentSound.download;
    if (!/token=/.test(url)) {
        url += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(API_TOKEN);
    }
    // open in new tab/window so browser handles the download
    window.open(url, '_blank');
});


//keyboard Enter to search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchButton.click();
});

// helper to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0 || typeof bytes === 'undefined' || bytes === null) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
