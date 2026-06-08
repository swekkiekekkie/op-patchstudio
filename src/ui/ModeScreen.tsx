import type { ReactNode } from 'react';

interface ModeScreenProps {
  toolbar?: ReactNode;
  children: ReactNode;
}

export function ModeScreen({ toolbar, children }: ModeScreenProps) {
  return (
    <section className="mode-screen">
      {toolbar}
      <div className="mode-screen-body">{children}</div>
    </section>
  );
}
