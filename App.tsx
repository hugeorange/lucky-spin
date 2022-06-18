import * as React from 'react';
import LuckySpinWithDiv from './div';
import LuckySpinWithCanvas from './canvas';
import './style.css';

export default function App() {
  return (
    <div>
      <h1>div 实现方式</h1>
      <LuckySpinWithDiv />
      <h1>canvas 实现方式</h1>
      <LuckySpinWithCanvas />
    </div>
  );
}
