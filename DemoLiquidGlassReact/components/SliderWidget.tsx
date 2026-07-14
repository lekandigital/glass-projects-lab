
import React, { useState } from 'react';
import GlassContainer from './GlassContainer';

interface SliderWidgetProps {
  containerGlassOpacity?: number;
  currentGlobalGlassOpacity?: number;
  onGlobalGlassOpacityChange?: (opacity: number) => void;
  isDarkMode?: boolean; // Added for dark mode
}

const SliderWidget: React.FC<SliderWidgetProps> = ({ 
  containerGlassOpacity, 
  currentGlobalGlassOpacity, 
  onGlobalGlassOpacityChange,
  isDarkMode = true 
}) => {
  const [brightness, setBrightness] = useState(75);
  const [volume, setVolume] = useState(50);

  const handleGlobalOpacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onGlobalGlassOpacityChange) {
      onGlobalGlassOpacityChange(Number(event.target.value) / 100);
    }
  };

  const displayGlobalOpacity = currentGlobalGlassOpacity !== undefined 
    ? Math.round(currentGlobalGlassOpacity * 100) 
    : 0;

  const labelTextColor = isDarkMode ? 'text-white/90' : 'text-gray-700';

  return (
    <>
      <GlassContainer 
        variant="medium" 
        baseRounded="rounded-[2rem]"
        className="w-full"
        contentClassName="p-4 flex-col gap-3"
        glassOpacity={containerGlassOpacity}
        isDarkMode={isDarkMode}
      >
        <div className="w-full">
          <label htmlFor="brightness-slider" className={`block text-sm font-medium ${labelTextColor} mb-1`}>
            Brightness
          </label>
          <input
            id="brightness-slider"
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="custom-slider"
            aria-label="Brightness"
          />
        </div>
      </GlassContainer>
      <GlassContainer 
        variant="medium" 
        baseRounded="rounded-[2rem]"
        className="w-full mt-4"
        contentClassName="p-4 flex-col gap-3"
        glassOpacity={containerGlassOpacity}
        isDarkMode={isDarkMode}
      >
        <div className="w-full">
          <label htmlFor="volume-slider" className={`block text-sm font-medium ${labelTextColor} mb-1`}>
            Volume
          </label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="custom-slider"
            aria-label="Volume"
          />
        </div>
      </GlassContainer>
      <GlassContainer 
        variant="medium" 
        baseRounded="rounded-[2rem]"
        className="w-full mt-4"
        contentClassName="p-4 flex-col gap-3"
        glassOpacity={containerGlassOpacity}
        isDarkMode={isDarkMode}
      >
        <div className="w-full">
          <label htmlFor="glass-opacity-slider" className={`block text-sm font-medium ${labelTextColor} mb-1`}>
            Glass Opacity Slider
          </label>
          <input
            id="glass-opacity-slider"
            type="range"
            min="0"
            max="100"
            value={displayGlobalOpacity}
            onChange={handleGlobalOpacityChange}
            className="custom-slider"
            aria-label="Transparency"
          />
        </div>
      </GlassContainer>
    </>
  );
};

export default SliderWidget;
