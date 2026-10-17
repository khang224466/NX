// Background Ambient & YouTube Music Engine for MCK & Persona Tracks with Infinite Loop

export interface AudioTheme {
  id: string;
  name: string;
  artist: string;
  genre: string;
  tag: string;
  color: string;
  youtubeId?: string;
  youtubeUrl?: string;
  streamUrl?: string;
}

export const AUDIO_THEMES: AudioTheme[] = [
  {
    id: 'mck-khong-can-lo-cho-tao',
    name: 'Không Cần Lo Cho Tao',
    artist: 'MCK (Official Audio - Album HVL)',
    genre: 'Vietnamese Hip-Hop / Chill R&B',
    tag: 'NHẠC NỀN CHÍNH (MCK)',
    color: '#00F0FF',
    youtubeId: 'JMTMew45PN4',
    youtubeUrl: 'https://www.youtube.com/watch?v=JMTMew45PN4',
  },
  {
    id: 'persona-color-your-night',
    name: 'Color Your Night',
    artist: 'Lotus Juice & Azumi Takahashi (Persona 3 Reload)',
    genre: 'Persona Neo-Jazz / Rap',
    tag: 'PERSONA BÀI HAY NHẤT',
    color: '#FF007A',
    youtubeId: 'j9Sn1nFGQQ8',
    youtubeUrl: 'https://youtu.be/j9Sn1nFGQQ8',
  },
  {
    id: 'persona-beneath-the-mask',
    name: 'Beneath the Mask (Rain Lounge)',
    artist: 'Shoji Meguro & Lyn (Persona 5 OST)',
    genre: 'Acid Jazz / Neo-Soul',
    tag: 'PERSONA 5',
    color: '#FFE600',
    streamUrl: 'https://ia801503.us.archive.org/15/items/persona-5-ost-cd-1/1-09%20Beneath%20the%20Mask%20-instrumental%20version-.mp3',
  },
  {
    id: 'neo-jazz-cafe',
    name: 'Autumn Rain & Rhodes Cafe',
    artist: 'Shibuya Midnight Jazz Trio',
    genre: 'Contemporary Smooth Jazz',
    tag: 'JAZZ NHẸ',
    color: '#00FF88',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=jazzy-abstract-beat-11254.mp3',
  },
  {
    id: 'tokyo-jpop-lofi',
    name: 'Tokyo Midnight Crossing',
    artist: 'NEXORA J-Pop Acoustic & Lofi Chill',
    genre: 'J-Pop / City Pop Lofi',
    tag: 'J-POP THEME',
    color: '#A855F7',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
];

type YoutubeController = {
  play: () => void;
  pause: () => void;
  load: (id: string) => void;
  setVolume: (vol: number) => void;
};

class BackgroundMusicEngine {
  private audioEl: HTMLAudioElement | null = null;
  // Default to MCK - "Không Cần Lo Cho Tao" (JMTMew45PN4)
  private currentThemeId: string = 'mck-khong-can-lo-cho-tao';
  private isPlaying: boolean = false;
  private volume: number = 0.55;
  private listeners: Set<() => void> = new Set();
  private ytController: YoutubeController | null = null;

  // Procedural Web Audio Synth fallback
  private synthCtx: AudioContext | null = null;
  private synthInterval: any = null;
  private synthStep: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioEl = new Audio();
      this.audioEl.loop = true; // Infinite loop on native audio
      this.audioEl.volume = this.volume;

      // Ensure infinite loop even if browser halts on loop attribute
      this.audioEl.addEventListener('ended', () => {
        if (this.isPlaying && this.audioEl) {
          this.audioEl.currentTime = 0;
          this.audioEl.play().catch(() => {});
        }
      });

      this.audioEl.addEventListener('error', () => {
        if (this.isPlaying && !this.getCurrentTheme().youtubeId) {
          this.startProceduralFallback();
        }
      });
    }
  }

  public registerYoutubeController(controller: YoutubeController | null) {
    this.ytController = controller;
    if (controller && this.isPlaying) {
      const theme = this.getCurrentTheme();
      if (theme.youtubeId) {
        controller.load(theme.youtubeId);
        controller.setVolume(this.volume);
        controller.play();
      }
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getCurrentTheme(): AudioTheme {
    return AUDIO_THEMES.find((t) => t.id === this.currentThemeId) || AUDIO_THEMES[0];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
    if (this.ytController) {
      this.ytController.setVolume(this.volume);
    }
    this.notify();
  }

  public async setTheme(themeId: string) {
    this.currentThemeId = themeId;
    const theme = this.getCurrentTheme();

    if (this.isPlaying) {
      this.stopProceduralFallback();

      if (theme.youtubeId) {
        if (this.audioEl) this.audioEl.pause();
        if (this.ytController) {
          this.ytController.load(theme.youtubeId);
          this.ytController.setVolume(this.volume);
          this.ytController.play();
        }
      } else if (theme.streamUrl && this.audioEl) {
        if (this.ytController) this.ytController.pause();
        this.audioEl.src = theme.streamUrl;
        this.audioEl.currentTime = 0;
        try {
          await this.audioEl.play();
        } catch {
          this.startProceduralFallback();
        }
      } else {
        if (this.ytController) this.ytController.pause();
        this.startProceduralFallback();
      }
    }
    this.notify();
  }

  public async togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  public async play() {
    this.isPlaying = true;
    const theme = this.getCurrentTheme();

    if (theme.youtubeId) {
      if (this.audioEl) this.audioEl.pause();
      this.stopProceduralFallback();
      if (this.ytController) {
        this.ytController.load(theme.youtubeId);
        this.ytController.setVolume(this.volume);
        this.ytController.play();
      }
    } else if (this.audioEl && theme.streamUrl) {
      if (this.ytController) this.ytController.pause();
      this.audioEl.src = theme.streamUrl;
      try {
        await this.audioEl.play();
      } catch {
        this.startProceduralFallback();
      }
    } else {
      if (this.ytController) this.ytController.pause();
      this.startProceduralFallback();
    }
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
    }
    if (this.ytController) {
      this.ytController.pause();
    }
    this.stopProceduralFallback();
    this.notify();
  }

  // --- Procedural Web Audio Synth fallback for infinite loop ---
  private startProceduralFallback() {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.synthCtx && AudioCtx) {
        this.synthCtx = new AudioCtx();
      }
      if (this.synthCtx && this.synthCtx.state === 'suspended') {
        this.synthCtx.resume().catch(() => {});
      }

      this.stopProceduralFallback();

      let progressions: number[][] = [];
      let stepInterval = 2300;

      if (this.currentThemeId === 'mck-khong-can-lo-cho-tao') {
        // MCK - "Không Cần Lo Cho Tao" (Album HVL - Ebm9 -> Abm7 -> Bbm7 -> Ebm9)
        progressions = [
          [155.56, 185.00, 233.08, 277.18, 349.23], // Ebm9
          [103.83, 164.81, 207.65, 246.94, 311.13], // Abm7
          [116.54, 174.61, 233.08, 277.18, 349.23], // Bbm7
          [155.56, 185.00, 233.08, 277.18, 349.23], // Ebm9
        ];
        stepInterval = 2300;
      } else if (this.currentThemeId === 'persona-color-your-night') {
        // Persona 3 Reload - "Color Your Night" (Dm7 -> Gm7 -> C7 -> Fmaj7)
        progressions = [
          [146.83, 174.61, 220.00, 261.63], // Dm7
          [98.00, 146.83, 174.61, 220.00],  // Gm7
          [130.81, 164.81, 196.00, 233.08], // C7
          [174.61, 220.00, 261.63, 329.63], // Fmaj7
        ];
        stepInterval = 2100;
      } else {
        // Persona 5 "Beneath the Mask" (Dm9 -> G13 -> Cmaj9 -> A7b13)
        progressions = [
          [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
          [98.00, 174.61, 246.94, 329.63],          // G13
          [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
          [110.00, 196.00, 277.18, 349.23],         // A7(b13)
        ];
        stepInterval = 2600;
      }

      this.playSynthChord(progressions[this.synthStep % progressions.length]);

      this.synthInterval = setInterval(() => {
        if (!this.isPlaying) return;
        this.synthStep++;
        this.playSynthChord(progressions[this.synthStep % progressions.length]);
      }, stepInterval);
    } catch {}
  }

  private stopProceduralFallback() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  private playSynthChord(frequencies: number[]) {
    if (!this.synthCtx || !this.isPlaying) return;
    const now = this.synthCtx.currentTime;

    frequencies.forEach((freq, i) => {
      if (!this.synthCtx) return;
      const osc = this.synthCtx.createOscillator();
      const gain = this.synthCtx.createGain();
      const filter = this.synthCtx.createBiquadFilter();

      osc.type = i === 0 ? 'sine' : 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc.frequency.setValueAtTime(freq, now + i * 0.035);

      const noteVol = (i === 0 ? 0.075 : 0.04) * this.volume;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(noteVol, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.synthCtx.destination);

      osc.start(now + i * 0.035);
      osc.stop(now + 2.4);
    });
  }
}

export const musicEngine = new BackgroundMusicEngine();
