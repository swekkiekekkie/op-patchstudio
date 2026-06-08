interface StatusStripProps {
  connected: boolean;
  meta?: string;
}

export function StatusStrip({ connected, meta }: StatusStripProps) {
  return (
    <header className="status-strip">
      <h1>op–xy mtp</h1>
      <div className="status-strip-right">
        <span className="conn-badge">
          <span className={`dot${connected ? '' : ' off'}`} />
          {connected ? 'connected' : 'offline'}
        </span>
        {meta ? <span className="meta">{meta}</span> : null}
      </div>
    </header>
  );
}
