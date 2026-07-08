const VOLUME = 1.0;

export class AudioSystem {
  audioCtx: AudioContext;
  musicGain: GainNode;

  constructor() {
    this.audioCtx = new AudioContext();
    this.musicGain = this.audioCtx.createGain();
    this.musicGain.gain.value = VOLUME;
    this.musicGain.connect(this.audioCtx.destination);
  }

  async load(path: string): Promise<Track> {
    const response = await fetch(path);
    const rawBuffer = await response.arrayBuffer();
    const buffer = await this.audioCtx.decodeAudioData(rawBuffer);
    return { buffer, path };
  }

  play(track: Track) {
    let source = this.audioCtx.createBufferSource();
    source.buffer = track.buffer;
    source.connect(this.musicGain);
    source.start();
  }
}

export type Track = {
  path: string;
  buffer: AudioBuffer;
};
