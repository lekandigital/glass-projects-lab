import React from "react";
import GlassContainer from "./GlassContainer";

const appIconsData = [
  { alt: "Camera", src: "/assets/Camera.png" },
  { alt: "Mail", src: "/assets/Mail.png" },
  { alt: "Messages", src: "/assets/Messages.png" },
  { alt: "Safari", src: "/assets/Safari.png" },
  { alt: "Photos", src: "/assets/Photos.png" },
];

interface AppDockWidgetProps {
  glassOpacity?: number;
  isDarkMode?: boolean; // Added for dark mode
}

const AppDockWidget: React.FC<AppDockWidgetProps> = ({
  glassOpacity,
  isDarkMode = true,
}) => {
  return (
    <GlassContainer
      baseRounded="rounded-[2rem]"
      contentClassName="p-4 gap-3 sm:gap-5 flex-wrap justify-center"
      glassOpacity={glassOpacity}
      isDarkMode={isDarkMode}
    >
      {appIconsData.map((app) => (
        <a
          key={app.alt}
          href="#"
          className="inline-block relative p-px rounded-[1.2rem] group"
          aria-label={app.alt}
        >
          <img
            src={app.src}
            alt={app.alt}
            className="block w-[60px] h-[60px] sm:w-[75px] sm:h-[75px] transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.5)] group-hover:scale-95"
          />
        </a>
      ))}
    </GlassContainer>
  );
};

export default AppDockWidget;
