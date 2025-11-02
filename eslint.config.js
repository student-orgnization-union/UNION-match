import eslintConfigNext from 'eslint-config-next';

const config = [
  {
    ignores: ['node_modules', '.next', 'out'],
  },
  ...eslintConfigNext,
];

export default config;
