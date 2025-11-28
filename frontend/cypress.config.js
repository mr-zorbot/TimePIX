import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    defaultCommandTimeout: 10000, // Espera até 10s por elementos (padrão é 4s)
    requestTimeout: 15000, // Espera até 15s por requisições API
    responseTimeout: 30000, // Espera até 30s pela resposta do servidor
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
