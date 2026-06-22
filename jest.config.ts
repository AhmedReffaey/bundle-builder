import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          moduleResolution: 'node',
          esModuleInterop: true,
          jsx: 'react',
          isolatedModules: true,
        },
      },
    ],
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
};

export default config;
