import { render, screen, waitFor } from '@testing-library/react';
import { LiquidGlass } from './glass';

const originalUserAgent = window.navigator.userAgent;

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  });
}

afterEach(() => {
  setUserAgent(originalUserAgent);
});

describe('LiquidGlass', () => {
  it('renders the filter and applies backdrop-filter style when supported', async () => {
    setUserAgent('Mozilla/5.0 Chrome/125.0.0.0 Safari/537.36');

    const { container } = render(
      <LiquidGlass className="rounded-[26px] p-4" style={{ borderRadius: 26 }}>
        <span>Glass content</span>
      </LiquidGlass>,
    );

    await waitFor(() => {
      expect(container.querySelector('filter')).toBeInTheDocument();
    });

    const target = screen.getByText('Glass content').closest('div') as HTMLDivElement;
    expect(target.style.backdropFilter).toContain('url(#glass-');
  });

  it('falls back to blur mode on Safari/Firefox-style unsupported browsers', async () => {
    setUserAgent('Mozilla/5.0 Firefox/126.0');
    expect(window.navigator.userAgent).toContain('Firefox');

    const { container } = render(
      <LiquidGlass className="rounded-[26px] p-4" style={{ borderRadius: 26 }}>
        <span>Fallback content</span>
      </LiquidGlass>,
    );

    const target = (await screen.findByText('Fallback content')).closest('div') as HTMLDivElement;

    await waitFor(() => {
      expect(container.querySelector('filter')).toBeInTheDocument();
      expect(target.className).not.toContain('border');
    });
  });
});
