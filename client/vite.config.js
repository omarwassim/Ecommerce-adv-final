import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// React Compiler babel preset enabled — auto-memoization, so component code
// doesn't hand-roll useMemo/useCallback defensively.
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
