import p5 from "p5";
import { PLAYER_1 } from "@rcade/plugin-input-classic";
import * as spinners from "@rcade/plugin-input-spinners";

import * as audio from "./audio";

/** the exported aseprite json */
type AsepriteJson = {
  frames: AsepriteFrame[];
};

/** the metadata for one frame */
type AsepriteFrame = {
  filename: string;
  frame: AsepriteOffsets;
};

/** The source position and size of a sprite in the spritesheet png */
type AsepriteOffsets = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type AnimationPlaying = "once" | "loop" | "off";

/** the state of a specific animation */
class Animation {
  /** the array of aseprite frames to loop through */
  frames: AsepriteOffsets[];
  /** the index of the current frame in the array */
  current: number;
  /** the accumulated milliseconds to 'spend' on moving the frame forward */
  millis: number;
  /** current play state */
  playing: AnimationPlaying;

  constructor(frames: AsepriteOffsets[]) {
    this.frames = frames;
    this.current = 0;
    this.millis = 0;
    this.playing = "off";
  }

  /** update the current frame based on time passed */
  update(deltaTime: number) {
    if (this.playing === "off") return;

    this.millis += deltaTime;

    while (this.millis >= 100) {
      this.millis -= 100;
      this.current += 1;
    }

    if (this.playing === "once" && this.current >= this.frames.length) {
      this.playing = "off";
      this.current = 0;
    }

    this.current %= this.frames.length;
  }

  currentFrame(): AsepriteOffsets {
    return this.frames[this.current];
  }

  playOnce() {
    this.playing = "once";
    this.current = 0;
  }

  loop() {
    this.playing = "loop";
  }

  stop() {
    this.playing = "off";
    this.current = 0;
  }
}

// Rcade game dimensions
const WIDTH = 336;
const HEIGHT = 262;
const SPEED = 2;

let playerX: number;
let playerY: number;
let spriteSheet: p5.Image;
let spriteAtlas: AsepriteJson;
let bardHeadAnimation: Animation;
let bardTorsoAnimation: Animation;
let bardLegsAnimation: Animation;
let flipPlayer = false;
let currentTime: number;
let background: AsepriteFrame;

let audioSystem = new audio.AudioSystem();

let hwaetPaths = [
  "hwaet1.wav",
  "hwaet2.wav",
  "hwaet3.wav",
  "hwaet_again.wav",
  "hwaet_sung.wav",
  "hwaet_thoughtful.wav",
];
let hwaets: audio.Track[];

let songPaths = ["baba.wav", "trololol.wav"];
let songs: audio.Track[];

let lutePaths = [
  "string_1.wav",
  "string_2.wav",
  "string_3.wav",
  "string_4.wav",
  "string_5.wav",
  "string_6.wav",
];
let lutes: audio.Track[];
let spinTimer = 0;
let lutePlaying = false;
let luteTimer = 0;

let spin = 0;

let lastFrameInputs: typeof PLAYER_1;

function justPressed(button: "A" | "B"): boolean {
  return PLAYER_1[button] && !lastFrameInputs[button];
}

const sketch = (p: p5) => {
  p.preload = () => {
    spriteSheet = p.loadImage("/sprite_sheet.png");
    spriteAtlas = p.loadJSON("/sprite_sheet.json") as AsepriteJson;

    (p as any)._incrementPreload();
    Promise.all(hwaetPaths.map((path) => audioSystem.load(`/audio/${path}`)))
      .then((tracks) => {
        hwaets = tracks;
      })
      .catch((err) => console.error("failed to load audio", err))
      .finally(() => (p as any)._decrementPreload());

    (p as any)._incrementPreload();
    Promise.all(songPaths.map((path) => audioSystem.load(`/audio/${path}`)))
      .then((tracks) => {
        songs = tracks;
      })
      .catch((err) => console.error("failed to load audio", err))
      .finally(() => (p as any)._decrementPreload());

    (p as any)._incrementPreload();
    Promise.all(lutePaths.map((path) => audioSystem.load(`/audio/${path}`)))
      .then((tracks) => {
        lutes = tracks;
      })
      .catch((err) => console.error("failed to load audio", err))
      .finally(() => (p as any)._decrementPreload());
  };

  p.setup = () => {
    currentTime = performance.now();

    const frames = spriteAtlas["frames"];
    bardHeadAnimation = new Animation(
      frames
        .filter((f) => f["filename"].startsWith("bard-head"))
        .map((f) => f.frame),
    );
    bardTorsoAnimation = new Animation(
      frames
        .filter((f) => f["filename"].startsWith("bard-torso"))
        .map((f) => f.frame),
    );
    bardLegsAnimation = new Animation(
      frames
        .filter((f) => f["filename"].startsWith("bard-legs"))
        .map((f) => f.frame),
    );
    background = frames.find((f) => f.filename.startsWith("background"))!;

    p.createCanvas(WIDTH, HEIGHT);
    playerX = WIDTH / 2;
    playerY = HEIGHT / 2;
  };

  p.draw = () => {
    // UPDATE

    // update deltaTime
    const now = performance.now();
    const deltaTime = now - currentTime;
    currentTime = now;

    // read player inputs
    let spinDelta = spinners.PLAYER_1.SPINNER.consume_step_delta();
    spin += spinDelta;
    spinTimer += deltaTime;
    if (Math.abs(spin) >= 10) {
      spin = 0;
      spinTimer = 0;
      lutePlaying = true;
    } else {
      if (spinTimer >= 500) {
        lutePlaying = false;
      }
    }
    if (lutePlaying) {
      bardTorsoAnimation.loop();
      luteTimer += deltaTime;
      if (luteTimer >= 750) {
        luteTimer = 0;
        const i = Math.floor(Math.random() * lutes.length);
        const track = lutes[i];
        audioSystem.play(track);
      }
    } else {
      bardTorsoAnimation.stop();
      luteTimer = 0;
    }

    const pressedHwaet = justPressed("A");
    if (pressedHwaet) {
      bardHeadAnimation.playOnce();
      const i = Math.floor(Math.random() * hwaets.length);
      const track = hwaets[i];
      audioSystem.play(track);
    }

    const pressedSing = justPressed("B");
    if (pressedSing) {
      bardHeadAnimation.playOnce();
      const i = Math.floor(Math.random() * songs.length);
      const track = songs[i];
      audioSystem.play(track);
    }

    // update movement/facing
    const dpad = PLAYER_1.DPAD;
    if (dpad.up) {
      playerY -= SPEED;
    }
    if (dpad.down) {
      playerY += SPEED;
    }
    if (dpad.left) {
      flipPlayer = true;
      playerX -= SPEED;
    }
    if (dpad.right) {
      flipPlayer = false;
      playerX += SPEED;
    }
    const isWalking = dpad.left || dpad.right || dpad.up || dpad.down;
    if (isWalking) {
      bardLegsAnimation.loop();
    } else {
      bardLegsAnimation.stop();
    }

    // Keep player in bounds
    playerX = p.constrain(playerX, 10, 300);
    playerY = p.constrain(playerY, 60, 200);

    bardHeadAnimation.update(deltaTime);
    bardTorsoAnimation.update(deltaTime);
    bardLegsAnimation.update(deltaTime);

    // DRAW

    /** a helper for drawing a sub-slice of the sprite sheet */
    const drawSprite = (
      // the source coordinates in the sheet
      f: AsepriteOffsets,
      // the screen position to draw at
      x: number,
      y: number,
      // whether to flip horizontally
      flipX: boolean,
    ) => {
      p.push();

      if (flipX) {
        p.translate(x + f.w, y);
        p.scale(-1, 1);
      } else {
        p.translate(x, y);
      }

      // prettier-ignore
      p.image(
        spriteSheet,
        // screen position (relies on translate call above)
        0, 0, f.w, f.h,
        // sprite-sheet source position
        f.x, f.y, f.w, f.h,
      );

      p.pop();
    };

    drawSprite(background.frame, 0, 10, false);
    drawSprite(background.frame, 0, -50, false);

    // avoid blurring the pixel art drawn below
    p.noSmooth();

    // to let the legs underlap the toroso,
    // they're offset by 1, and drawn in reverse
    const torsoY = playerY + bardHeadAnimation.frames[0].h;
    const legsY = torsoY + bardTorsoAnimation.frames[0].h - 1;
    drawSprite(bardLegsAnimation.currentFrame(), playerX, legsY, flipPlayer);
    drawSprite(bardTorsoAnimation.currentFrame(), playerX, torsoY, flipPlayer);
    drawSprite(bardHeadAnimation.currentFrame(), playerX, playerY, flipPlayer);

    lastFrameInputs = structuredClone(PLAYER_1);
  };
};

new p5(sketch, document.getElementById("sketch")!);
