import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.serverless/',
      'eslint.config.js',
      'jest.config.js',
      '*.config.js',
      'coverage/',
    ],
  },
  
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      complexity: ['warn', 10],
      'max-len': [
        'warn',
        {
          code: 120,
          ignoreComments: true,
          ignoreTrailingComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
    },
  },
  
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.test.json',  
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'max-len': 'off',
    },
  },
];
