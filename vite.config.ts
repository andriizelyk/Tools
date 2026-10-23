import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base lets the build work under any GitHub Pages path (user.github.io/<repo>/).
  base: './',
  plugins: [react()],
});
