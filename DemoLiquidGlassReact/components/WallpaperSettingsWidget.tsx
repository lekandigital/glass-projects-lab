
import React, { useState } from 'react';
import GlassContainer from './GlassContainer';

interface WallpaperSettingsWidgetProps {
  glassOpacity?: number;
  onSetWallpaper: (url: string) => void;
  isDarkMode?: boolean; // Added for dark mode
}

const WallpaperSettingsWidget: React.FC<WallpaperSettingsWidgetProps> = ({ glassOpacity, onSetWallpaper, isDarkMode = true }) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetWallpaper(inputUrl);
  };

  const currentOpacity = glassOpacity !== undefined ? glassOpacity : 0.25;
  const labelTextColor = isDarkMode ? 'text-white/90' : 'text-gray-700';
  const inputTextColor = isDarkMode ? 'text-gray-800' : 'text-gray-900'; // Input text is on a light background
  const inputPlaceholderColor = isDarkMode ? 'placeholder-gray-500' : 'placeholder-gray-400';
  const buttonTextColor = isDarkMode ? 'text-white/95' : 'text-sky-700'; // Button text on glass

  return (
    <GlassContainer
      variant="medium"
      baseRounded="rounded-[2rem]"
      className="w-full"
      contentClassName="p-4 flex-col gap-3"
      glassOpacity={glassOpacity}
      isDarkMode={isDarkMode}
    >
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <label htmlFor="wallpaper-url-input" className={`block text-sm font-medium ${labelTextColor}`}>
          Set Custom Wallpaper URL
        </label>
        <input
          id="wallpaper-url-input"
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={`w-full px-3 py-2 text-sm ${inputTextColor} bg-white/80 border border-white/50 rounded-lg focus:ring-sky-500 focus:border-sky-500 ${inputPlaceholderColor}`}
          aria-label="Wallpaper URL"
        />
        <button
          type="submit"
          className={`relative group w-full px-4 py-2 text-sm font-semibold ${buttonTextColor} rounded-lg overflow-hidden transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75`}
        >
          <div className="absolute inset-0 z-0 backdrop-blur-sm apply-lg-dist-filter rounded-lg group-hover:opacity-90 transition-opacity"></div>
          <div
            className="absolute inset-0 z-[1] rounded-lg group-hover:opacity-90 transition-opacity"
            style={{ backgroundColor: `rgba(255, 255, 255, ${currentOpacity * 0.8})` }}
          ></div>
          <div
            className="absolute inset-0 z-[1] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: `rgba(255, 255, 255, ${currentOpacity * 1.1 > 1 ? 1 : currentOpacity * 1.1})` }}
          ></div>
          <div className="absolute inset-0 z-[2] rounded-lg shadow-[inset_1px_1px_0_rgba(255,255,255,0.45),_inset_0_0_5px_rgba(255,255,255,0.45)]"></div>
          <span className="relative z-[3]">Set Wallpaper</span>
        </button>
      </form>
    </GlassContainer>
  );
};

export default WallpaperSettingsWidget;
