const map = encodeURIComponent(document.querySelector("#lens-map").outerHTML);
document
    .querySelector("#map")
    .setAttribute("href", `data:image/svg+xml;charset=utf-8,${map}`);

const lens = document.querySelector("#lens");

document.body.addEventListener("mousemove", (evt) => {
    lens.style.setProperty("--x", `${evt.clientX}px`);
    lens.style.setProperty("--y", `${evt.clientY}px`);
});
