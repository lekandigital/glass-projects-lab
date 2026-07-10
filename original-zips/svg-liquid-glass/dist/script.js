/** @jsx h */

import { render, h } from "https://esm.sh/preact";
import {
useState,
useCallback,
useEffect,
useRef } from
"https://esm.sh/preact/hooks";

const App = () => {
  const divRef = useRef(null);

  const [pos, setPos] = useState([null, null]);
  const [posD, setPosD] = useState([0, 0]);
  const [mouseDown, setMouseDown] = useState(false);

  const [measurements, setMeasurements] = useState({
    width: 0,
    height: 0,
    radius: 0 });


  const onMouseMove = useCallback(e => {
    if (mouseDown) {
      setPos([e.clientX - posD[0], e.clientY - posD[1]]);
    }
  });
  const onMouseDown = useCallback(e => {
    if (pos[0] == null) {
      const { x, y } = divRef.current.getBoundingClientRect();
      setPos([x, y]);
      setPosD([e.clientX - x, e.clientY - y]);
    } else {
      setPosD([e.clientX - pos[0], e.clientY - pos[1]]);
    }
    setMouseDown(true);
  });
  const onMouseUp = useCallback(e => {
    setMouseDown(false);
  });

  useEffect(() => {
    const { width, height } = divRef.current.getBoundingClientRect();
    const radius = getComputedStyle(divRef.current).borderRadius;
    setMeasurements({ width, height, radius });

    if (!navigator.userAgent.includes("Chrome")) {
      alert(
      "Note: Your browser may not be supported. If the effect is not visible, try using Chrome.");

    }
  }, []);

  return (
    h("main", {
      className: "w-screen h-screen overflow-hidden bg-cover bg-center",
      onmousemove: onMouseMove,
      ontouchmove: e => onMouseMove(e.touches[0]) },

    h("div", {
      ref: divRef,
      class: "rounded-3xl w-96 h-32 pointer-events-auto select-none absolute flex items-center justify-center liquid-glass",
      style: {
        left: pos[0] == null ? "50%" : `${pos[0]}px`,
        top: pos[0] == null ? "50%" : `${pos[1]}px`,
        backdropFilter: "url(#liquid-glass)",
        translate: pos[0] == null ? "-50% -50%" : "" },

      onmousedown: onMouseDown,
      onmouseup: onMouseUp,
      ontouchstart: e => onMouseDown(e.touches[0]),
      ontouchend: e => onMouseUp(e.touches[0]) },

    h("p", { class: "text-4xl text-gray-200" }, "SVG Liquid Glass")),

    h(LiquidGlass, {
      pos: pos,
      width: measurements.width,
      height: measurements.height,
      radius: measurements.radius })));



};

const LiquidGlass = ({ pos, width, height, radius }) => {
  return (
    h("svg", { xmlns: "http://www.w3.org/2000/svg" },
    h("defs", null,
    h("filter", { id: "liquid-glass" },
    h("feImage", {
      href: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}px" height="${height}px"><rect width="${width}px" height="${height}px" rx="${radius}" ry="${radius}" fill="black" /></svg>`,
      x: "0",
      y: "0",
      width: width,
      height: height,
      result: "box" }),

    h("feImage", {
      href: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}px" height="${height}px"><rect x="0" y="0" width="50%" height="50%" fill="black" /><rect x="50%" y="50%" width="50%" height="50%" fill="yellow" /><rect x="0" y="50%" width="50%" height="50%" fill="green" /><rect x="50%" y="0" width="50%" height="50%" fill="red" /></svg>`,
      x: width * -0.5,
      y: height * -0.5,
      width: width * 2,
      height: height * 2,
      result: "border-tex" }),

    h("feGaussianBlur", { stdDeviation: "50" }),
    h("feComponentTransfer", { result: "dispMap" },
    h("feFuncA", { type: "discrete", tableValues: "0 1 1 1 1 1 1 1 1" })),

    h("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "dispMap",
      scale: "40",
      xChannelSelector: "R",
      yChannelSelector: "G" }),


    h("feGaussianBlur", { stdDeviation: "5" })))));




};

render(h(App, null), document.getElementById("app"));