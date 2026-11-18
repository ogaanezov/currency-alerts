import { defineConfig } from 'vite';

// В разработке запросы /api уходят в Spring Boot на порт 8080.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
