import { useCallback, useMemo, useState } from 'react';
import type { ProjectListEntry } from '../types/opxy';
import { MOCK_PROJECT_ARRANGEMENTS, MOCK_PROJECT_LIST } from '../data/mockProjects';
import type { ProjectListItem } from '../types/sync';
import { useAppShell } from '../navigation/AppShellContext';
import { useNavigation } from '../navigation/useNavigation';

export type ProjectLibrary = ReturnType<typeof useProjectLibrary>;

function sceneCountForProject(name: string, entry?: ProjectListEntry): number {
  const mock = MOCK_PROJECT_ARRANGEMENTS[name];
  if (mock) return mock.sceneCount;
  if (entry) return Math.max(1, Math.min(99, Math.ceil(entry.referencedSamples.length / 4) || 1));
  return 1;
}

export function useProjectLibrary(cacheProjects: ProjectListEntry[]) {
  const { state } = useAppShell();
  const { goToProjects } = useNavigation();
  const [search, setSearch] = useState('');

  const items: ProjectListItem[] = useMemo(() => {
    const source =
      cacheProjects.length > 0
        ? cacheProjects.map((project) => ({
            id: project.name,
            name: project.name,
            relativePath: project.relativePath,
            sceneCount: sceneCountForProject(project.name, project),
          }))
        : MOCK_PROJECT_LIST.map(({ id, name, relativePath, sceneCount }) => ({
            id,
            name,
            relativePath,
            sceneCount,
          }));

    const query = search.trim().toLowerCase();
    if (!query) return source;
    return source.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.relativePath.toLowerCase().includes(query),
    );
  }, [cacheProjects, search]);

  const selectedId = state.projectFilename;

  const selectProject = useCallback(
    (name: string) => {
      goToProjects(name);
    },
    [goToProjects],
  );

  return {
    items,
    search,
    setSearch,
    selectedId,
    selectProject,
    usingMockList: cacheProjects.length === 0,
  };
}
