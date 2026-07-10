// NOT REQUIRED FOR GLASS EFFECT
// Only for preview
gsap.registerPlugin(Draggable);

const glassCard = document.querySelector(".liquid-glass");

Draggable.create(glassCard, {
  type: "x,y",
  bounds: "body",
  edgeResistance: 0.8,
  inertia: false,
  onPress: function () {
    gsap.to(this.target, {
      scale: 0.95,
      duration: 0.2,
      ease: "power2.out"
    });
  },
  onDragStart: function () {
    this.target.classList.add("dragging");
  },
  onRelease: function () {
    this.target.classList.remove("dragging");

    gsap.to(this.target, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "power4.out"
    });
  }
});

glassCard.addEventListener("mouseenter", () => {
  gsap.to(glassCard, {
    scale: 1.05,
    duration: 0.3,
    ease: "power2.out"
  });
});

glassCard.addEventListener("mouseleave", () => {
  if (!glassCard.classList.contains("dragging")) {
    gsap.to(glassCard, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  }
});
