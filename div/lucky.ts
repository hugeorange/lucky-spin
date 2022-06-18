const defaultConfig = {
  len: 8, // 奖品个数
  speed: 20, // 速度
  accelerationTime: 2500, // 加速时间
  decelerationTime: 2500, // 减速时间
};

interface ILuckTypes {
  selector?: string;
  len?: number;
  onFinished?: (index: number | undefined) => void;
  [propName: string]: any;
}

const adjustRange = 360 / 8 / 2;

export default class LuckyWheel {
  config: ILuckTypes = defaultConfig;
  luckyWheel: HTMLElement; // 旋转的元素
  rafId: any;
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
  angleCurrent = 0; // 停到指针处的角度值

  prizeDeg = 0; // 中奖角度
  endDeg = 0; // 最后结束角度
  linearDeg = 0; // 转为减速运动前的最后时刻的角度

  constructor(config: ILuckTypes) {
    this.config = { ...defaultConfig, ...config };
    this.segsLen = this.config.len;
    this.luckyWheel = document.querySelector(config.selector);
    this.resetConfig();
    this.draw();
  }

  draw() {
    this.luckyWheel.style.transform = `rotate(${this.angleCurrent}deg)`;
  }

  // 重置变量
  resetConfig() {
    this.angleCurrent = -adjustRange;

    this.startTime = 0;
    this.endTime = 0;
    this.prizeIndex = undefined;
    this.prizeDeg = 0;
    this.endDeg = 0;
    this.linearDeg = 0;
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
    this.prizeDeg = 360 - index * (360 / this.segsLen);
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

      // 减速开始时的开始角度
      this.linearDeg = this.linearDeg || rotateDeg;

      rotateDeg = Math.round(
        quad.easeOut(
          end,
          this.linearDeg,
          this.endDeg - this.linearDeg - adjustRange,
          decelerationTime
        )
      );

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
