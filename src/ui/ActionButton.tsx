import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
  size?: 'md' | 'sm';
}

/** Square icon + lowercase label — shared hardware-key pattern (data tab standard). */
export function ActionButton({
  label,
  disabled,
  active,
  onClick,
  children,
  ariaLabel,
  size = 'md',
  ...rest
}: ActionButtonProps) {
  const sizeClass = size === 'sm' ? ' icon-btn--sm' : '';
  return (
    <button
      type="button"
      className={`icon-btn data-btn${sizeClass}${active ? ' active' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      {...rest}
    >
      {children}
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M14 8l-4 4 4 4" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M10 8l4 4-4 4" />
    </svg>
  );
}

export function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 12a8 8 0 0 1 13.5-5.7" />
      <path d="M20 7V3h-4" />
      <path d="M20 12a8 8 0 0 1-13.5 5.7" />
      <path d="M4 17v4h4" />
    </svg>
  );
}

export function FolderAddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 8h5l2 2h9v10H4V8z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  );
}

export function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 7V5h2M18 5h2v2M20 17v2h-2M6 19H4v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}

export function CopyToSetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="8" y="8" width="11" height="11" />
      <path d="M5 16V6h10" />
      <path d="M12 14l2-2 3 3" />
    </svg>
  );
}

export function StageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 5v10" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M9 7l8 5-8 5V7z" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 8h8v8H8z" />
    </svg>
  );
}

export function RenameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M14 6l4 4" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5 6.8 15M17.2 9l2.6-1.5" />
      <path d="M7.5 4.2 9 6.8M15 17.2l1.5 2.6M16.5 4.2 15 6.8M9 17.2l-1.5 2.6" />
    </svg>
  );
}
