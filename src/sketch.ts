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
let flipPlayer = false;

const sketch = (p: p5) => {
  let x: number;
  let y: number;
  const speed = 4;
  const ballSize = 20;

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
    // UPDATE

    // Handle input from arcade controls
    if (PLAYER_1.DPAD.up) {
      y -= speed;
    }
    if (PLAYER_1.DPAD.down) {
      y += speed;
    }
    if (PLAYER_1.DPAD.left) {
      flipPlayer = true;
      x -= speed;
    }
    if (PLAYER_1.DPAD.right) {
      flipPlayer = false;
      x += speed;
    }

    // Keep ball in bounds
    x = p.constrain(x, ballSize / 2, WIDTH - ballSize / 2);
    y = p.constrain(y, ballSize / 2, HEIGHT - ballSize / 2);

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
    drawSprite(bardAssembled, x, y, flipPlayer);
  };
};

new p5(sketch, document.getElementById("sketch")!);
