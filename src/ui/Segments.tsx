export interface SegmentsProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Segments({ options, value, onChange, className }: SegmentsProps) {
  const rootClass = ['segments', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="tablist">
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'seg active' : 'seg'}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
