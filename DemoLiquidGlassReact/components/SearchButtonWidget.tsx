
import React from 'react';
import GlassContainer from './GlassContainer';
import { SearchIcon } from './icons';

interface SearchButtonWidgetProps {
  glassOpacity?: number;
  isDarkMode?: boolean; // Added for dark mode
}

const SearchButtonWidget: React.FC<SearchButtonWidgetProps> = ({ glassOpacity, isDarkMode = true }) => {
  const iconFill = isDarkMode ? 'white' : '#4A5568'; // Dark gray for light mode
  const textColor = isDarkMode ? 'text-white/90' : 'text-gray-700';

  return (
    <GlassContainer 
      variant="small"
      contentClassName="py-2 px-6 gap-2"
      glassOpacity={glassOpacity}
      isDarkMode={isDarkMode}
    >
      <SearchIcon width="18" height="18" fillColor={iconFill} />
      <span className={`text-sm ${textColor}`}>{/* Text color inherited from GlassContainer or set explicitly if needed */}Search</span>
    </GlassContainer>
  );
};

export default SearchButtonWidget;
