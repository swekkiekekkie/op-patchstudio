import type { ProjectLibrary } from '../../hooks/useProjectLibrary';
import { useProjectArrange } from '../../hooks/useProjectArrange';
import type { CachePresetEntry } from '../../types/opxy';
import { ArrangePane } from './ArrangePane';
import { ProjectListPane } from './ProjectListPane';

interface ProjectsModeProps {
  library: ProjectLibrary;
  presets: CachePresetEntry[];
}

export function ProjectsMode({ library, presets }: ProjectsModeProps) {
  const arrange = useProjectArrange(library.selectedId, library.selectedProject);
  const showArrange = Boolean(library.selectedId && arrange.arrangement);

  return (
    <section className="screen screen-projects">
      <div className="projects-workspace">
        <ProjectListPane library={library} />
        {!showArrange ? <div className="projects-empty">select a project</div> : null}
        {showArrange ? <ArrangePane arrange={arrange} presets={presets} /> : null}
      </div>
    </section>
  );
}
