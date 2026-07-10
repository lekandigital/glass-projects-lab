function getDisplacementMap({ height, width, radius, depth }) {
    const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
    .mix { mix-blend-mode: screen; }
    </style>
    <defs>
    <linearGradient id="Y" x1="0" x2="0" y1="${Math.ceil((radius / height) * 20)}%" y2="${Math.floor(100 - (radius / height) * 20)}%">
    <stop offset="0%" stop-color="#00FF00" />
    <stop offset="50%" stop-color="#404040" />
    <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <linearGradient id="X" x1="${Math.ceil((radius / width) * 20)}%" x2="${Math.floor(100 - (radius / width) * 20)}%" y1="0" y2="0">
    <stop offset="0%" stop-color="#FF0000" />
    <stop offset="50%" stop-color="#404040" />
    <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <filter id="softBlur">
    <feGaussianBlur stdDeviation="3" />
    </filter>
    </defs>
    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <rect x="0" y="0" height="${height}" width="${width}" fill="#001040" />
    <rect x="0" y="0" height="${height}" width="${width}" fill="url(#Y)" class="mix" />
    <rect x="0" y="0" height="${height}" width="${width}" fill="url(#X)" class="mix" />
    <rect x="${depth}" y="${depth}" height="${height - 2 * depth}" width="${width - 2 * depth}" fill="#808080" rx="${radius}" ry="${radius}" filter="url(#softBlur)" />
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function getSpecularHighlight({ height, width, radius, intensity = 0.5 }) {
    const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
    <radialGradient id="rimLight" cx="50%" cy="20%">
    <stop offset="0%" stop-color="rgba(255, 255, 255, ${intensity * 1.2})" />
    <stop offset="40%" stop-color="rgba(255, 255, 255, ${intensity * 0.5})" />
    <stop offset="80%" stop-color="rgba(255, 255, 255, ${intensity * 0.1})" />
    <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
    </radialGradient>
    <filter id="softGlow">
    <feGaussianBlur stdDeviation="4" />
    </filter>
    </defs>
    <ellipse cx="${width/2}" cy="${height * 0.25}" rx="${width * 0.6}" ry="${height * 0.35}" fill="url(#rimLight)" filter="url(#softGlow)" />
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function getDisplacementFilter({ height, width, radius, depth, strength = 100, chromaticAberration = 0, specularIntensity = 0.5 }) {
    const displacementMapUrl = getDisplacementMap({ height, width, radius, depth });
    const specularUrl = getSpecularHighlight({ height, width, radius, intensity: specularIntensity });
    const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
    <filter id="displace" color-interpolation-filters="sRGB">
    <feImage x="0" y="0" height="${height}" width="${width}" href="${displacementMapUrl}" result="displacementMap" />
    
    <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blurredSource"/>
    
    <feDisplacementMap in="blurredSource" in2="displacementMap" scale="${strength * 1.8 + chromaticAberration * 2}" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
    
    <feDisplacementMap in="displaced" in2="displacementMap" scale="${strength + chromaticAberration * 1.5}" xChannelSelector="R" yChannelSelector="G" />
    <feColorMatrix type="matrix" values="1.05 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="displacedR" />
    
    <feDisplacementMap in="displaced" in2="displacementMap" scale="${strength * 1.2 + chromaticAberration * 0.8}" xChannelSelector="R" yChannelSelector="G" />
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 1.05 0 0 0 0 0 0 0 0 0 0 0 1 0" result="displacedG" />
    
    <feDisplacementMap in="displaced" in2="displacementMap" scale="${strength * 0.9}" xChannelSelector="R" yChannelSelector="G" />
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1.05 0 0 0 0 0 1 0" result="displacedB" />
    
    <feBlend in="displacedR" in2="displacedG" mode="screen"/>
    <feBlend in2="displacedB" mode="screen" result="refracted"/>
    
    <feImage x="0" y="0" height="${height}" width="${width}" href="${specularUrl}" result="specular" />
    <feBlend in="refracted" in2="specular" mode="screen" result="final"/>
    
    <feComponentTransfer in="final">
      <feFuncA type="linear" slope="1.1"/>
    </feComponentTransfer>
    </filter>
    </defs>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace";
}

window.DisplacementUtils = {
    getDisplacementMap,
    getDisplacementFilter,
    getSpecularHighlight
};

class GlassElement extends HTMLElement {
    constructor() {
        super();
        this.clicked = false;
        this.attachShadow({ mode: 'open' });
        if (GlassElement._svgFilterSupport === undefined) {
            GlassElement._svgFilterSupport = this.detectSVGFilterSupport();
        }
    }

    detectSVGFilterSupport() {
        const testElement = document.createElement('div');
        testElement.style.backdropFilter = 'blur(1px)';
        if (!testElement.style.backdropFilter) {
            return false;
        }
        const userAgent = navigator.userAgent.toLowerCase();
        const isChrome = /chrome|chromium|crios|edg/.test(userAgent) && !/firefox|fxios/.test(userAgent);
        return isChrome;
    }

    get hasSVGFilterSupport() {
        return GlassElement._svgFilterSupport;
    }

    static get observedAttributes() {
        return ['width', 'height', 'radius', 'depth', 'blur', 'strength', 'chromatic-aberration', 'background-color', 'specular-intensity', 'zoom'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback() {
        if (this.shadowRoot) {
            this.render();
        }
    }

    get width() { return parseInt(this.getAttribute('width')) || 200; }
    get height() { return parseInt(this.getAttribute('height')) || 200; }
    get radius() { return parseInt(this.getAttribute('radius')) || 50; }
    get baseDepth() { return parseInt(this.getAttribute('depth')) || 10; }
    get blur() { return parseInt(this.getAttribute('blur')) || 2; }
    get strength() { return parseInt(this.getAttribute('strength')) || 100; }
    get chromaticAberration() { return parseInt(this.getAttribute('chromatic-aberration')) || 0; }
    get backgroundColor() { return this.getAttribute('background-color') || 'rgba(255, 255, 255, 0.4)'; }
    get specularIntensity() { return parseFloat(this.getAttribute('specular-intensity')) || 0.5; }
    get zoom() { return parseFloat(this.getAttribute('zoom')) || 1.2; }
    get depth() { return this.baseDepth / (this.clicked ? 0.7 : 1); }

    setupEventListeners() {
        const glassBox = this.shadowRoot.querySelector('.glass-box');
        glassBox.addEventListener('mousedown', () => {
            this.clicked = true;
            this.updateStyles();
        });
        glassBox.addEventListener('mouseup', () => {
            this.clicked = false;
            this.updateStyles();
        });
        glassBox.addEventListener('mouseleave', () => {
            this.clicked = false;
            this.updateStyles();
        });
        document.addEventListener('mouseup', () => {
            if (this.clicked) {
                this.clicked = false;
                this.updateStyles();
            }
        });
    }

    updateStyles() {
        const glassBox = this.shadowRoot.querySelector('.glass-box');
        if (glassBox) {
            this.applyDynamicStyles(glassBox);
        }
    }

    applyDynamicStyles(element) {
        const { getDisplacementFilter } = window.DisplacementUtils;
        element.style.borderRadius = `${this.radius}px`;
        element.style.height = `${this.height}px`;
        element.style.width = `${this.width}px`;

        if (!this.hasSVGFilterSupport) {
            element.style.backdropFilter = `blur(${this.blur * 2}px)`;
            element.style.background = this.backgroundColor;
            element.style.boxShadow = '1px 1px 1px 0px rgba(255,255,255, 0.60) inset, -1px -1px 1px 0px rgba(255,255,255, 0.60) inset, 0px 0px 16px 0px rgba(0,0,0, 0.04), 0 1px 3px rgba(255, 255, 255, 0.4)';
            element.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        } else {
            const zoomPercent = (this.zoom - 1) * 100;
            element.style.backdropFilter = `blur(${this.blur / 2}px) url('${getDisplacementFilter({
                height: this.height,
                width: this.width,
                radius: this.radius,
                depth: this.depth,
                strength: this.strength,
                chromaticAberration: this.chromaticAberration,
                specularIntensity: this.specularIntensity
            })}') blur(${this.blur}px) brightness(${1.05 + this.zoom * 0.05}) saturate(${1.3 + this.zoom * 0.2}) contrast(1.1)`;
            element.style.background = `linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05))`;
            element.style.boxShadow = `
                inset 0 1px 2px rgba(255, 255, 255, 0.8),
                inset 0 -1px 2px rgba(255, 255, 255, 0.3),
                0 4px 16px rgba(0, 0, 0, 0.15),
                0 8px 32px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.15)
            `;
            element.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            element.style.setProperty('--zoom', this.zoom);
            element.style.setProperty('background-size', `${100 * this.zoom}%`);
            element.style.setProperty('background-position', 'center');
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
        :host {
        display: block;
        }
        .glass-box {
        background: rgba(255, 255, 255, 0.4);
        box-shadow: 1px 1px 1px 0px rgba(255,255,255, 0.60) inset,
        -1px -1px 1px 0px rgba(255,255,255, 0.60) inset,
        0px 0px 16px 0px rgba(0,0,0, 0.04);
        transition: transform 0.1s ease;
        position: relative;
        }
        .glass-box:active {
        transform: scale(0.95);
        }
        .content {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        text-align: center;
        font-family: sans-serif;
        }
        </style>
        <div class="glass-box">
        <div class="content">
        <slot></slot>
        </div>
        </div>
        `;
        const glassBox = this.shadowRoot.querySelector('.glass-box');
        this.applyDynamicStyles(glassBox);
    }
}

customElements.define('glass-element', GlassElement);

const button = document.getElementById('draggableButton');
let isDragging = false;
let currentX = 0;
let currentY = 0;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Variables para el efecto líquido/gelatinoso
let velocityX = 0;
let velocityY = 0;
let lastX = 0;
let lastY = 0;
let lastTime = Date.now();
let animationId = null;

// Variables para el efecto de oscilación (wobble)
let wobbleX = 0;
let wobbleY = 0;
let wobbleVelX = 0;
let wobbleVelY = 0;

button.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);
button.addEventListener('touchstart', dragStart);
document.addEventListener('touchmove', drag);
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
    if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }
    if (e.target === button || button.contains(e.target)) {
        isDragging = true;
        // Cancelar animación previa
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        // Resetear wobble
        wobbleX = 0;
        wobbleY = 0;
        wobbleVelX = 0;
        wobbleVelY = 0;
        lastTime = Date.now();
        lastX = currentX;
        lastY = currentY;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        currentX = clientX - initialX;
        currentY = clientY - initialY;
        
        // Calcular velocidad para el efecto líquido
        const now = Date.now();
        const dt = Math.max(1, now - lastTime);
        velocityX = (currentX - lastX) / dt * 16;
        velocityY = (currentY - lastY) / dt * 16;
        
        lastX = currentX;
        lastY = currentY;
        lastTime = now;
        
        xOffset = currentX;
        yOffset = currentY;
        
        // Aplicar efecto de estiramiento durante el arrastre (MÁS NOTORIO)
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const stretchFactor = Math.min(speed * 0.04, 0.35);
        const angle = Math.atan2(velocityY, velocityX);
        
        const scaleX = 1 + stretchFactor * Math.abs(Math.cos(angle));
        const scaleY = 1 + stretchFactor * Math.abs(Math.sin(angle));
        const skewX = velocityX * 0.008;
        const skewY = velocityY * 0.008;
        
        setTranslate(currentX, currentY, button, scaleX, scaleY, skewX, skewY);
    }
}

function dragEnd(e) {
    if (isDragging) {
        isDragging = false;
        initialX = currentX;
        initialY = currentY;
        
        // Iniciar animación de rebote gelatinoso (MÁS NOTORIO)
        wobbleVelX = velocityX * 0.8;
        wobbleVelY = velocityY * 0.8;
        animateWobble();
    }
}

function animateWobble() {
    // Física de resorte para efecto gelatinoso (MÁS NOTORIO)
    const springStrength = 0.12;
    const damping = 0.82;
    const minVelocity = 0.01;
    
    // Fuerzas de restitución
    const forceX = -wobbleX * springStrength;
    const forceY = -wobbleY * springStrength;
    
    // Actualizar velocidades
    wobbleVelX += forceX;
    wobbleVelY += forceY;
    wobbleVelX *= damping;
    wobbleVelY *= damping;
    
    // Actualizar posiciones
    wobbleX += wobbleVelX;
    wobbleY += wobbleVelY;
    
    // Calcular deformación basada en el movimiento (MÁS NOTORIO)
    const wobbleSpeed = Math.sqrt(wobbleVelX * wobbleVelX + wobbleVelY * wobbleVelY);
    const deformAmount = Math.min(wobbleSpeed * 0.05, 0.4);
    const wobbleAngle = Math.atan2(wobbleVelY, wobbleVelX);
    
    const scaleX = 1 + deformAmount * Math.abs(Math.cos(wobbleAngle)) - Math.abs(wobbleX) * 0.008;
    const scaleY = 1 + deformAmount * Math.abs(Math.sin(wobbleAngle)) - Math.abs(wobbleY) * 0.008;
    const skewX = wobbleX * 0.01;
    const skewY = wobbleY * 0.01;
    const rotate = (wobbleX * wobbleVelY - wobbleY * wobbleVelX) * 0.002;
    
    setTranslate(currentX + wobbleX, currentY + wobbleY, button, scaleX, scaleY, skewX, skewY, rotate);
    
    // Continuar animación si hay movimiento significativo
    if (Math.abs(wobbleVelX) > minVelocity || Math.abs(wobbleVelY) > minVelocity || 
        Math.abs(wobbleX) > 0.1 || Math.abs(wobbleY) > 0.1) {
        animationId = requestAnimationFrame(animateWobble);
    } else {
        // Volver suavemente a la forma original
        wobbleX = 0;
        wobbleY = 0;
        setTranslate(currentX, currentY, button, 1, 1, 0, 0, 0);
        animationId = null;
    }
}

function setTranslate(xPos, yPos, el, scaleX = 1, scaleY = 1, skewX = 0, skewY = 0, rotate = 0) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) 
                          scale(${scaleX}, ${scaleY}) 
                          skew(${skewX}deg, ${skewY}deg) 
                          rotate(${rotate}deg)`;
}