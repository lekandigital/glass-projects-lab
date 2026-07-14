
import React from 'react';
import GlassContainer from './GlassContainer';
import GlassItem from './GlassItem';
import { WifiIcon, BluetoothIcon, MoonIcon, AirplaneIcon } from './icons';

interface QuickSettingsWidgetProps {
  glassOpacity?: number;
  isDarkMode?: boolean; // Added for dark mode
}

const QuickSettingsWidget: React.FC<QuickSettingsWidgetProps> = ({ glassOpacity, isDarkMode = true }) => {
  const settings = [
    { label: "Wi-Fi", icon: <WifiIcon width="22" height="22"/>, itemIconHeight: "22px" },
    { label: "Bluetooth", icon: <BluetoothIcon width="22" height="22"/>, itemIconHeight: "22px" },
    { label: "Do Not Disturb", icon: <MoonIcon width="22" height="22"/>, itemIconHeight: "22px" },
    { label: "Airplane Mode", icon: <AirplaneIcon width="22" height="22"/>, itemIconHeight: "22px" },
  ];

  return (
    <GlassContainer
      baseRounded="rounded-[2rem]"
      className="w-full"
      contentClassName="p-3 sm:p-4 grid grid-cols-4 gap-2 sm:gap-3"
      glassOpacity={glassOpacity}
      isDarkMode={isDarkMode}
    >
      {settings.map((item) => (
        <button key={item.label} className="flex-1 min-w-0" aria-label={item.label}>
          <GlassItem 
            icon={item.icon} 
            isActive={false} // Example: isActive={activeSetting === item.label}
            iconHeight={item.itemIconHeight} 
            className="py-2 text-xs text-center"
            isDarkMode={isDarkMode}
          >
            {/* No text label below icon for this style of widget, but could be added */}
          </GlassItem>
        </button>
      ))}
    </GlassContainer>
  );
};

export default QuickSettingsWidget;
