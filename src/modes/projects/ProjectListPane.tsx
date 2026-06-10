import type { ProjectLibrary } from '../../hooks/useProjectLibrary';

interface ProjectListPaneProps {
  library: ProjectLibrary;
}

export function ProjectListPane({ library }: ProjectListPaneProps) {
  return (
    <div className="projects-list-pane">
      <input
        type="text"
        className="search"
        placeholder="search projects"
        value={library.search}
        onChange={(event) => library.setSearch(event.target.value)}
      />
      <div className="projects-list-scroll">
        {library.items.map((item, index) => {
          const selected = library.selectedId === item.name;
          return (
            <button
              key={item.id}
              type="button"
              className={`row object-row${selected ? ' selected' : ''}`}
              onClick={() => library.selectProject(item.name)}
            >
              <span className="idx">{String(index + 1).padStart(2, '0')}</span>
              <span className="name">{item.name}</span>
              <span className="meta">{item.sceneCount} sc</span>
            </button>
          );
        })}
        {library.items.length === 0 ? (
          <p className="mono" style={{ padding: '12px 16px', opacity: 0.45 }}>
            no projects match
          </p>
        ) : null}
      </div>
      {library.usingMockList ? (
        <p className="mono projects-mock-note">mock list · pull to load device projects</p>
      ) : null}
    </div>
  );
}
