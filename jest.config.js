/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/__tests__/__mocks__/env-setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^next/server$': '<rootDir>/__tests__/__mocks__/next-server.ts',
    '^next/navigation$': '<rootDir>/__tests__/__mocks__/next-navigation.ts',
    '^@supabase/supabase-js$': '<rootDir>/__tests__/__mocks__/supabase.ts',
  },
  collectCoverageFrom: [
    'app/lib/auth.ts',
    'app/lib/client-config.ts',
  ],
};

module.exports = config;
