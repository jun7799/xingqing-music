import React, { useState, useEffect, useRef } from 'react';
import './Scene.css';

// 所有场景列表
const ALL_SCENES = ['scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6', 'scene7', 'scene8', 'scene9'];

// 根据播放时间获取应该显示的场景 - 《星晴》时间轴
const getSceneForTime = (currentTime) => {
  // 时间单位：秒
  // 0:00-0:22: scene1（前奏 - 望着天手牵手）
  // 0:22-0:44: scene2（蓝天边游荡 - 云掉落面前）
  // 0:44-1:05: scene3（云捏成你的形状）
  // 1:05-1:28: scene4（载着阳光 - 都是晴天）
  // 1:28-1:47: scene5（蝴蝶自在飞 - 花也布满天）
  // 1:47-2:08: scene6（夕阳飞翔 - 环绕大自然）
  // 2:08-2:43: scene7（迎着风 - 共度每一天）
  // 2:43-3:24: scene8（看远方的星 - 许愿）
  // 3:24-结尾: scene9（愿望实现 - 结尾）

  if (currentTime < 22) return 'scene1';
  if (currentTime < 44) return 'scene2';
  if (currentTime < 65) return 'scene3';
  if (currentTime < 88) return 'scene4';
  if (currentTime < 107) return 'scene5';
  if (currentTime < 128) return 'scene6';
  if (currentTime < 163) return 'scene7';
  if (currentTime < 204) return 'scene8';
  return 'scene9';
};

const Scene = ({ currentTime = 0 }) => {
  const [displayedScene, setDisplayedScene] = useState('scene1');
  const preloadDone = useRef(false);

  // 预加载所有图片（只执行一次）
  useEffect(() => {
    if (!preloadDone.current) {
      preloadDone.current = true;
      ALL_SCENES.forEach(scene => {
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}${scene}.jpg`;
      });
      console.log('[Scene] All images preloaded');
    }
  }, []);

  // 只在场景真正变化时才更新DOM
  useEffect(() => {
    const newScene = getSceneForTime(currentTime);
    if (newScene !== displayedScene) {
      setDisplayedScene(newScene);
    }
  }, [currentTime, displayedScene]);

  return (
    <div className="scene-container">
      {/* 背景图片 */}
      <div
        key={displayedScene}
        className="scene-image"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}${displayedScene}.jpg')`
        }}
      />
      {/* 老电影效果层 */}
      <div className="vintage-film-grain" />
      <div className="vintage-scanlines" />
      <div className="vintage-vignette" />
      {/* 渐变遮罩，让歌词更清晰 */}
      <div className="scene-overlay" />
    </div>
  );
};

export default Scene;
