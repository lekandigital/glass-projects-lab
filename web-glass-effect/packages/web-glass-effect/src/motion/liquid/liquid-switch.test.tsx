import { fireEvent, render } from '@testing-library/react';
import { LiquidSwitch } from './switch';

describe('LiquidSwitch', () => {
  function getSwitchParts(container: HTMLElement) {
    const pointerElements = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (el) => el.style.cursor === 'pointer',
    );
    const [track, thumb] = pointerElements;
    if (!track || !thumb) {
      throw new Error('Could not find switch track/thumb');
    }
    return { track, thumb };
  }

  it('toggles on click gesture and calls onCheckedChange', async () => {
    const onCheckedChange = jest.fn();

    const { container } = render(<LiquidSwitch onCheckedChange={onCheckedChange} />);

    const { track, thumb } = getSwitchParts(container);

    fireEvent.mouseDown(thumb, { clientX: 100 });
    fireEvent.click(track, { clientX: 100 });

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles on drag release when crossing threshold', async () => {
    const onCheckedChange = jest.fn();

    const { container } = render(<LiquidSwitch onCheckedChange={onCheckedChange} />);

    const { track, thumb } = getSwitchParts(container);
    const root = track.parentElement as HTMLDivElement;

    fireEvent.mouseDown(thumb, { clientX: 0 });
    fireEvent.mouseMove(root, { clientX: 240 });
    fireEvent.mouseUp(window, { clientX: 240 });

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not emit changes when disabled', async () => {
    const onCheckedChange = jest.fn();

    const { container } = render(<LiquidSwitch disabled onCheckedChange={onCheckedChange} />);

    const { track, thumb } = getSwitchParts(container);

    fireEvent.mouseDown(thumb, { clientX: 100 });
    fireEvent.click(track, { clientX: 100 });
    fireEvent.mouseMove(track.parentElement as HTMLDivElement, { clientX: 220 });
    fireEvent.mouseUp(window, { clientX: 220 });

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
