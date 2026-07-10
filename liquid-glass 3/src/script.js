document.addEventListener('mousemove', (e) => {
  const xPercent = (e.clientX / window.innerWidth - 0.5) * 10;
  const yPercent = (e.clientY / window.innerHeight - 0.5) * 10;
  document.querySelector('.iphone').style.backgroundPosition = `calc(50% + ${xPercent}px) calc(50% + ${yPercent}px)`;
});