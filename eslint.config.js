import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '_debug/**',
      '*.js',
      '*.cjs',
      '*.mjs',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.cjs'
    ]
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // React specific
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'react/react-in-jsx-scope': 'off',
      
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
      
      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
];
