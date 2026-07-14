
import React, { useState, useEffect } from 'react';

interface DigitalClockWidgetProps {
  glassOpacity: number;
  isDarkMode?: boolean; // Added for dark mode
}

const DigitalClockWidget: React.FC<DigitalClockWidgetProps> = ({ glassOpacity, isDarkMode = true }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formattedTime = formatTime(currentTime);

  const textAlpha = Math.min(1, 0.6 + glassOpacity * 0.4); 

  const clockTextColor = isDarkMode ? `rgba(255, 255, 255, ${textAlpha})` : `rgba(0, 0, 0, ${0.7 + glassOpacity * 0.3})`;
  const clockTextShadow = isDarkMode 
    ? '0px 1px 4px rgba(0, 0, 0, 0.35)' 
    : '0px 1px 3px rgba(255, 255, 255, 0.3)';


  const textStyles: React.CSSProperties = {
    color: clockTextColor,
    textShadow: clockTextShadow,
  };

  return (
    <div 
      className="absolute top-6 left-1/2 -translate-x-1/2 z-50
                 pointer-events-none select-none
                 flex items-center justify-center
                 w-auto"
      role="timer" 
      aria-live="polite" 
      aria-label={`Current time is ${formattedTime}`}
    >
      <span
        className="text-7xl sm:text-8xl font-semibold"
        style={textStyles}
      >
        {formattedTime}
      </span>
    </div>
  );
};

export default DigitalClockWidget;
