document.addEventListener("DOMContentLoaded", function () {
  const glassEffect = document.getElementById("glassEffect");
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  let activeIndex = 0; // Home is initially active

  // Set initial position of glass effect
  updateGlassPosition(activeIndex);

  // Add hover event listeners
  sidebarLinks.forEach((link, index) => {
    link.addEventListener("mouseenter", function () {
      updateGlassPosition(index);
      // Update text color for active state
      sidebarLinks.forEach((l) => l.classList.remove("text-white"));
      sidebarLinks.forEach((l) => l.classList.add("text-white"));
      link.classList.remove("text-white");
      link.classList.add("text-white");
    });

    link.addEventListener("click", function (e) {
      e.preventDefault();
      activeIndex = index;
      // Remove active class from all links
      sidebarLinks.forEach((l) => l.classList.remove("active"));
      // Add active class to clicked link
      link.classList.add("active");
    });
  });

  // Return to active link when mouse leaves nav area
  document
    .querySelector(".nav-container")
    .addEventListener("mouseleave", function () {
      updateGlassPosition(activeIndex);
      // Reset text colors
      sidebarLinks.forEach((l) => l.classList.remove("text-white"));
      sidebarLinks.forEach((l) => l.classList.add("text-white"));
      sidebarLinks[activeIndex].classList.remove("text-white");
      sidebarLinks[activeIndex].classList.add("text-white");
    });

  function updateGlassPosition(index) {
    const translateY = index * 56; // 48px height + 8px gap (space-y-2)
    glassEffect.style.transform = `translateY(${translateY}px)`;
  }
});
