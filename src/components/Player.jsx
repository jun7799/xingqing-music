import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Howl } from 'howler';
import { parseLRC, getCurrentLyricIndex } from '../utils/lrcParser';
import Scene from './Scene';
import Lyrics from './Lyrics';
import './Player.css';

const Player = () => {
  const [lyrics, setLyrics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lrcLoaded, setLrcLoaded] = useState(false);

  const soundRef = useRef(null);
  const progressInterval = useRef(null);

  // 初始化 Howler
  useEffect(() => {
    const sound = new Howl({
      src: [`${import.meta.env.BASE_URL}song.mp3`],
      html5: false,
      preload: true,
      onload: () => {
        const dur = sound.duration();
        setDuration(dur);
        console.log('[Howler] Audio loaded, duration:', dur);
      },
      onloaderror: (id, error) => {
        console.error('[Howler] Load error:', error);
      },
      onplay: () => {
        setIsPlaying(true);
        startProgressTracking();
      },
      onpause: () => {
        setIsPlaying(false);
        stopProgressTracking();
      },
      onend: () => {
        setIsPlaying(false);
        stopProgressTracking();
      },
      onseek: () => {
        console.log('[Howler] Seek completed');
      }
    });

    soundRef.current = sound;

    return () => {
      stopProgressTracking();
      sound.unload();
    };
  }, []);

  // 加载歌词文件
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}lyrics.lrc`)
      .then(response => response.text())
      .then(text => {
        const parsedLyrics = parseLRC(text);
        setLyrics(parsedLyrics);
        setLrcLoaded(true);
      })
      .catch(error => {
        console.error('加载歌词失败:', error);
      });
  }, []);

  // 更新当前歌词索引
  useEffect(() => {
    if (lyrics.length > 0) {
      const index = getCurrentLyricIndex(lyrics, currentTime);
      setCurrentIndex(index);
    }
  }, [currentTime, lyrics]);

  // 开始追踪播放进度
  const startProgressTracking = () => {
    stopProgressTracking();
    progressInterval.current = setInterval(() => {
      if (soundRef.current) {
        setCurrentTime(soundRef.current.seek());
      }
    }, 100);
  };

  // 停止追踪播放进度
  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  // 播放/暂停切换
  const togglePlay = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度条位置并跳转
  const seekToPosition = (clientX) => {
    const container = document.querySelector('.progress-container');
    if (!container || !soundRef.current) return;

    const audioDuration = soundRef.current.duration();
    console.log('[Seek] duration:', audioDuration);

    if (!isFinite(audioDuration) || audioDuration <= 0) {
      console.error('[Seek] Invalid duration');
      return;
    }

    const rect = container.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * audioDuration;

    console.log('[Seek] percent:', percent.toFixed(3), 'seeking to:', newTime.toFixed(2) + 's');

    soundRef.current.seek(newTime);
    setCurrentTime(newTime);
  };

  // 点击跳转
  const handleSeek = (e) => {
    seekToPosition(e.clientX);
  };

  // 开始拖动
  const handleSeekStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;

    // 立即跳到点击位置
    seekToPosition(startX);

    const handleMove = (moveEvent) => {
      seekToPosition(moveEvent.clientX);
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  // 计算进度百分比
  const progressPercent = useMemo(() => {
    return (duration > 0 && isFinite(duration)) ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  // 点击歌词跳转到对应时间
  const handleLyricClick = (time) => {
    if (soundRef.current) {
      soundRef.current.seek(time);
      setCurrentTime(time);
      // 如果当前是暂停状态，点击后自动播放
      if (!isPlaying) {
        soundRef.current.play();
      }
    }
  };

  return (
    <div className="player-container">
      {/* 背景场景 */}
      <Scene currentTime={currentTime} />

      {/* 歌词显示 */}
      {lrcLoaded && <Lyrics lyrics={lyrics} currentIndex={currentIndex} onLyricClick={handleLyricClick} />}

      {/* 播放控制条 */}
      <div className="controls-bar">
        <div className="controls-content">
          {/* 歌曲信息 */}
          <div className="song-info">
            <div className="song-title">星晴</div>
            <div className="song-artist">周杰伦</div>
          </div>

          {/* 播放按钮 */}
          <button className="play-button" onClick={togglePlay}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* 时间显示 */}
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="time-separator">/</span>
            <span className="total-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="progress-container" onClick={handleSeek} onMouseDown={handleSeekStart}>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="progress-bar-handle"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
