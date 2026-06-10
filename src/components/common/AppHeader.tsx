export function AppHeader() {
  return (
    <header role="banner" style={{ marginBottom: '1.5rem' }}>
      <h1
        style={{
          fontSize: '2.4rem',
          letterSpacing: '-0.05em',
          fontFamily: '"NimbusSansL", Arial, sans-serif',
          fontWeight: 200,
          color: 'var(--color-text-primary)',
          margin: 0,
          lineHeight: 1,
        }}
      >
        OP<span style={{ margin: '0 0.1em' }}>–</span>XY MTP Manager
      </h1>
      <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
        Device librarian + preset editor. Based on OP-PatchStudio (MIT).
      </p>
    </header>
  );
}
