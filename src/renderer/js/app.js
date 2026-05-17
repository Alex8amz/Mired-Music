const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')
const mm = require('music-metadata')
window.Howl = require('howler').Howl

// ── Estado global ──
const State = {
  tracks: [],
  currentIndex: -1,
  playing: false,
  shuffle: false,
  repeat: false,
  volume: 0.8,
  sound: null,
  progressTimer: null,
  currentView: 'songs'
}

// ── Cargar archivos ──
async function loadFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      const metadata = await mm.parseFile(filePath)
      const tag = metadata.common
      const fmt = metadata.format
      const track = {
        path: filePath,
        title: tag.title || path.basename(filePath, path.extname(filePath)),
        artist: tag.artist || 'Artista desconocido',
        album: tag.album || '',
        duration: fmt.duration || 0,
        format: path.extname(filePath).replace('.', '').toUpperCase(),
        bitsPerSample: fmt.bitsPerSample || null,
        cover: null,
        liked: false,
        playCount: 0
      }
      if (tag.picture && tag.picture.length > 0) {
        const pic = tag.picture[0]
        const blob = new Blob([pic.data], { type: pic.format })
        track.cover = URL.createObjectURL(blob)
      }
      State.tracks.push(track)
    } catch (err) {
      console.error('Error:', filePath, err.message)
    }
  }
  renderCurrentView()
}

// ── Reproducir ──
function playTrack(index) {
  if (index < 0 || index >= State.tracks.length) return
  if (State.sound) {
    State.sound.stop()
    State.sound.unload()
    clearInterval(State.progressTimer)
  }
  State.currentIndex = index
  const track = State.tracks[index]
  track.playCount++
  const fileUrl = 'file:///' + track.path.replace(/\\/g, '/')
  State.sound = new Howl({
    src: [fileUrl],
    html5: true,
    volume: State.volume,
    onplay: () => {
      State.playing = true
      updatePlayButton()
      updateNowPlaying()
      startProgressTimer()
      renderCurrentView()
    },
    onend: () => {
      clearInterval(State.progressTimer)
      State.repeat ? playTrack(index) : playNext()
    },
    onpause: () => {
      State.playing = false
      updatePlayButton()
      clearInterval(State.progressTimer)
    },
    onloaderror: (id, err) => console.error('Error cargando:', err)
  })
  State.sound.play()
}

function playNext() {
  if (!State.tracks.length) return
  const next = State.shuffle
    ? Math.floor(Math.random() * State.tracks.length)
    : (State.currentIndex + 1) % State.tracks.length
  playTrack(next)
}

function playPrev() {
  if (!State.tracks.length) return
  if (State.sound && State.sound.seek() > 3) { State.sound.seek(0); return }
  const prev = (State.currentIndex - 1 + State.tracks.length) % State.tracks.length
  playTrack(prev)
}

function togglePlay() {
  if (!State.sound) { if (State.tracks.length) playTrack(0); return }
  State.playing ? State.sound.pause() : State.sound.play()
}

// ── Progreso ──
function startProgressTimer() {
  clearInterval(State.progressTimer)
  State.progressTimer = setInterval(() => {
    if (!State.sound || !State.playing) return
    const seek = State.sound.seek() || 0
    const duration = State.sound.duration() || 1
    const pct = seek / duration
    document.getElementById('progress-fill').style.width = (pct * 100) + '%'
    document.getElementById('progress-thumb').style.left = (pct * 100) + '%'
    document.getElementById('time-current').textContent = formatTime(seek)
    document.getElementById('time-total').textContent = formatTime(duration)
  }, 500)
}

// ── Color ambiente ──
function extractColor(coverUrl, callback) {
  if (!coverUrl) { callback(null); return }
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 50
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, 50, 50)
    const data = ctx.getImageData(0, 0, 50, 50).data
    let r = 0, g = 0, b = 0, count = 0
    for (let i = 0; i < data.length; i += 16) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
    }
    callback(`${Math.round(r/count)},${Math.round(g/count)},${Math.round(b/count)}`)
  }
  img.onerror = () => callback(null)
  img.src = coverUrl
}

function applyAmbientColor(rgb) {
  const panel = document.getElementById('player-panel')
  let overlay = document.getElementById('ambient-overlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'ambient-overlay'
    overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;transition:background 2s ease;opacity:0.05;'
    document.body.appendChild(overlay)
  }
  if (!rgb) {
    panel.style.background = ''
    overlay.style.background = ''
    return
  }
  panel.style.background = `linear-gradient(180deg, rgba(${rgb},0.18) 0%, #0d0d0d 55%)`
  panel.style.transition = 'background 1.5s ease'
  overlay.style.background = `rgb(${rgb})`
}

// ── UI: Now Playing ──
function updateNowPlaying() {
  const track = State.tracks[State.currentIndex]
  if (!track) return
  document.getElementById('now-title').textContent = track.title
  document.getElementById('now-artist').textContent = track.artist
  let fmtText = track.format
  if (track.bitsPerSample) fmtText += ' · ' + track.bitsPerSample + 'bit'
  document.getElementById('now-fmt').textContent = fmtText
  const artEl = document.getElementById('album-art')
  artEl.innerHTML = track.cover
    ? `<img src="${track.cover}" alt="Carátula">`
    : `<div id="art-inner">♪</div>`
  const likeBtn = document.getElementById('btn-like')
  likeBtn.textContent = track.liked ? '♥' : '♡'
  likeBtn.classList.toggle('liked', track.liked)
  extractColor(track.cover, applyAmbientColor)
}

function updatePlayButton() {
  document.getElementById('btn-play').textContent = State.playing ? '⏸' : '▶'
}

// ── Render vistas ──
function renderCurrentView() {
  if (State.currentView === 'favorites') {
    renderFavorites()
  } else {
    renderTracklist()
  }
}

function renderTracklist() {
  const container = document.getElementById('tracklist')
  if (!State.tracks.length) {
    container.innerHTML = `<div id="empty-state"><p>No hay canciones todavía</p><p class="empty-sub">Usa los botones de arriba para agregar archivos o una carpeta</p></div>`
    return
  }
  container.innerHTML = ''
  State.tracks.forEach((track, i) => {
    container.appendChild(buildTrackItem(track, i))
  })
}

function renderFavorites() {
  const container = document.getElementById('tracklist')
  const favs = State.tracks.filter(t => t.liked)
  if (!favs.length) {
    container.innerHTML = `<div id="empty-state"><p>No hay favoritas todavía</p><p class="empty-sub">Dale ♥ a una canción para verla aquí</p></div>`
    return
  }
  container.innerHTML = ''
  favs.forEach(track => {
    const i = State.tracks.indexOf(track)
    container.appendChild(buildTrackItem(track, i))
  })
}

function buildTrackItem(track, i) {
  const div = document.createElement('div')
  div.className = 'track-item' + (i === State.currentIndex ? ' playing' : '')
  const coverHtml = track.cover ? `<img src="${track.cover}" alt="cover">` : `♪`
  div.innerHTML = `
    <div class="track-num">${i + 1}</div>
    <div class="track-eq" aria-hidden="true">
      <div class="eq-bar" style="height:40%"></div>
      <div class="eq-bar" style="height:70%"></div>
      <div class="eq-bar" style="height:100%"></div>
      <div class="eq-bar" style="height:55%"></div>
    </div>
    <div class="track-cover">${coverHtml}</div>
    <div class="track-info">
      <div class="track-name">${track.title}</div>
      <div class="track-artist">${track.artist}${track.album ? ' — ' + track.album : ''}</div>
    </div>
    <div class="track-right">
      <div class="track-dur">${formatTime(track.duration)}</div>
      <div class="track-fmt">${track.format}</div>
    </div>`
  div.addEventListener('click', () => playTrack(i))
  return div
}

function formatTime(secs) {
  const s = Math.floor(secs), m = Math.floor(s / 60), ss = s % 60
  return m + ':' + (ss < 10 ? '0' : '') + ss
}

// ── Eventos ──
document.getElementById('btn-add-files').addEventListener('click', async () => {
  const files = await ipcRenderer.invoke('open-files')
  if (files && files.length) await loadFiles(files)
})

document.getElementById('btn-add-folder').addEventListener('click', async () => {
  const folder = await ipcRenderer.invoke('open-folder')
  if (!folder) return
  const exts = ['.mp3', '.flac', '.wav', '.ogg', '.aiff', '.m4a']
  const files = []
  function scanDir(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item)
      if (fs.statSync(full).isDirectory()) scanDir(full)
      else if (exts.includes(path.extname(full).toLowerCase())) files.push(full)
    }
  }
  scanDir(folder)
  if (files.length) await loadFiles(files)
})

document.getElementById('btn-play').addEventListener('click', togglePlay)
document.getElementById('btn-next').addEventListener('click', playNext)
document.getElementById('btn-prev').addEventListener('click', playPrev)

document.getElementById('btn-shuffle').addEventListener('click', () => {
  State.shuffle = !State.shuffle
  document.getElementById('btn-shuffle').classList.toggle('active', State.shuffle)
})

document.getElementById('btn-repeat').addEventListener('click', () => {
  State.repeat = !State.repeat
  document.getElementById('btn-repeat').classList.toggle('active', State.repeat)
})

document.getElementById('btn-like').addEventListener('click', () => {
  if (State.currentIndex < 0) return
  const track = State.tracks[State.currentIndex]
  track.liked = !track.liked
  const btn = document.getElementById('btn-like')
  btn.textContent = track.liked ? '♥' : '♡'
  btn.classList.toggle('liked', track.liked)
  if (State.currentView === 'favorites') renderFavorites()
})

document.getElementById('progress-track').addEventListener('click', (e) => {
  if (!State.sound) return
  const rect = document.getElementById('progress-track').getBoundingClientRect()
  State.sound.seek(((e.clientX - rect.left) / rect.width) * State.sound.duration())
})

document.getElementById('volume-slider').addEventListener('input', function () {
  State.volume = this.value / 100
  if (State.sound) State.sound.volume(State.volume)
  document.getElementById('volume-val').textContent = this.value
})

document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('active')))

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
    item.classList.add('active')
    State.currentView = item.dataset.view
    const titles = {
      songs: 'Todas las canciones',
      favorites: 'Favoritas',
      albums: 'Álbumes',
      artists: 'Artistas',
      stats: 'Estadísticas',
      equalizer: 'Ecualizador',
      settings: 'Configuración'
    }
    document.getElementById('toolbar-title').textContent = titles[State.currentView] || ''
    renderCurrentView()
  })
})

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return
  if (e.code === 'Space') { e.preventDefault(); togglePlay() }
  else if (e.code === 'ArrowRight' && State.sound) State.sound.seek(Math.min(State.sound.seek() + 10, State.sound.duration()))
  else if (e.code === 'ArrowLeft' && State.sound) State.sound.seek(Math.max(State.sound.seek() - 10, 0))
})