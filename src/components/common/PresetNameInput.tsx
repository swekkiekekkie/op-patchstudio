import { useEffect, useState } from 'react';
import { TextInput } from '@carbon/react';
import { getInvalidPresetNameChars, isValidPresetName } from '../../utils/audio';

interface PresetNameInputProps {
  id: string;
  labelText: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  invalidText?: string;
}

export function PresetNameInput({
  id,
  labelText,
  value,
  onChange,
  placeholder = 'enter preset name',
  disabled = false,
  invalid = false,
  invalidText = '',
}: PresetNameInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (newValue && !isValidPresetName(newValue)) {
      setValidationError(`invalid characters: ${getInvalidPresetNameChars(newValue).join(', ')}`);
      return;
    }

    setValidationError('');
    if (isValidPresetName(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <TextInput
      id={id}
      labelText={labelText}
      value={localValue}
      onChange={handleInputChange}
      onKeyDown={(e) => {
        if (/[^a-zA-Z0-9 #\-().]/.test(e.key)) e.preventDefault();
      }}
      placeholder={placeholder}
      disabled={disabled}
      invalid={invalid || !!validationError}
      invalidText={validationError || invalidText}
    />
  );
}
