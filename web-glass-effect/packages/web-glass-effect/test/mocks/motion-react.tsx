import React from 'react';
import { MotionValue } from 'motion';

function isMotionValue(value: unknown): value is MotionValue<unknown> {
  return Boolean(value) && typeof (value as MotionValue<unknown>).get === 'function';
}

function interpolate(value: number, inputRange: number[], outputRange: number[]): number {
  if (inputRange.length < 2 || outputRange.length < 2) {
    return outputRange[0] ?? value;
  }

  if (value <= inputRange[0]!) {
    return outputRange[0]!;
  }

  if (value >= inputRange[inputRange.length - 1]!) {
    return outputRange[outputRange.length - 1]!;
  }

  for (let i = 0; i < inputRange.length - 1; i += 1) {
    const start = inputRange[i]!;
    const end = inputRange[i + 1]!;
    if (value >= start && value <= end) {
      const ratio = (value - start) / (end - start);
      const outStart = outputRange[i]!;
      const outEnd = outputRange[i + 1]!;
      return outStart + ratio * (outEnd - outStart);
    }
  }

  return outputRange[0]!;
}

function resolveValue(value: unknown): unknown {
  if (isMotionValue(value)) {
    return value.get();
  }
  return value;
}

function resolveProps(props: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...props };
  const ignoredMotionProps = new Set(['drag', 'dragConstraints', 'dragElastic', 'dragMomentum']);

  const style = next.style;
  if (style && typeof style === 'object') {
    next.style = Object.fromEntries(
      Object.entries(style as Record<string, unknown>).map(([key, value]) => [key, resolveValue(value)]),
    );
  }

  for (const [key, value] of Object.entries(next)) {
    if (ignoredMotionProps.has(key)) {
      delete next[key];
      continue;
    }

    if (key !== 'style') {
      next[key] = resolveValue(value);
    }
  }

  return next;
}

function computeTransform(input: unknown, arg2?: unknown, arg3?: unknown): unknown {
  if (typeof input === 'function') {
    return input();
  }

  if (Array.isArray(input) && typeof arg2 === 'function') {
    const values = input.map((entry) => (isMotionValue(entry) ? entry.get() : entry));
    return arg2(values);
  }

  if (isMotionValue(input) && typeof arg2 === 'function') {
    return arg2(input.get());
  }

  if (isMotionValue(input) && Array.isArray(arg2) && Array.isArray(arg3)) {
    return interpolate(input.get() as number, arg2 as number[], arg3 as number[]);
  }

  return resolveValue(input);
}

export function useMotionValue<T>(initialValue: T): MotionValue<T> {
  const ref = React.useRef<MotionValue<T> | null>(null);
  if (!ref.current) {
    ref.current = new MotionValue<T>(initialValue);
  }
  return ref.current;
}

export function useSpring<T>(value: T | MotionValue<T>): MotionValue<T> {
  if (isMotionValue(value)) {
    return value as MotionValue<T>;
  }
  return useMotionValue(value as T);
}

export function useTransform(input: unknown, arg2?: unknown, arg3?: unknown): MotionValue<any> {
  const transformValue = useMotionValue(computeTransform(input, arg2, arg3));

  React.useEffect(() => {
    transformValue.set(computeTransform(input, arg2, arg3));
  });

  return transformValue;
}

export function mix(colorA: string, colorB: string) {
  return (ratio: number) => (ratio < 0.5 ? colorA : colorB);
}

export const motion = new Proxy(
  {},
  {
    get: (_target, tagName) => {
      const Component = React.forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
        const resolved = resolveProps(props);
        return React.createElement(tagName as string, { ...resolved, ref }, resolved.children as React.ReactNode);
      });
      Component.displayName = `motion.${String(tagName)}`;
      return Component;
    },
  },
) as Record<string, React.ComponentType<any>>;

export type HTMLMotionProps<T extends keyof React.JSX.IntrinsicElements> = React.JSX.IntrinsicElements[T];
export { MotionValue };
