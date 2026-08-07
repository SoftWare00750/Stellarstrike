import React from 'react';

// Tailwind needs full, static class names to detect them at build time, so
// each accent color is spelled out here rather than built with string
// interpolation.
const ACCENT_STYLES = {
  cyan: {
    border: 'border-cyan-500',
    shadow: 'shadow-cyan-500/30',
    text: 'text-cyan-400',
  },
  purple: {
    border: 'border-purple-500',
    shadow: 'shadow-purple-500/30',
    text: 'text-purple-400',
  },
  yellow: {
    border: 'border-yellow-500',
    shadow: 'shadow-yellow-500/30',
    text: 'text-yellow-400',
  },
};

const ModalShell = ({ title, accent = 'cyan', onClose, children }) => {
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.cyan;
  return (
  <div
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onClick={onClose}
  >
    <div
      className={`w-full max-w-lg max-h-[85vh] overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-black border-2 ${styles.border} rounded-2xl shadow-2xl ${styles.shadow} p-6`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold border border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
  );
};

export const SettingsModal = ({
  onClose,
  musicVolume,
  sfxVolume,
  muted,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onToggleMuted,
}) => (
  <ModalShell title="⚙️ Settings" accent="cyan" onClose={onClose}>
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-black/40 rounded-xl px-4 py-3 border border-slate-700">
        <span className="text-white font-semibold text-lg">🔇 Mute All Audio</span>
        <button
          onClick={onToggleMuted}
          role="switch"
          aria-checked={muted}
          aria-label="Mute all audio"
          className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            muted ? 'bg-slate-600' : 'bg-cyan-500'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
              muted ? 'translate-x-0' : 'translate-x-6'
            }`}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor="music-volume" className="flex justify-between text-cyan-300 font-semibold">
          <span>🎵 Music Volume</span>
          <span>{Math.round(musicVolume * 100)}%</span>
        </label>
        <input
          id="music-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicVolume}
          onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-400"
          disabled={muted}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sfx-volume" className="flex justify-between text-purple-300 font-semibold">
          <span>🔊 Sound Effects Volume</span>
          <span>{Math.round(sfxVolume * 100)}%</span>
        </label>
        <input
          id="sfx-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={sfxVolume}
          onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-purple-400"
          disabled={muted}
        />
      </div>

      <p className="text-slate-400 text-sm pt-2 border-t border-slate-700">
        Your audio preferences are saved automatically on this device.
      </p>
    </div>
  </ModalShell>
);

const controlRows = [
  { icon: '⌨️', label: 'Arrow Keys', desc: 'Move your ship (desktop)' },
  { icon: '👆', label: 'Touch & Drag', desc: 'Move your ship (mobile)' },
  { icon: '␣', label: 'Spacebar', desc: 'Fire your weapon (desktop)' },
  { icon: '🔥', label: 'Fire Buttons', desc: 'Fire your weapon (mobile)' },
  { icon: 'Esc', label: 'Escape', desc: 'Pause the game' },
];

const powerUps = [
  { icon: '⚡', name: 'Spread Shot', desc: 'Fire three bullets at once for 10 seconds.' },
  { icon: '🔥', name: 'Rapid Fire', desc: 'Doubles your fire rate for 8 seconds.' },
  { icon: '🛡️', name: 'Shield', desc: 'Blocks one hit for 12 seconds.' },
  { icon: '❤️', name: 'Extra Life', desc: 'Instantly grants one additional life (max 5).' },
];

export const HowToPlayModal = ({ onClose }) => (
  <ModalShell title="📖 How To Play" accent="purple" onClose={onClose}>
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-purple-300 font-bold text-lg mb-2">Controls</h3>
        <div className="space-y-2">
          {controlRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 bg-black/40 rounded-lg px-3 py-2 border border-slate-700">
              <span className="text-xl w-8 text-center">{row.icon}</span>
              <span className="text-white font-semibold w-28">{row.label}</span>
              <span className="text-slate-300 text-sm">{row.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-purple-300 font-bold text-lg mb-2">Power-Ups</h3>
        <div className="space-y-2">
          {powerUps.map((p) => (
            <div key={p.name} className="flex items-start gap-3 bg-black/40 rounded-lg px-3 py-2 border border-slate-700">
              <span className="text-xl w-8 text-center">{p.icon}</span>
              <div>
                <div className="text-white font-semibold">{p.name}</div>
                <div className="text-slate-300 text-sm">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-purple-300 font-bold text-lg mb-2">Objective</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          Survive six escalating levels, from an asteroid belt to elite enemy squadrons, and
          defeat the FINAL BOSS to save the galaxy. Destroy enemies to earn points and clear each
          level's kill quota, collect power-ups to stay alive, and watch your lives &mdash;
          losing them all ends the run.
        </p>
      </div>
    </div>
  </ModalShell>
);

export const CreditsModal = ({ onClose }) => (
  <ModalShell title="🌟 Credits" accent="yellow" onClose={onClose}>
    <div className="space-y-5 text-left text-slate-300 text-sm leading-relaxed">
      <div>
        <h3 className="text-yellow-300 font-bold text-lg mb-1">Stellar Strike</h3>
        <p>A fast-paced 2D space shooter built with React and the HTML5 Canvas API.</p>
      </div>
      <div>
        <h3 className="text-yellow-300 font-bold mb-1">Sound &amp; Music</h3>
        <p>
          Sound effects and music are streamed from the{' '}
          <span className="text-white font-semibold">Superpowers Space Shooter Asset Pack</span>{' '}
          by Pixel-boy, released under the CC0 1.0 Universal (public domain) license.
        </p>
      </div>
      <div>
        <h3 className="text-yellow-300 font-bold mb-1">Engine &amp; Tools</h3>
        <p>React, Vite, and Tailwind CSS.</p>
      </div>
      <div>
        <h3 className="text-yellow-300 font-bold mb-1">Thanks For Playing!</h3>
        <p>Defend the galaxy, chase the high score, and good luck against the final boss.</p>
      </div>
    </div>
  </ModalShell>
);
