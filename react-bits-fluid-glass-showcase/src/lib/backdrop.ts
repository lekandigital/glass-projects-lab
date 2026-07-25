import * as THREE from 'three';

export const SHARED_PHOTO_URL = 'https://picsum.photos/id/1043/1200/900';
export const SHARED_VIDEO_URL = 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4';

/**
 * The backdrop the hand-built pipeline (sections 2 and 5) refracts. These make the
 * effect judgeable: high-frequency and achromatic by default, with shared photo/video
 * modes to match the web-glass showcase.
 */
export function makeBackdropTexture(kind: string, dark: boolean): THREE.Texture {
  if (kind === 'photo') {
    const t = new THREE.TextureLoader().load(SHARED_PHOTO_URL);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  if (kind === 'video') {
    const video = document.createElement('video');
    video.src = SHARED_VIDEO_URL;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    void video.play().catch(() => undefined);

    const t = new THREE.VideoTexture(video);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;

  const bg = dark ? '#1a1a1f' : '#e9e9ee';
  const fg = dark ? '#6e6e7e' : '#42424e';

  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);
  g.fillStyle = fg;
  g.strokeStyle = fg;

  if (kind === 'checker') {
    const n = 16;
    const s = S / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if ((x + y) % 2 === 0) g.fillRect(x * s, y * s, s, s);
      }
    }
  } else if (kind === 'grid') {
    g.lineWidth = 2;
    for (let i = 0; i <= 16; i++) {
      const p = (i * S) / 16;
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, S);
      g.moveTo(0, p);
      g.lineTo(S, p);
      g.stroke();
    }
  } else if (kind === 'noise') {
    const img = g.createImageData(S, S);
    const lo = dark ? 20 : 190;
    const hi = dark ? 130 : 255;
    for (let i = 0; i < img.data.length; i += 4) {
      const v = lo + Math.random() * (hi - lo);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  // 'flat' keeps the solid fill: a control with nothing to refract.

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
