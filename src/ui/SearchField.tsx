export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder = 'search', className }: SearchFieldProps) {
  const inputClass = ['search-field', className].filter(Boolean).join(' ');

  return (
    <input
      type="search"
      className={inputClass}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      aria-label={placeholder}
    />
  );
}
