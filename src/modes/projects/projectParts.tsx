import { DataButton } from '../data/dataParts';

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

function RefsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 6h8M8 12h8M8 18h5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="8" y="8" width="10" height="10" />
      <path d="M6 16V6h10" />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M9 5h6v3H9z" />
      <path d="M8 8h8v11H8z" />
    </svg>
  );
}

function PresetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="8" width="14" height="10" />
      <path d="M8 8V6h8v2" />
    </svg>
  );
}

/** Placeholder toolbar — project actions left (near list picker), selection actions right. */
export function ArrangeToolbar() {
  return (
    <div className="arrange-toolbar">
      <div className="arrange-toolbar-left">
        {/* TODO: new project / folder — projects may live in directories; picker needs hierarchy */}
        <DataButton label="new" ariaLabel="new project">
          <PlusIcon />
        </DataButton>
        <DataButton label="refs" ariaLabel="sample references">
          <RefsIcon />
        </DataButton>
      </div>
      <div className="arrange-toolbar-right">
        <DataButton label="copy" ariaLabel="copy pattern">
          <CopyIcon />
        </DataButton>
        <DataButton label="paste" ariaLabel="paste pattern">
          <PasteIcon />
        </DataButton>
        <DataButton label="preset" ariaLabel="change preset">
          <PresetIcon />
        </DataButton>
      </div>
    </div>
  );
}
