gsap.registerPlugin(Draggable);

Draggable.create(".liquid-glass", {
  type: "x, y",
  inertia: true,
  onRelease: function () {
    gsap.to(this.target, {
      x: 0,
      y: 0,
      duration: 1.5,
      ease: "elastic.out(1,0.3)"
    });
  }
});

document.querySelector(".liquid-glass").addEventListener("click", (e) => {
  if (e.target.closest(".liquid-glass__icon")) return;

  e.currentTarget.classList.toggle("is-expanded");
});