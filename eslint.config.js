const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');
module.exports = [
  { ignores: ['node_modules/**', '.tools/**', 'lib/**', 'lib-commonjs/**', 'lib-dts/**', 'lib-esm/**', 'temp/**', 'dist/**', 'release/**', 'sharepoint/**'] },
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parserOptions: { tsconfigRootDir: __dirname, project: './tsconfig.json' } }
  }
];
