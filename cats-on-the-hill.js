class App {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    document.getElementById("cats-on-the-hill").appendChild(this.canvas);

    this.hills = [
      new Hill("#ECE5C7", 0.2, 12),
      new Hill("#CDC2AE", 0.5, 8),
      new Hill("#116A7B", 1.4, 6),
    ];

    this.catController = new CatController();

    window.addEventListener("resize", this.resize.bind(this), false);
    this.resize();

    requestAnimationFrame(this.animate.bind(this));
  }

  resize() {
    this.stageWidth = document.body.clientWidth;
    this.stageHeight = document.body.clientHeight;

    this.canvas.width = this.stageWidth * 2;
    this.canvas.height = this.stageHeight * 2;
    this.ctx.scale(2, 2);

    for (let i = 0; i < this.hills.length; i++) {
      this.hills[i].resize(this.stageWidth, this.stageHeight);
    }

    this.catController.resize(this.stageWidth, this.stageHeight);
  }

  animate(t) {
    requestAnimationFrame(this.animate.bind(this));

    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

    let dots;

    for (let i = 0; i < this.hills.length; i++) {
      dots = this.hills[i].draw(this.ctx);
    }

    this.catController.draw(this.ctx, t, dots);
  }
}

class Hill {
  constructor(color, speed, total) {
    this.color = color;
    this.speed = speed;
    this.total = total;
  }

  resize(stageWidth, stageHeight) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;

    this.points = [];
    this.gap = Math.ceil(this.stageWidth / (this.total - 2));

    for (let i = 0; i < this.total; i++) {
      this.points[i] = {
        x: i * this.gap,
        y: this.getY(),
      };
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();

    let cur = this.points[0];
    let prev = cur;

    let dots = [];
    cur.x += this.speed;

    if (cur.x > -this.gap) {
      this.points.unshift({
        x: -(this.gap * 2),
        y: this.getY(),
      });
    } else if (cur.x > this.stageWidth + this.gap) {
      this.points.splice(-1);
    }

    ctx.moveTo(cur.x, cur.y);

    let prevCx = cur.x;
    let prevCy = cur.y;

    for (let i = 1; i < this.points.length; i++) {
      cur = this.points[i];
      cur.x += this.speed;
      const cx = (prev.x + cur.x) / 2;
      const cy = (prev.y + cur.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);

      dots.push({
        x1: prevCx,
        y1: prevCy,
        x2: prev.x,
        y2: prev.y,
        x3: cx,
        y3: cy,
      });

      prev = cur;
      prevCx = cx;
      prevCy = cy;
    }
    ctx.lineTo(prev.x, prev.y);
    ctx.lineTo(this.stageWidth, this.stageHeight);
    ctx.lineTo(this.points[0].x, this.stageHeight);
    ctx.fill();

    return dots;
  }

  getY() {
    const min = this.stageHeight / 8;
    const max = this.stageHeight - min;
    return min + Math.random() * max;
  }
}

class CatController {
  constructor() {
    this.img = new Image();
    this.img.onload = () => {
      this.loaded();
    };
    this.img.src = "https://i.postimg.cc/9XBN0FZR/cats.png";

    this.items = [];

    this.cur = 0;
    this.isLoaded = false;
  }

  resize(stageWidth, stageHeight) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
  }

  loaded() {
    this.isLoaded = true;
    this.addCat();
  }

  addCat() {
    this.items.push(new Cat(this.img, this.stageWidth));
  }

  draw(ctx, t, dots) {
    if (this.isLoaded) {
      this.cur += 1;
      if (this.cur > 200) {
        this.cur = 0;
        this.addCat();
      }

      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (item.x < -item.width) {
          this.items.splice(i, 1);
        } else {
          item.draw(ctx, t, dots);
        }
      }
    }
  }
}

class Cat {
  constructor(img, stageWidth) {
    this.img = img;

    this.totalframe = 8;
    this.curFrame = 0;

    this.imgWidth = 112;
    this.imgHeight = 72;

    this.catWidth = 56;
    this.catHeight = 36;

    this.catWidthHalf = this.catWidth / 2;
    this.x = stageWidth + this.catWidth;
    this.y = 0;
    this.speed = Math.random() * 2 + 1;

    this.fps = 5;
    this.fpsTime = 1000 / this.fps;
  }

  draw(ctx, t, dots) {
    if (!this.time) {
      this.time = t;
    }
    const now = t - this.time;
    if (now > this.fpsTime) {
      this.time = t;
      this.curFrame += 1;
      if (this.curFrame == this.totalframe) {
        this.curFrame = 0;
      }
    }
    this.animate(ctx, dots);
  }

  animate(ctx, dots) {
    this.x -= this.speed * 0.4;
    const closest = this.getY(this.x, dots);
    this.y = closest.y;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "#000000";
    ctx.rotate(closest.rotation);
    ctx.drawImage(
      this.img,
      this.imgWidth * this.curFrame,
      0,
      this.imgWidth,
      this.imgHeight,
      -this.catWidthHalf,
      -this.catHeight + 2,
      this.catWidth,
      this.catHeight
    );
    ctx.restore();
  }

  getY(x, dots) {
    for (let i = 1; i < dots.length; i++) {
      if (x >= dots[i].x1 && x <= dots[i].x3) {
        return this.getY2(x, dots[i]);
      }
    }
    return {
      y: 0,
      rotation: 0,
    };
  }

  getY2(x, dot) {
    const total = 200;
    let pt = this.getPointOnQuad(
      dot.x1,
      dot.y1,
      dot.x2,
      dot.y2,
      dot.x3,
      dot.y3,
      0
    );
    let prevX = pt.x;
    for (let i = 1; i < total; i++) {
      const t = i / total;
      pt = this.getPointOnQuad(
        dot.x1,
        dot.y1,
        dot.x2,
        dot.y2,
        dot.x3,
        dot.y3,
        t
      );
      if (x >= prevX && x <= pt.x) {
        return pt;
      }
      prevX = pt.x;
    }
    return pt;
  }

  getQuadValue(p0, p1, p2, t) {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  }

  getPointOnQuad(x1, y1, x2, y2, x3, y3, t) {
    const tx = this.quadTangent(x1, x2, x3, t);
    const ty = this.quadTangent(y1, y2, y3, t);
    const rotation = -Math.atan2(tx, ty) + (90 * Math.PI) / 180;
    return {
      x: this.getQuadValue(x1, x2, x3, t),
      y: this.getQuadValue(y1, y2, y3, t),
      rotation,
    };
  }

  quadTangent(a, b, c, t) {
    return 2 * (1 - t) * (b - a) + 2 * (c - b) * t;
  }
}

window.onload = () => {
  new App();
};
