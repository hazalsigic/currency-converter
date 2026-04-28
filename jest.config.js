module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
  },
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/index.ts',
  ],
};