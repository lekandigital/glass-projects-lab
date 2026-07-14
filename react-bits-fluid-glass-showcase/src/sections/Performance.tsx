import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei';
import { easing } from 'maath';
import { Section } from '../components/ui';
import { INTERNALS } from '../lib/config';
import { makeBackdropTexture } from '../lib/backdrop';

/**
 * FluidGlass has no ref, no forwardRef and no useImperativeHandle — grep the source.
 * The only escape hatch is the one it uses on itself: mutate the Object3D inside
 * useFrame and never tell React. So the thing worth proving is what that buys you,
 * measured against the naive version that lifts the same value into state.
 */

type Driver = 'frame' | 'state';

function Lens({
  driver,
  onRender,
  tex
}: {
  driver: Driver;
  onRender: () => void;
  tex: THREE.Texture;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const { nodes } = useGLTF(INTERNALS.glb.lens) as unknown as { nodes: Record<string, THREE.Mesh> };
  const { viewport: vp } = useThree();
  const [pos, setPos] = useState<[number, number, number]>([0, 0, INTERNALS.meshZ]);

  // Every commit runs this: it is the render counter the metrics read.
  onRender();

  const scratch = useRef(new THREE.Vector3(0, 0, INTERNALS.meshZ));

  useFrame((state, delta) => {
    const { viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, INTERNALS.meshZ]);
    const dest: [number, number, number] = [
      (pointer.x * v.width) / 2,
      (pointer.y * v.height) / 2,
      INTERNALS.meshZ
    ];

    if (driver === 'frame') {
      // What FluidGlass does. Mutates the transform in place; React never hears about it.
      easing.damp3(mesh.current.position, dest, INTERNALS.pointerSmoothTime, delta);
    } else {
      // The naive alternative: same easing, but the result is round-tripped through state,
      // so every frame becomes a React render + reconcile + commit.
      easing.damp3(scratch.current, dest, INTERNALS.pointerSmoothTime, delta);
      setPos([scratch.current.x, scratch.current.y, scratch.current.z]);
    }
  });

  return (
    <>
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={tex} />
      </mesh>
      <mesh
        ref={mesh}
        position={driver === 'state' ? pos : undefined}
        scale={0.25}
        rotation-x={Math.PI / 2}
        geometry={nodes[INTERNALS.geometryKey.lens]?.geometry}
      >
        <MeshTransmissionMaterial ior={1.15} thickness={5} anisotropy={0.01} chromaticAberration={0.15} />
      </mesh>
    </>
  );
}

/**
 * The counters have to live below the canvas, not beside it: a `setStats` every 500ms in
 * the panel would re-render the Canvas subtree and inflate the very number the section
 * exists to report. Everything the readout touches is a ref; only Metrics has state.
 */
const Scene = memo(function Scene({
  driver,
  renders,
  frames,
  tex
}: {
  driver: Driver;
  renders: { current: number };
  frames: { current: number };
  tex: THREE.Texture;
}) {
  return (
    <Canvas camera={{ position: INTERNALS.camera.position, fov: INTERNALS.camera.fov }}>
      <FrameCounter onFrame={() => frames.current++} />
      <Lens driver={driver} onRender={() => renders.current++} tex={tex} />
    </Canvas>
  );
});

function Metrics({ driver, renders, frames }: { driver: Driver; renders: { current: number }; frames: { current: number } }) {
  const [stats, setStats] = useState({ rps: 0, fps: 0, total: 0 });

  useEffect(() => {
    let last = performance.now();
    let r0 = renders.current;
    let f0 = frames.current;
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      setStats({
        rps: Math.round((renders.current - r0) / dt),
        fps: Math.round((frames.current - f0) / dt),
        total: renders.current
      });
      last = now;
      r0 = renders.current;
      f0 = frames.current;
    }, 500);
    return () => clearInterval(id);
  }, [renders, frames]);

  return (
    <div className="metrics">
      <div className="metric">
        <div className="metric__k">React renders/s</div>
        <div className="metric__v" data-testid={`rps-${driver}`}>
          {stats.rps}
        </div>
        <div className="metric__sub">commits per second</div>
      </div>
      <div className="metric">
        <div className="metric__k">Frames/s</div>
        <div className="metric__v" data-testid={`fps-${driver}`}>
          {stats.fps}
        </div>
        <div className="metric__sub">draw calls per second</div>
      </div>
      <div className="metric">
        <div className="metric__k">Renders since mount</div>
        <div className="metric__v" data-testid={`total-${driver}`}>
          {stats.total}
        </div>
        <div className="metric__sub">cumulative</div>
      </div>
    </div>
  );
}

function Panel({
  driver,
  title,
  note,
  backdrop,
  dark
}: {
  driver: Driver;
  title: string;
  note: string;
  backdrop: string;
  dark: boolean;
}) {
  const renders = useRef(0);
  const frames = useRef(0);
  const tex = useMemo(() => makeBackdropTexture(backdrop, dark), [backdrop, dark]);

  return (
    <div className="card">
      <div className="stage bd bd--flat" style={{ height: 260, borderRadius: '16px 16px 0 0' }}>
        <span className="stage__tag">{driver === 'frame' ? 'useFrame → object3d.position' : 'useFrame → setState'}</span>
        <Scene driver={driver} renders={renders} frames={frames} tex={tex} />
      </div>
      <div className="gcard__body">
        <div className="gcard__title">
          <span>{title}</span>
        </div>
        <p className="gcard__note">{note}</p>
        <Metrics driver={driver} renders={renders} frames={frames} />
      </div>
    </div>
  );
}

function FrameCounter({ onFrame }: { onFrame: () => void }) {
  useFrame(() => onFrame());
  return null;
}

export default function Performance({ backdrop, dark }: { backdrop: string; dark: boolean }) {
  return (
    <Section
      id="s4"
      num={4}
      title="Imperative & performance"
      lede={
        <>
          FluidGlass exposes no ref, no <code>forwardRef</code>, no <code>useImperativeHandle</code> — there is nothing
          to grab from outside. What it does internally is the escape hatch worth understanding: it mutates the mesh's{' '}
          <code>Object3D</code> inside <code>useFrame</code> and never notifies React. Both panels run the identical{' '}
          <code>easing.damp3</code> at the identical <code>smoothTime</code>; only the write target differs. Move your
          pointer over each.
        </>
      }
    >
      <div className="two">
        <Panel
          driver="frame"
          title="Mutate in useFrame (what FluidGlass does)"
          note="The damped position is written straight onto the mesh. React commits once, at mount, and then never again — the counter stays flat no matter how fast you move."
          backdrop={backdrop}
          dark={dark}
        />
        <Panel
          driver="state"
          title="Round-trip through useState (the naive version)"
          note="Same maths, but the position is lifted into state, so every animated frame costs a render, a reconcile and a commit. The counter climbs at framerate and never stops while the lens is settling."
          backdrop={backdrop}
          dark={dark}
        />
      </div>

      <div className="note">
        <span>◆</span>
        <span>
          Both panels look identical, which is the point: the visual output is the same and the React cost is not. On a
          static page the difference is affordable; inside a real app, the state version re-renders every ancestor that
          isn't memoised, sixty times a second, for an animation React was never asked to see.
        </span>
      </div>
    </Section>
  );
}
