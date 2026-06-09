import {
  ActionButton,
  ClearIcon,
  CopyToSetIcon,
  FolderAddIcon,
  RefreshIcon,
  RenameIcon,
  ScanIcon,
  StageIcon,
} from '../../ui/ActionButton';

interface SetSamplesToolbarProps {
  busy: boolean;
  unnamedCount: number;
  onRefresh: () => void;
}

export function SetSamplesToolbar({ busy, unnamedCount, onRefresh }: SetSamplesToolbarProps) {
  return (
    <div className="samples-toolbar">
      <div className="samples-toolbar-left">
        <ActionButton label="refresh" disabled={busy} onClick={onRefresh}>
          <RefreshIcon />
        </ActionButton>
      </div>
      <div className="samples-toolbar-right">
        <ActionButton label="rename" ariaLabel="rename queue" disabled={unnamedCount === 0}>
          <RenameIcon />
        </ActionButton>
      </div>
    </div>
  );
}

interface SourceSamplesToolbarProps {
  busy: boolean;
  sourceFolderCount: number;
  stagedCount: number;
  stageableCount: number;
  onAddFolder: () => void;
  onScan: () => void;
  onStageVisible?: () => void;
  onClearStaged: () => void;
  onCopyToSet?: () => void;
}

export function SourceSamplesToolbar({
  busy,
  sourceFolderCount,
  stagedCount,
  stageableCount,
  onAddFolder,
  onScan,
  onStageVisible,
  onClearStaged,
  onCopyToSet,
}: SourceSamplesToolbarProps) {
  return (
    <div className="samples-toolbar">
      <div className="samples-toolbar-left">
        <ActionButton label="add" ariaLabel="add source folder" disabled={busy} onClick={onAddFolder}>
          <FolderAddIcon />
        </ActionButton>
        <ActionButton
          label="scan"
          disabled={busy || sourceFolderCount === 0}
          onClick={onScan}
        >
          <ScanIcon />
        </ActionButton>
      </div>
      <div className="samples-toolbar-right">
        <ActionButton
          label="stage"
          ariaLabel="stage visible samples"
          disabled={busy || stageableCount === 0 || !onStageVisible}
          onClick={onStageVisible}
        >
          <StageIcon />
        </ActionButton>
        <ActionButton
          label="clear"
          disabled={busy || stagedCount === 0}
          onClick={onClearStaged}
        >
          <ClearIcon />
        </ActionButton>
        <ActionButton
          label="copy"
          ariaLabel="copy staged to set"
          disabled={busy || stagedCount === 0 || !onCopyToSet}
          onClick={onCopyToSet}
        >
          <CopyToSetIcon />
        </ActionButton>
      </div>
    </div>
  );
}
