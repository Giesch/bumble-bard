import p5 from "p5";
import { PLAYER_1 } from "@rcade/plugin-input-classic";

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
const PLAYER_SIZE = 20;

let playerX: number;
let playerY: number;
let spriteSheet: p5.Image;
let spriteAtlas: AsepriteJson;
let bardHeadAnimation: Animation;
let bardTorsoAnimation: Animation;
let bardLegsAnimation: Animation;
let flipPlayer = false;
let currentTime: number;

let lastFrameInputs: typeof PLAYER_1;

function justPressed(button: "A" | "B"): boolean {
  return PLAYER_1[button] && !lastFrameInputs[button];
}

const sketch = (p: p5) => {
  p.preload = () => {
    spriteSheet = p.loadImage("/sprite_sheet.png");
    spriteAtlas = p.loadJSON("/sprite_sheet.json") as AsepriteJson;
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

    const pressedHwaet = justPressed("A");
    if (pressedHwaet) {
      bardHeadAnimation.playOnce();
    }

    const holdingLute = PLAYER_1.B;
    if (holdingLute) {
      bardTorsoAnimation.loop();
    } else {
      bardTorsoAnimation.stop();
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
    playerX = p.constrain(playerX, PLAYER_SIZE / 2, WIDTH - PLAYER_SIZE / 2);
    playerY = p.constrain(playerY, PLAYER_SIZE / 2, HEIGHT - PLAYER_SIZE / 2);

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

    p.background(26, 26, 46);

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
