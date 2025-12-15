// Helper para obtenção da URL base através de variável de ambiente
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}
