import { useMemo, useState } from 'react';
import { Button, Search, Tag, Tile, Toggle } from '@carbon/react';
import type { ProjectListEntry } from '../../types/opxy';

interface ProjectsBrowserProps {
  projects: ProjectListEntry[];
  indexedSampleCount: number;
}

export function ProjectsBrowser({ projects, indexedSampleCount }: ProjectsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [withSamplesOnly, setWithSamplesOnly] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = projects;
    if (withSamplesOnly) list = list.filter((p) => p.referencedSamples.length > 0);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.relativePath.toLowerCase().includes(q) ||
          p.referencedSamples.some((s) => s.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [projects, searchQuery, withSamplesOnly]);

  const totalSamples = useMemo(
    () => projects.reduce((sum, p) => sum + p.referencedSamples.length, 0),
    [projects],
  );

  if (projects.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        No project files in cache. Pull from device to copy the <code>projects/</code> folder — used for rename
        safety checks when sample filenames change.
      </p>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>
        {projects.length} project file{projects.length === 1 ? '' : 's'} · {indexedSampleCount} unique sample names
        indexed · {totalSamples} sample reference{totalSamples === 1 ? '' : 's'} detected. Renaming samples warns when
        a project still references the old filename (project binaries are not auto-patched yet).
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px', maxWidth: 320 }}>
          <Search
            id="project-search"
            labelText="search projects"
            size="sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Toggle
          id="project-with-samples"
          labelText="with sample refs only"
          toggled={withSamplesOnly}
          onToggle={setWithSamplesOnly}
          size="sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No projects match filters.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {filtered.slice(0, 100).map((project) => {
            const isOpen = expandedPath === project.relativePath;
            return (
              <Tile key={project.relativePath} style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{project.name}</strong>
                    {project.referencedSamples.length > 0 ? (
                      <Tag type="blue" style={{ marginLeft: '0.5rem' }}>
                        {project.referencedSamples.length} sample{project.referencedSamples.length === 1 ? '' : 's'}
                      </Tag>
                    ) : (
                      <Tag type="gray" style={{ marginLeft: '0.5rem' }}>
                        no indexed refs
                      </Tag>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      {project.relativePath}
                    </div>
                  </div>
                  <Button kind="ghost" size="sm" onClick={() => setExpandedPath(isOpen ? null : project.relativePath)}>
                    {isOpen ? 'hide samples' : 'show samples'}
                  </Button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {project.referencedSamples.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        No sample filenames detected in this project file.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {project.referencedSamples.map((sample) => (
                          <Tag key={sample} type="outline" size="sm">
                            {sample}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Tile>
            );
          })}
          {filtered.length > 100 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Showing first 100 of {filtered.length} projects — narrow search to see more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
