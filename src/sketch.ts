import p5 from "p5";
import { PLAYER_1, SYSTEM } from "@rcade/plugin-input-classic";

/** The source position and size of a sprite in the spritesheet png */
type AsepriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

// Rcade game dimensions
const WIDTH = 336;
const HEIGHT = 262;

let spriteSheet: p5.Image;
let spriteAtlas: any;
let bardAssembled: AsepriteFrame;

const sketch = (p: p5) => {
  let x: number;
  let y: number;
  const speed = 4;
  const ballSize = 20;
  let gameStarted = false;

  p.preload = () => {
    spriteSheet = p.loadImage("/sprite_sheet.png");
    spriteAtlas = p.loadJSON("/sprite_sheet.json");
  };

  p.setup = () => {
    bardAssembled = spriteAtlas["frames"][0]["frame"];

    p.createCanvas(WIDTH, HEIGHT);
    x = WIDTH / 2;
    y = HEIGHT / 2;
  };

  p.draw = () => {
    function drawSprite(f: AsepriteFrame, x: number, y: number) {
      // prettier-ignore
      p.image(
        spriteSheet,
        // screen position
        x, y, f.w, f.h,
        // sprite-sheet source position
        f.x, f.y, f.w, f.h,
      );
    }

    p.background(26, 26, 46);

    if (!gameStarted) {
      // Show start screen
      p.fill(255);
      p.textSize(18);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Press 1P START", WIDTH / 2, HEIGHT / 2);
      p.textSize(12);
      p.text("Use D-PAD to move", WIDTH / 2, HEIGHT / 2 + 30);

      if (SYSTEM.ONE_PLAYER) {
        gameStarted = true;
      }
      return;
    }

    // Handle input from arcade controls
    if (PLAYER_1.DPAD.up) {
      y -= speed;
    }
    if (PLAYER_1.DPAD.down) {
      y += speed;
    }
    if (PLAYER_1.DPAD.left) {
      x -= speed;
    }
    if (PLAYER_1.DPAD.right) {
      x += speed;
    }

    // Keep ball in bounds
    x = p.constrain(x, ballSize / 2, WIDTH - ballSize / 2);
    y = p.constrain(y, ballSize / 2, HEIGHT - ballSize / 2);

    p.noSmooth();
    drawSprite(bardAssembled, x, y);
  };
};

new p5(sketch, document.getElementById("sketch")!);
