export interface LibraryWorkspaceProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  empty?: React.ReactNode;
  showDetail?: boolean;
  /** Hide list pane — detail takes full width (preset edit submode). */
  detailExpanded?: boolean;
}

export function LibraryWorkspace({
  list,
  detail,
  empty,
  showDetail = false,
  detailExpanded = false,
}: LibraryWorkspaceProps) {
  const workspaceClass = [
    'library-workspace',
    showDetail && !detailExpanded ? 'library-workspace--split' : '',
    detailExpanded ? 'library-workspace--detail-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={workspaceClass}>
      {!detailExpanded ? <div className="library-list-pane">{list}</div> : null}
      {showDetail ? (
        <div className="library-detail-pane">{detail ?? empty}</div>
      ) : (
        empty && <div className="library-empty">{empty}</div>
      )}
    </div>
  );
}
