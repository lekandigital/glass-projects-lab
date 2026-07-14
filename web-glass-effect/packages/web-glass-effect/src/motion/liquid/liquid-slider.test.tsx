import { fireEvent, render, waitFor } from '@testing-library/react';
import { LiquidSlider } from './slider';

function createRect(left: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: 0,
    top: 0,
    left,
    bottom: height,
    right: left + width,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('LiquidSlider', () => {
  function getSliderParts(container: HTMLElement) {
    const pointerElements = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (el) => el.style.cursor === 'pointer',
    );
    const [track, thumb] = pointerElements;
    if (!track || !thumb) {
      throw new Error('Could not find slider track/thumb');
    }

    const fill = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (el) => el.style.backgroundColor === 'rgb(3, 119, 247)',
    );
    if (!fill) {
      throw new Error('Could not find slider fill');
    }

    return { track, thumb, fill };
  }

  it('updates fill width when controlled value changes', async () => {
    const onValueChange = jest.fn();

    const { container, rerender } = render(<LiquidSlider value={20} onValueChange={onValueChange} />);

    await waitFor(() => {
      expect(getSliderParts(container).fill).toBeInTheDocument();
    });

    expect(getSliderParts(container).fill).toHaveStyle({ width: '20%' });

    rerender(<LiquidSlider value={80} onValueChange={onValueChange} />);

    await waitFor(() => {
      expect(getSliderParts(container).fill).toHaveStyle({ width: '80%' });
    });
  });

  it('clamps and steps drag values before emitting onValueChange', async () => {
    const onValueChange = jest.fn();

    const { container } = render(
      <LiquidSlider min={0} max={100} step={10} defaultValue={50} onValueChange={onValueChange} />,
    );

    await waitFor(() => {
      expect(getSliderParts(container).track).toBeInTheDocument();
    });

    const { track, thumb } = getSliderParts(container);

    let thumbLeft = 200;

    Object.defineProperty(track, 'getBoundingClientRect', {
      configurable: true,
      value: () => createRect(0, 200, 30),
    });

    Object.defineProperty(thumb, 'getBoundingClientRect', {
      configurable: true,
      value: () => createRect(thumbLeft, 70, 40),
    });

    fireEvent.drag(thumb);
    expect(onValueChange).toHaveBeenLastCalledWith(100);

    thumbLeft = 49;
    fireEvent.drag(thumb);
    expect(onValueChange).toHaveBeenLastCalledWith(40);
  });
});
