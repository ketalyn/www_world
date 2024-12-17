import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      allow: ['.'], // Allow access to all files in the project root
    },
  },
});
