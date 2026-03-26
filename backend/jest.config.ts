import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/index.ts',
    '!**/main.ts',
    '!**/*.module.ts',
    '!**/*.types.ts',
    '!**/*.entity.ts',
    '!**/data-source.ts',
    '!**/*.dto.ts',
    '!**/*.interface.ts',
    '!**/decorators/**',
    '!**/middleware/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
