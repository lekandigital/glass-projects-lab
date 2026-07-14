
import React, { useEffect, useRef, useState } from 'react';
import PlayerWidget from './components/PlayerWidget';
import NavWidgetsRow from './components/NavWidgetsRow';
import SearchButtonWidget from './components/SearchButtonWidget';
import AppDockWidget from './components/AppDockWidget';
import SliderWidget from './components/SliderWidget';
import ToggleWidget from './components/ToggleWidget';
import DigitalClockWidget from './components/DigitalClockWidget';
import WallpaperSettingsWidget from './components/WallpaperSettingsWidget';
import QuickSettingsWidget from './components/QuickSettingsWidget';
import DateWidget from './components/DateWidget';

const App: React.FC = () => {
  const backgroundDivRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const backgroundYOffsetRef = useRef<number>(0);
  const [glassOpacity, setGlassOpacity] = useState<number>(0.05);
  const [wallpaperUrl, setWallpaperUrl] = useState<string>('https://cdn.neowin.com/news/images/galleries/4971/1749539161_macos_26_wallpaper_dark.webp');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark mode

  useEffect(() => {
    if (backgroundDivRef.current) {
      backgroundDivRef.current.style.backgroundPosition = `center calc(50% + ${backgroundYOffsetRef.current}px)`;
    }

    const handleWheel = (event: WheelEvent) => {
      if (backgroundDivRef.current) {
        const scrollSpeed = 0.3; 
        backgroundYOffsetRef.current -= event.deltaY * scrollSpeed;
        backgroundDivRef.current.style.backgroundPosition = `center calc(50% + ${backgroundYOffsetRef.current}px)`;
      }
    };

    const currentScrollableContent = scrollableContentRef.current;
    if (currentScrollableContent) {
      currentScrollableContent.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      if (currentScrollableContent) {
        currentScrollableContent.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleSetWallpaper = (newUrl: string) => {
    if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://') || newUrl.startsWith('data:image'))) {
      setWallpaperUrl(newUrl);
    } else {
      console.warn("Invalid wallpaper URL provided.");
    }
  };

  return (
    <>
      <div
        ref={backgroundDivRef}
        className="fixed inset-0 main-background -z-10"
        style={{ backgroundImage: `url('${wallpaperUrl}')` }}
      />
      <DigitalClockWidget glassOpacity={glassOpacity} isDarkMode={isDarkMode} />

      <div
        ref={scrollableContentRef}
        className="relative z-0 w-full max-w-2xl mx-auto px-4 sm:px-8 pt-24 sm:pt-32 pb-12 overflow-y-auto h-screen no-scrollbar"
      >
        <div className="space-y-8">
          <PlayerWidget glassOpacity={glassOpacity} isDarkMode={isDarkMode} />
          <NavWidgetsRow glassOpacity={glassOpacity} isDarkMode={isDarkMode} />
          <DateWidget glassOpacity={glassOpacity} isDarkMode={isDarkMode} />
          <QuickSettingsWidget glassOpacity={glassOpacity} isDarkMode={isDarkMode} />
          <WallpaperSettingsWidget glassOpacity={glassOpacity} onSetWallpaper={handleSetWallpaper} isDarkMode={isDarkMode} />
          <SearchButtonWidget glassOpacity={glassOpacity} isDarkMode={isDarkMode} />
          <AppDockWidget glassOpacity={glassOpacity} isDarkMode={isDarkMode} />
          <SliderWidget 
            containerGlassOpacity={glassOpacity} 
            currentGlobalGlassOpacity={glassOpacity}
            onGlobalGlassOpacityChange={setGlassOpacity}
            isDarkMode={isDarkMode}
          />
          <ToggleWidget 
            glassOpacity={glassOpacity} 
            isDarkMode={isDarkMode} 
            onIsDarkModeChange={setIsDarkMode} 
          />
        </div>
      </div>
    </>
  );
};

export default App;
