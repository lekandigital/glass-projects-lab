/*
  Recreation of Apple's Liquid Glass effect using HTML and CSS combined with a SVG filter.
  Based on https://github.com/lucasromerodb/liquid-glass-effect-macos but tweaked after my liking.
*/

// Make the liquid glass box draggable

const liquidGlass = document.querySelector('.liquid-glass');
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

liquidGlass.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;

liquidGlass.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', dragMove);
document.addEventListener('mouseup', dragEnd);

liquidGlass.addEventListener('touchstart', dragStart);
document.addEventListener('touchmove', dragMove);
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
  if (e.type === "touchstart") {
    initialX = e.touches[0].clientX - xOffset;
    initialY = e.touches[0].clientY - yOffset;
  } else {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }

  if (e.target === liquidGlass) {
    isDragging = true;
    liquidGlass.classList.add('dragging');
  }
}

function dragMove(e) {
  if (isDragging) {
    e.preventDefault();

    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, liquidGlass);
  }
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;
  isDragging = false;
  liquidGlass.classList.remove('dragging');
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}