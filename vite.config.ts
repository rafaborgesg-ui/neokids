import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // --- Plugins ---
  // @vitejs/plugin-react-swc: Usa o compilador SWC da Vercel para um Hot Module Replacement (HMR) extremamente rápido.
  plugins: [react()],

  // --- Resolução de Módulos ---
  resolve: {
    // Define o alias de caminho `@` para apontar para a pasta `src`.
    // Isso permite importações mais limpas, como `import Component from '@/components/Component'`.
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // --- Configurações do Servidor de Desenvolvimento ---
  server: {
    port: 3000, // Define a porta para o servidor de desenvolvimento.
    open: true,   // Abre automaticamente o navegador ao iniciar o servidor.
  },

  // --- Configurações de Build para Produção ---
  build: {
    outDir: 'dist', // Define o diretório de saída para os arquivos de build. 'dist' é o padrão.
    sourcemap: true, // Gera source maps para facilitar a depuração em produção.
  },
});