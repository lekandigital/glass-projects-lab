
import React, { useState } from 'react';
import GlassContainer from './GlassContainer';

interface ToggleProps {
  label: string;
  id: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  isDarkMode?: boolean; // Added for label color
}

const Toggle: React.FC<ToggleProps> = ({ label, id, isChecked, onChange, isDarkMode }) => {
  const labelColor = isDarkMode ? 'text-white/90' : 'text-gray-700';
  return (
    <label htmlFor={id} className="flex items-center justify-between w-full cursor-pointer">
      <span className={`text-sm font-medium ${labelColor}`}>{label}</span>
      <div className="relative">
        <input 
          type="checkbox" 
          id={id} 
          className="sr-only peer" 
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <div className={`w-11 h-6 bg-gray-600/50 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isDarkMode ? 'peer-focus:ring-white/30' : 'peer-focus:ring-sky-500/50'} peer-checked:bg-sky-500`}></div>
      </div>
    </label>
  );
};

interface ToggleWidgetProps {
  glassOpacity?: number;
  isDarkMode: boolean;
  onIsDarkModeChange: (isDark: boolean) => void;
}

const ToggleWidget: React.FC<ToggleWidgetProps> = ({ glassOpacity, isDarkMode, onIsDarkModeChange }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <GlassContainer 
      variant="medium" 
      baseRounded="rounded-[2rem]"
      className="w-full"
      contentClassName="p-4 flex-col gap-4"
      glassOpacity={glassOpacity}
      isDarkMode={isDarkMode}
    >
      <Toggle 
        id="dark-mode-toggle"
        label="Dark Mode"
        isChecked={isDarkMode}
        onChange={onIsDarkModeChange}
        isDarkMode={isDarkMode}
      />
      <Toggle 
        id="notifications-toggle"
        label="Notifications"
        isChecked={notificationsEnabled}
        onChange={setNotificationsEnabled}
        isDarkMode={isDarkMode}
      />
    </GlassContainer>
  );
};

export default ToggleWidget;
