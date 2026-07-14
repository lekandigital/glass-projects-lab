
import React from 'react';

interface GlassItemProps {
  children?: React.ReactNode;
  icon?: React.ReactElement<any>;
  isActive?: boolean;
  className?: string;
  iconHeight?: string;
  isDarkMode?: boolean; // Added for dark mode
}

const GlassItem: React.FC<GlassItemProps> = ({ children, icon, isActive, className, iconHeight = "auto", isDarkMode = true }) => {
  
  const inactiveTextColor = isDarkMode ? 'text-white/80' : 'text-gray-600';
  const activeTextColor = isDarkMode ? 'text-white' : 'text-sky-600'; // Active text color more distinct in light mode
  const activeBgColor = isDarkMode ? 'bg-black/25' : 'bg-sky-100/70'; // Active background
  
  // Icon color is generally white/light in dark mode, and darker in light mode for better contrast on glass
  const iconFillColor = isDarkMode ? '#FFFFFF' : '#4A5568'; // White for dark, dark gray for light

  let itemClasses = `flex flex-col items-center justify-between ${inactiveTextColor} transition-colors duration-300 ease-in-out text-center`;

  if (isActive) {
    itemClasses = `flex flex-col items-center justify-between ${activeTextColor} ${activeBgColor} transition-colors duration-300 ease-in-out text-center -mx-2 px-[1.95rem] py-1 rounded-[5rem]`;
  } else {
    itemClasses += " rounded-2xl";
  }

  return (
    <div className={`${itemClasses} ${className ?? ''}`}>
      {icon && (
        <div className="mb-1">
          {React.cloneElement(icon, { 
            fillColor: isActive ? (isDarkMode ? '#FFFFFF' : '#0284C7') : iconFillColor, // Active icon color can be different
            height: icon.props.height || iconHeight, 
            width: icon.props.width || 'auto' 
          })}
        </div>
      )}
      {children}
    </div>
  );
};

export default GlassItem;
