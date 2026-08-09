export async function runWithSingleServerRetry(operation) {
  try {
    return await operation();
  } catch (error) {
    if (!(Number(error?.status) >= 500)) throw error;
    return operation();
  }
}
