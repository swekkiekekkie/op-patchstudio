import { Button } from '@carbon/react';
import { useAppContext } from '../../context/AppContext';

export function CacheSourceBanner() {
  const { state, dispatch } = useAppContext();
  const source = state.cacheSource;
  if (!source) return null;

  return (
    <div
      style={{
        margin: '0 2rem 1rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--color-border-medium)',
        background: 'var(--color-bg-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ fontSize: '0.9rem' }}>
        <strong>from device cache:</strong> {source.name}
        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
          ({source.category} · {source.type})
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          kind="ghost"
          size="sm"
          onClick={() => dispatch({ type: 'SET_TAB', payload: 'device' })}
        >
          back to device
        </Button>
        <Button
          kind="ghost"
          size="sm"
          onClick={() => dispatch({ type: 'SET_CACHE_SOURCE', payload: null })}
        >
          clear link
        </Button>
      </div>
    </div>
  );
}
