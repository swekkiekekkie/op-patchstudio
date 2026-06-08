import type { ProjectLibrary } from '../../hooks/useProjectLibrary';
import { useProjectArrange } from '../../hooks/useProjectArrange';
import { ArrangePane } from './ArrangePane';
import { ProjectListPane } from './ProjectListPane';

interface ProjectsModeProps {
  library: ProjectLibrary;
}

export function ProjectsMode({ library }: ProjectsModeProps) {
  const arrange = useProjectArrange(library.selectedId);
  const showArrange = Boolean(library.selectedId && arrange.arrangement);

  return (
    <section className="screen screen-projects">
      <div className="projects-workspace">
        <ProjectListPane library={library} />
        {!showArrange ? <div className="projects-empty">select a project</div> : null}
        {showArrange ? <ArrangePane arrange={arrange} /> : null}
      </div>
    </section>
  );
}
