const defaultConfig = {
  w: 320, // canvas 宽高
  h: 320,
  segments: [],
  padding: 24, // 内边距
  speed: 20,
  accelerationTime: 2500,
  decelerationTime: 2500,
};

interface Isegment {
  desc: string;
  bgColor: string;
  color: string;
  imgId: string;
  [propName: string]: any;
}
interface ILuckTypes {
  w?: number;
  h?: number;
  selector?: string;
  segments: Isegment[];
  onFinished?: (index: number | undefined) => void;
  padding?: number;
  [propName: string]: any;
}

const adjustRange = 360 / 8 / 2;
export default class LuckyWheel {
  rafId: any;
  config: ILuckTypes = defaultConfig;
  images: HTMLImageElement[] | [] = []; // 图片缓存
  ctx: any = null;
  ctxR = 0;
  centerX = 150;
  centerY = 150;
  // ============================================================
  segsLen = 0; // 奖的个数
  /**
   * 游戏当前的阶段
   * step = 0 时, 游戏尚未开始
   * step = 1 时, 此时处于加速阶段
   * step = 2 时, 此时处于匀速阶段
   * step = 3 时, 此时处于减速阶段
   */
  step = 0;
  /**
   * 中奖索引
   * prizeIndex = undefined 时, 处于开始抽奖阶段, 正常旋转
   * prizeIndex >= 0 时, 说明stop方法被调用, 并且传入了中奖索引
   * prizeIndex === -1 时, 说明stop方法被调用, 并且传入了负值, 本次抽奖无效
   */
  prizeIndex: number | undefined = undefined;
  startTime = 0; // 开始时间戳
  endTime = 0; // 停止时间戳
  initDeg = 0; // 初始角度值
  angleCurrent = 0; // 停到指针处的角度值

  rotateDeg = 0; // 转盘旋转角度
  prizeDeg = 0; // 中奖角度
  endDeg = 0; // 最后结束角度
  linearDeg = 0; // 转为减速运动前的最后时刻的角度

  constructor(config: ILuckTypes) {
    this.config = { ...defaultConfig, ...config };
    this.segsLen = this.config.segments.length;
    this.resetConfig();
    this.initCanvas();
  }

  // 重置变量
  resetConfig() {
    // 由于 canvas arc 方法起始角度是 3 点钟方向，需做一些换算处理
    this.initDeg = -(360 / this.segsLen) * 2;
    this.angleCurrent = this.initDeg - adjustRange;

    this.startTime = 0;
    this.endTime = 0;
    this.prizeIndex = undefined;
    this.prizeDeg = 0;
    this.endDeg = 0;
    this.linearDeg = 0;
  }

  initCanvas() {
    const { selector, w, h } = this.config;
    const canvas = document.querySelector(selector!) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('canvas element no exist');
    }
    const ratio = window.devicePixelRatio || 1;
    // 实际渲染像素
    canvas.width = w! * ratio;
    canvas.height = h! * ratio;
    // 控制显示大小
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    this.ctx = canvas.getContext('2d');
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    this.centerX = w! / 2;
    this.centerY = h! / 2;
    this.ctxR = w! / 2;

    this.draw();
    this.initLoadImage();
  }

  // 加载用到的所有图片元素
  initLoadImage() {
    const imageIds = this.config.segments.map((item: Isegment) => item.imgId);
    this.images = imageIds.map((id: string) => {
      return document.getElementById(id) as HTMLImageElement;
    });
    const uniqueImages = Array.from(new Set(imageIds)).map((id: string) => {
      return document.getElementById(id) as HTMLImageElement;
    });
    const urlArrsPromise = uniqueImages.map((image) => {
      return new Promise<void>((resolve, reject) => {
        image.onload = function () {
          resolve();
        };
        image.onerror = function () {
          reject('image unloded error');
        };
        if (image.complete) {
          resolve();
        }
      });
    });
    Promise.allSettled(urlArrsPromise)
      .then(() => this.draw())
      .catch((err) => console.log(err));
  }

  clear() {
    this.ctx?.clearRect(0, 0, 1000, 1000);
  }

  draw() {
    this.clear();
    this.drawWheel();
  }

  drawWheel() {
    // 上一条线的结束角度
    let lastAngle = this.angleCurrent;
    for (let i = 1; i <= this.segsLen; i++) {
      const angle = 360 / this.segsLen + lastAngle;
      this.drawSegment(i - 1, lastAngle, angle);
      lastAngle = angle;
    }
  }

  drawSegment(index: number, lastAngle: number, angle: number) {
    const segItem = this.config.segments[index];
    const { padding } = this.config;
    const { ctx } = this;
    const { desc, color, bgColor } = segItem;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.arc(
      this.centerX,
      this.centerY,
      this.ctxR,
      getAngle(lastAngle),
      getAngle(angle),
      false
    );
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(getAngle(angle));
    ctx.fillStyle = color;
    ctx.font = `700 16px Roboto,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans","Liberation Sans",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`;
    // 测量文本的长度
    const { width } = ctx.measureText(desc);
    ctx.fillText(desc, this.centerX - width - padding!, -10);

    if (this.images.length) {
      ctx.drawImage(this.images[index], this.centerX - 24 - padding!, -50);
    }
    ctx.restore();
  }

  // 开始游戏
  public play() {
    if (this.step !== 0) return;
    this.resetConfig();
    // 记录游戏开始时间
    this.startTime = Date.now();
    // 加速阶段
    this.step = 1;
    // 开始游戏
    this.run();
  }

  /**
   * 对外暴露: 缓慢停止方法
   * @param index 中奖索引
   */
  public stop(index: number) {
    this.endTime = Date.now();
    this.prizeIndex = index;
    this.prizeDeg = 360 - index * (360 / this.segsLen) + this.initDeg;
    this.step = 3;
  }

  run() {
    const { step, prizeIndex } = this;
    const { accelerationTime, decelerationTime, speed, onFinished } =
      this.config;

    // 游戏结束
    if (this.step === 0) {
      this.rafId && cancelAnimationFrame(this.rafId);
      onFinished?.(prizeIndex);
      return;
    }

    // 计算时间间隔
    const start = Date.now() - this.startTime;
    let rotateDeg = this.angleCurrent;

    if (step === 1 || start < accelerationTime) {
      // 加速阶段
      const curSpeed = Math.round(
        quad.easeIn(start, 1, speed, accelerationTime)
      );
      // 加速到峰值后, 进入匀速阶段
      if (curSpeed >= speed) {
        this.step = 2;
      }
      rotateDeg += curSpeed;
      // console.log('加速阶段-->', rotateDeg, curSpeed)
    } else if (step === 2) {
      // 匀速阶段 速度保持不变
      rotateDeg += speed;
      // 如果 prizeIndex 有值, 说明已经调用 stop 方法 则进入减速阶段
      if (prizeIndex !== undefined && prizeIndex >= 0) {
        this.step = 3;
      }
      // console.log('匀速阶段-->', rotateDeg, speed)
    } else if (step === 3) {
      // 减速阶段 缓慢结束算法
      const end = Date.now() - this.endTime;

      // 结束角度
      this.endDeg =
        this.endDeg ||
        this.prizeDeg + (360 - (rotateDeg % 360) + rotateDeg) + 360 * 2;

      // 开始角度
      this.linearDeg = this.linearDeg || rotateDeg;

      rotateDeg = Math.round(
        quad.easeOut(
          end,
          this.linearDeg,
          this.endDeg - this.linearDeg - adjustRange,
          decelerationTime
        )
      );
      // console.log(
      //   'end--->',
      //   end,
      //   'rotateDeg-->',
      //   rotateDeg,
      //   'prizeDeg-->',
      //   this.prizeDeg,
      //   'this.endDeg',
      //   this.endDeg,
      // )
      if (end >= decelerationTime) {
        this.step = 0;
      }
    } else {
      console.warn('occured error');
    }

    this.angleCurrent = rotateDeg;
    this.draw();

    this.rafId = window.requestAnimationFrame(() => {
      this.run();
    });
  }
}

/**
 * 缓动函数
 * t: current time（当前时间）
 * b: beginning value（初始值）
 * c: change in value（变化量）
 * d: duration（持续时间）
 * https://github.com/zhangxinxu/Tween
 */
const quad = {
  easeIn(t: number, b: number, c: number, d: number) {
    return c * (t /= d) * t + b;
  },
  easeOut(t: number, b: number, c: number, d: number) {
    return -c * (t /= d) * (t - 2) + b;
  },
};

/**
 * 转换为运算角度
 * @param { number } deg 数学角度
 * @return { number } canvas 画圆角度
 */
function getAngle(deg: number): number {
  return (Math.PI / 180) * deg;
}
