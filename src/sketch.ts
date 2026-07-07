import p5 from "p5";
import { PLAYER_1 } from "@rcade/plugin-input-classic";

/** The source position and size of a sprite in the spritesheet png; sourced from aseprite json */
type AsepriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

// Rcade game dimensions
const WIDTH = 336;
const HEIGHT = 262;
const SPEED = 4;
const PLAYER_SIZE = 20;

let playerX: number;
let playerY: number;
let spriteSheet: p5.Image;
let spriteAtlas: any;
let bardHead: AsepriteFrame;
let bardTorso: AsepriteFrame;
let bardLegs: AsepriteFrame;
let flipPlayer = false;

const sketch = (p: p5) => {
  p.preload = () => {
    spriteSheet = p.loadImage("/sprite_sheet.png");
    spriteAtlas = p.loadJSON("/sprite_sheet.json");
  };

  p.setup = () => {
    const frames: any[] = spriteAtlas["frames"];

    bardHead = frames.find((f) => f["filename"] === "bard-head 0").frame;
    bardTorso = frames.find((f) => f["filename"] === "bard-torso 0").frame;
    bardLegs = frames.find((f) => f["filename"] === "bard-legs 0").frame;

    p.createCanvas(WIDTH, HEIGHT);
    playerX = WIDTH / 2;
    playerY = HEIGHT / 2;
  };

  p.draw = () => {
    // UPDATE

    // Handle input from arcade controls
    if (PLAYER_1.DPAD.up) {
      playerY -= SPEED;
    }
    if (PLAYER_1.DPAD.down) {
      playerY += SPEED;
    }
    if (PLAYER_1.DPAD.left) {
      flipPlayer = true;
      playerX -= SPEED;
    }
    if (PLAYER_1.DPAD.right) {
      flipPlayer = false;
      playerX += SPEED;
    }

    // Keep player in bounds
    playerX = p.constrain(playerX, PLAYER_SIZE / 2, WIDTH - PLAYER_SIZE / 2);
    playerY = p.constrain(playerY, PLAYER_SIZE / 2, HEIGHT - PLAYER_SIZE / 2);

    // DRAW

    const drawSprite = (
      f: AsepriteFrame,
      x: number,
      y: number,
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

    p.noSmooth();

    // to let the legs underlap the toroso,
    // they're offset by 1, and drawn in reverse
    const torsoY = playerY + bardHead.h;
    const legsY = torsoY + bardTorso.h - 1;
    drawSprite(bardLegs, playerX, legsY, flipPlayer);
    drawSprite(bardTorso, playerX, torsoY, flipPlayer);
    drawSprite(bardHead, playerX, playerY, flipPlayer);
  };
};

new p5(sketch, document.getElementById("sketch")!);
