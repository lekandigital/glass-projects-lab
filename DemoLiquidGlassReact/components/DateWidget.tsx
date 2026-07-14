
import React, { useState, useEffect } from 'react';
import GlassContainer from './GlassContainer';

interface DateWidgetProps {
  glassOpacity?: number;
  isDarkMode?: boolean; // Added for dark mode
}

const DateWidget: React.FC<DateWidgetProps> = ({ glassOpacity, isDarkMode = true }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(new Date());
    };

    updateDate(); 

    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime() - now.getTime();
    
    const timerId = setTimeout(() => {
      updateDate();
      const dailyTimerId = setInterval(updateDate, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyTimerId);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  const formattedDate = currentDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const dateTextColor = isDarkMode ? 'text-white/95' : 'text-gray-700';

  return (
    <GlassContainer
      variant="medium"
      baseRounded="rounded-[2rem]"
      className="w-full"
      contentClassName="p-3 justify-center items-center"
      glassOpacity={glassOpacity}
      isDarkMode={isDarkMode}
    >
      <p className={`text-lg sm:text-xl font-medium ${dateTextColor} text-center`}
         aria-label={`Current date is ${formattedDate}`}
      >
        {formattedDate}
      </p>
    </GlassContainer>
  );
};

export default DateWidget;
