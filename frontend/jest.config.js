const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'node', // backend services testing environment
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};

module.exports = createJestConfig(customJestConfig);
