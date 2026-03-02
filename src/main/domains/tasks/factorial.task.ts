/**
 * Пример задачи: вычисление факториала
 * Демонстрирует работу TaskBalancer
 */

interface FactorialInput {
  number: number;
}

interface FactorialOutput {
  result: number;
  duration: number;
}

/**
 * Вычислить факториал числа
 */
export async function execute(data: FactorialInput): Promise<FactorialOutput> {
  const startTime = Date.now();
  
  if (data.number < 0) {
    throw new Error('Number must be non-negative');
  }

  let result = 1;
  for (let i = 2; i <= data.number; i++) {
    result *= i;
  }

  const duration = Date.now() - startTime;

  return {
    result,
    duration
  };
}
