
import React from 'react';
import GlassContainer from './GlassContainer';
import GlassItem from './GlassItem';
import { HomeIcon, LayerGroupIcon, WifiIcon, MusicIcon, SearchIcon } from './icons';

interface NavWidgetsRowProps {
  glassOpacity?: number;
  isDarkMode?: boolean; // Added for dark mode
}

const NavWidgetsRow: React.FC<NavWidgetsRowProps> = ({ glassOpacity, isDarkMode = true }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const navItems = [
    { label: "Home", icon: <HomeIcon width="28" height="28"/>, itemIconHeight:"28px" },
    { label: "New", icon: <LayerGroupIcon width="24" height="24"/>, itemIconHeight:"24px" },
    { label: "Radio", icon: <WifiIcon width="28" height="28"/>, itemIconHeight:"28px" },
    { label: "Library", icon: <MusicIcon width="24" height="24"/>, itemIconHeight:"24px" },
  ];

  return (
    <div className="flex flex-row items-center w-full space-x-2">
      <GlassContainer 
        variant="medium" 
        baseRounded="rounded-[5rem]"
        className="m-2 flex-grow"
        contentClassName="py-1 px-[0.75rem] pr-[2rem] flex-1 justify-between gap-1 sm:gap-2"
        glassOpacity={glassOpacity}
        isDarkMode={isDarkMode}
      >
        {navItems.map((item, index) => (
          <button key={item.label} onClick={() => setActiveIndex(index)} className="flex-1 min-w-0">
            <GlassItem 
              icon={item.icon} 
              isActive={activeIndex === index} 
              iconHeight={item.itemIconHeight} 
              className="py-2 text-xs sm:text-sm"
              isDarkMode={isDarkMode}
            >
              {item.label}
            </GlassItem>
          </button>
        ))}
      </GlassContainer>

      <GlassContainer 
        baseRounded="rounded-[5rem]"
        className="m-2"
        contentClassName="p-[0.6rem]"
        glassOpacity={glassOpacity}
        isDarkMode={isDarkMode}
      >
        <GlassItem 
            icon={<SearchIcon width="24" height="24" />} 
            iconHeight="24px" 
            className="p-1"
            isDarkMode={isDarkMode}
        >
          {/* No text for this icon-only item */}
        </GlassItem>
      </GlassContainer>
    </div>
  );
};

export default NavWidgetsRow;
