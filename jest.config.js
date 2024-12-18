/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
  testPathIgnorePatterns: ['<rootDir>/__tests__/derived-field-name.ts']
};

module.exports = config
