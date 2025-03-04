type FetchFunction<T> = (generation: number) => Promise<T>;

export async function prefetchAllGenerations<T>(fetchFn: FetchFunction<T>) {
  const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  for (const gen of generations) {
    try {
      await fetchFn(gen);
    } catch (error) {
      console.error(`Failed to prefetch generation ${gen}:`, error);
    }
  }
}
