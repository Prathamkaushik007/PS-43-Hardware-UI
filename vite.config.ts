import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import os from 'os'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Store cache in OS temp directory to completely prevent Windows OneDrive EPERM file locking errors
  cacheDir: path.join(os.tmpdir(), 'ps-43-hardware-ui-vite-cache'),

})
