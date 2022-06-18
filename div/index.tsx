import React, { useRef, useEffect } from 'react';
import LuckyWheel from './lucky';
import Arrow from '../assets/arrow.svg';
import Lucky from '../assets/lucky.svg';
import './index.less';

const PRIZELIST = [
  { desc: '中奖一元', bgColor: '#00A5EB', color: '#FFF', imageId: 'lucky' },
  { desc: '谢谢惠顾', bgColor: '#fff', color: '#1D6BE1', imageId: 'lucky' },
  { desc: '中奖二元', bgColor: '#00A5EB', color: '#FFF', imageId: 'lucky' },
  { desc: '谢谢惠顾', bgColor: '#fff', color: '#1D6BE1', imageId: 'lucky' },
  { desc: '中奖三元', bgColor: '#00A5EB', color: '#FFF', imageId: 'lucky' },
  { desc: '谢谢惠顾', bgColor: '#fff', color: '#1D6BE1', imageId: 'lucky' },
  { desc: '中奖四元', bgColor: '#00A5EB', color: '#FFF', imageId: 'lucky' },
  { desc: '谢谢惠顾', bgColor: '#fff', color: '#1D6BE1', imageId: 'lucky' },
];

export default function App() {
  const luckyWheelRef = useRef<any>(null);

  useEffect(() => {
    luckyWheelRef.current = new LuckyWheel({
      selector: '.pie',
      segsLen: PRIZELIST.length,
      onFinished: (index) => {
        console.log('finished-->', index);
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
    <div>
      <div className="lucky-div-wrap">
        <ul className="pie">
          {PRIZELIST.map((item, index) => {
            return (
              <li
                key={index}
                className="slice"
                style={{
                  backgroundColor: item.bgColor,
                  color: item.color,
                  transform: `rotate(${index * 45}deg) skewY(-45deg)`,
                }}
              >
                <div className="content">
                  <div>
                    <img src={Lucky} alt="" />
                  </div>
                  <div>
                    {item.desc}-{index}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="arrow">
          <img src={Arrow} alt="" />
        </div>
      </div>
      <div className="opt-btn">
        <button className="start" onClick={handleStart}>
          开始转动
        </button>
        <button onClick={handleEnd}>结束转动-停在指定位置</button>
      </div>
    </div>
  );
}
