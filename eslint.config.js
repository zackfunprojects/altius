import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'mobile']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // Data-fetching hooks use async functions in useEffect that set state on completion.
  // This is the standard React pattern for Supabase queries before React 19's use() API.
  {
    files: ['src/hooks/**/*.{js,jsx}', 'src/context/**/*.{js,jsx}', 'src/components/**/*.{js,jsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
