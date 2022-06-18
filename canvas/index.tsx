import React, { useEffect, useRef, useState } from 'react';
import LuckyWheel from './lucky';
import Arrow from '../assets/arrow.svg';
import Lucky from '../assets/lucky.svg';
import './index.less';

const PRIZELIST = [
  { desc: '中奖一元-0', bgColor: '#00A5EB', color: '#FFF', imgId: 'lucky' },
  { desc: '谢谢惠顾-1', bgColor: '#fff', color: '#1D6BE1', imgId: 'lucky' },
  { desc: '中奖二元-2', bgColor: '#00A5EB', color: '#FFF', imgId: 'lucky' },
  { desc: '谢谢惠顾-3', bgColor: '#fff', color: '#1D6BE1', imgId: 'lucky' },
  { desc: '中奖三元-4', bgColor: '#00A5EB', color: '#FFF', imgId: 'lucky' },
  { desc: '谢谢惠顾-5', bgColor: '#fff', color: '#1D6BE1', imgId: 'lucky' },
  { desc: '中奖四元-6', bgColor: '#00A5EB', color: '#FFF', imgId: 'lucky' },
  { desc: '谢谢惠顾-7', bgColor: '#fff', color: '#1D6BE1', imgId: 'lucky' },
];

export default function LuckyCanvas() {
  const luckyWheelRef = useRef<any>(null);

  useEffect(() => {
    luckyWheelRef.current = new LuckyWheel({
      selector: '#lucky-wheel',
      segments: PRIZELIST,
      onFinished: (index) => {
        console.log('finished', index);
      },
    });
  }, []);

  const handleStart = () => {
    luckyWheelRef.current.play();
  };

  const handleEnd = () => {
    luckyWheelRef.current.stop(7);
  };

  return (
    <div className="lucky-canvas-wrap">
      <div className="lucky-box">
        <div id="my-lucky" className="lucky-canvas">
          <canvas id="lucky-wheel" />
          <div className="arrow">
            <img src={Arrow} alt="" />
          </div>
        </div>
      </div>

      <div className="opt-btn">
        <button className="start" onClick={handleStart}>
          开始转动
        </button>
        <button onClick={handleEnd}>结束转动-停在指定位置</button>
      </div>
      {/* 用于提前加载 canvas 上需要展示的图片 */}
      <div style={{ display: 'none' }}>
        <img id="lucky" src={Lucky} alt="" />
      </div>
    </div>
  );
}
