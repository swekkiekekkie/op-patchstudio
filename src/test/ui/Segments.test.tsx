// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Segments } from '../../ui/Segments';

describe('Segments', () => {
  const options = [
    { id: 'all', label: 'all' },
    { id: 'drum', label: 'drum' },
    { id: 'multi', label: 'multi' },
  ];
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all segment options', () => {
    render(<Segments options={options} value="all" onChange={onChange} />);

    expect(screen.getByRole('tab', { name: 'all' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'drum' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'multi' })).toBeInTheDocument();
  });

  it('applies active class to the selected segment', () => {
    render(<Segments options={options} value="drum" onChange={onChange} />);

    expect(screen.getByRole('tab', { name: 'drum' })).toHaveClass('seg', 'active');
    expect(screen.getByRole('tab', { name: 'all' })).toHaveClass('seg');
    expect(screen.getByRole('tab', { name: 'all' })).not.toHaveClass('active');
  });

  it('fires onChange when a segment is clicked', () => {
    render(<Segments options={options} value="all" onChange={onChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'multi' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('multi');
  });
});
