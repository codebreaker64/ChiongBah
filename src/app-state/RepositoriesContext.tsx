import type { Repositories } from '@/adapters/storage/repositories';
import { createContext, ReactNode, useContext } from 'react';

const RepositoriesContext = createContext<Repositories | null>(null);

export function RepositoriesProvider({ repos, children }: { repos: Repositories; children: ReactNode }) {
  return <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error('useRepositories must be used inside RepositoriesProvider');
  return repos;
}
