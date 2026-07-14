import type { Preview } from '@storybook/react';
import '../src/styles.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark gradient',
      values: [
        { name: 'dark gradient', value: 'linear-gradient(135deg, #101318 0%, #1f2730 100%)' },
        { name: 'light gradient', value: 'linear-gradient(135deg, #e3eaf3 0%, #f8fbff 100%)' },
      ],
    },
  },
};

export default preview;
