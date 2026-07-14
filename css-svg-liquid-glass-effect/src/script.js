// https://gist.github.com/rebane2001/8ba35ad6e1b17c4cb5b2b2431d9e992c

const draggable = document.getElementById("draggable");
  const preview = document.getElementById("preview");

  const effectSvg = document.getElementById("effectSvg");
  const thing9 = document.getElementById("thing9");
  const thing0 = document.getElementById("thing0");
  const thing1 = document.getElementById("thing1");
  const thing2 = document.getElementById("thing2");
  const preblur = document.getElementById("preblur");
  const postblur = document.getElementById("postblur");
  const dispR = document.getElementById("dispR");
  const dispG = document.getElementById("dispG");
  const dispB = document.getElementById("dispB");
  function updateSettings() {
    const vals = {};
    document.querySelectorAll("#controls input").forEach(e=>vals[e.id]=e.value);
    const w = vals.w;
    const h = vals.h;
    effectSvg.setAttribute("width", `${w}`); 
    effectSvg.setAttribute("height", `${h}`); 
    effectSvg.setAttribute("viewBox", `0 0 ${w} ${h}`); 
    preview.style.width = `${parseFloat(w)+50}px`;
    preview.style.height = `${parseFloat(h)+50}px`;
    preview.style.translate = `${w/4}px ${h/4}px`;
    draggable.style.top = `${-1200+h/4}px`;
    draggable.style.left = `${-1200+w/4}px`;
    draggable.style.clipPath = `polygon(calc(100% - ${w/2+25}px) calc(100% - ${h/2+25}px), calc(100% - ${w/2+25}px) 100%, 100% 100%, 100% calc(100% - ${h/2+25}px))`;
    thing9.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `data:image/svg+xml,%3Csvg width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='rgb%280 0 0 %2F${vals.d1/2.55}%25%29' /%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='%23FFF' style='filter:blur(${vals.d2}px)' /%3E%3C/svg%3E`);
    thing0.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `data:image/svg+xml,%3Csvg width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='rgb%28255 255 255 %2F${vals.l1/2.55}%25%29' style='filter:blur(${vals.l2}px)' /%3E%3C/svg%3E`);
    thing1.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `data:image/svg+xml,%3Csvg width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='%23000' /%3E%3C/svg%3E`);
    thing2.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `data:image/svg+xml,%3Csvg width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='gradient1' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%23000'/%3E%3Cstop offset='100%25' stop-color='%2300F'/%3E%3C/linearGradient%3E%3ClinearGradient id='gradient2' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23000'/%3E%3Cstop offset='100%25' stop-color='%230F0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='0' y='0' width='${w}' height='${h}' rx='${vals.r}' fill='%237F7F7F' /%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='%23000' /%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='url(%23gradient1)' style='mix-blend-mode: screen' /%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='url(%23gradient2)' style='mix-blend-mode: screen' /%3E%3Crect x='${w/4}' y='${h/4}' width='${w/2}' height='${h/2}' rx='${vals.r}' fill='rgb%28127 127 127 %2F${(255-vals.c1)/2.55}%25%29' style='filter:blur(${20-vals.c2}px)' /%3E%3C/svg%3E`);
    preblur.setAttribute("stdDeviation", `${vals.b1/10}`);
    postblur.setAttribute("stdDeviation", `${vals.b2/10}`);
    dispR.setAttribute("scale", `${-150+vals.c4/10}`);
    dispG.setAttribute("scale", `${-150}`);
    dispB.setAttribute("scale", `${-150-vals.c4/10}`);

  }
  document.querySelectorAll("#controls input").forEach(e => e.oninput = updateSettings);