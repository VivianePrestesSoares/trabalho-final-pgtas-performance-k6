// Helper para geração de email aleatório usando Faker
export function generateRandomEmail() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 10000);
  return `usuario${timestamp}${randomNum}@test.com`;
}
