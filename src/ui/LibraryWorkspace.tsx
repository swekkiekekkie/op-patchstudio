export interface LibraryWorkspaceProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  empty?: React.ReactNode;
  showDetail?: boolean;
}

export function LibraryWorkspace({ list, detail, empty, showDetail = false }: LibraryWorkspaceProps) {
  const workspaceClass = showDetail ? 'library-workspace library-workspace--split' : 'library-workspace';

  return (
    <div className={workspaceClass}>
      <div className="library-list-pane">{list}</div>
      {showDetail ? (
        <div className="library-detail-pane">{detail ?? empty}</div>
      ) : (
        empty && <div className="library-empty">{empty}</div>
      )}
    </div>
  );
}
