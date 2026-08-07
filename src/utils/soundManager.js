// Stellar Strike audio manager
//
// All music and sound effects are streamed at runtime from a public,
// CC0-licensed asset repository rather than being bundled into the app.
// Source: "Superpowers Space Shooter Asset Pack" by Pixel-boy (CC0 1.0),
// mirrored on GitHub: sparklinlabs/superpowers-asset-packs
// https://github.com/sparklinlabs/superpowers-asset-packs (space-shooter/sounds, /music)
const CDN =
  'https://raw.githubusercontent.com/sparklinlabs/superpowers-asset-packs/master/space-shooter';

export const SFX_URLS = {
  shoot: `${CDN}/sounds/laser.wav`,
  explosion: `${CDN}/sounds/1.wav`,
  bossExplosion: `${CDN}/sounds/boss-death.wav`,
  bossShoot: `${CDN}/sounds/boss-shoot.wav`,
  powerUp: `${CDN}/sounds/power-up-1.wav`,
  hit: `${CDN}/sounds/alert.wav`,
  gameOver: `${CDN}/sounds/death.wav`,
  levelUp: `${CDN}/sounds/gold-1.wav`,
  click: `${CDN}/sounds/2.wav`,
};

export const MUSIC_URLS = {
  menu: `${CDN}/music/1.ogg`,
  gameplay: `${CDN}/music/2.ogg`,
  boss: `${CDN}/music/3.ogg`,
  victory: `${CDN}/music/4.ogg`,
};

const SFX_DEFAULT_VOLUME = {
  shoot: 0.35,
  explosion: 0.5,
  bossExplosion: 0.6,
  bossShoot: 0.4,
  powerUp: 0.55,
  hit: 0.55,
  gameOver: 0.6,
  levelUp: 0.55,
  click: 0.4,
};

const STORAGE_KEY = 'stellarstrike:audioSettings';

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        musicVolume: typeof parsed.musicVolume === 'number' ? parsed.musicVolume : 0.5,
        sfxVolume: typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : 0.7,
        muted: !!parsed.muted,
      };
    }
  } catch (e) {
    // ignore corrupt storage
  }
  return { musicVolume: 0.5, sfxVolume: 0.7, muted: false };
};

class SoundManager {
  constructor() {
    this.settings = loadSettings();
    this.sfxPool = {};
    this.musicElement = null;
    this.currentMusicKey = null;
    this.unlocked = false;
    this._buildSfxPool();
  }

  _buildSfxPool() {
    Object.entries(SFX_URLS).forEach(([key, url]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.volume = 0;
      // Kick off loading, but never let a failed/slow network request break gameplay.
      audio.onerror = () => {
        console.warn(`Stellar Strike: failed to load sound "${key}" from ${url}`);
      };
      this.sfxPool[key] = audio;
    });
  }

  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      // ignore quota errors
    }
    this._applyMusicVolume();
  }

  // Browsers block audio until a user gesture happens; call this from any
  // click/touch handler to "unlock" playback for the rest of the session.
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.musicElement) {
      this.musicElement.play().catch(() => {});
    }
  }

  setMusicVolume(v) {
    this.settings.musicVolume = Math.max(0, Math.min(1, v));
    this.saveSettings();
  }

  setSfxVolume(v) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, v));
    this.saveSettings();
  }

  setMuted(muted) {
    this.settings.muted = muted;
    this.saveSettings();
  }

  toggleMuted() {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }

  _effectiveMusicVolume() {
    return this.settings.muted ? 0 : this.settings.musicVolume;
  }

  _applyMusicVolume() {
    if (this.musicElement) {
      this.musicElement.volume = this._effectiveMusicVolume();
    }
  }

  playSfx(key) {
    if (this.settings.muted) return;
    const base = this.sfxPool[key];
    if (!base) return;
    // Clone so overlapping shots/explosions can all be heard at once.
    const node = base.cloneNode();
    node.volume = (SFX_DEFAULT_VOLUME[key] ?? 0.5) * this.settings.sfxVolume;
    node.play().catch(() => {
      // Autoplay was blocked (no user gesture yet) - safe to ignore.
    });
  }

  playMusic(key, { loop = true, fadeMs = 400 } = {}) {
    const url = MUSIC_URLS[key];
    if (!url || this.currentMusicKey === key) return;
    this.currentMusicKey = key;

    const nextTrack = new Audio(url);
    nextTrack.loop = loop;
    nextTrack.volume = 0;

    const prevTrack = this.musicElement;
    this.musicElement = nextTrack;

    if (!this.settings.muted) {
      nextTrack.play().catch(() => {});
    }

    const targetVolume = this._effectiveMusicVolume();
    const steps = 12;
    let step = 0;
    const fadeInterval = setInterval(() => {
      step++;
      const t = step / steps;
      nextTrack.volume = targetVolume * t;
      if (prevTrack) prevTrack.volume = targetVolume * (1 - t);
      if (step >= steps) {
        clearInterval(fadeInterval);
        if (prevTrack) {
          prevTrack.pause();
          prevTrack.src = '';
        }
      }
    }, fadeMs / steps);
  }

  stopMusic() {
    if (this.musicElement) {
      this.musicElement.pause();
      this.musicElement.src = '';
      this.musicElement = null;
    }
    this.currentMusicKey = null;
  }
}

// Single shared instance for the whole app.
const soundManager = new SoundManager();
export default soundManager;
