export interface ObjectDetailHeadProps {
  title: string;
  meta?: string;
  position?: string;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  actions?: React.ReactNode;
}

export function ObjectDetailHead({
  title,
  meta,
  position,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  actions,
}: ObjectDetailHeadProps) {
  const showNav = onPrev != null || onNext != null || position != null;

  return (
    <header className="detail-head detail-head-compact">
      <h2>{title}</h2>
      {meta && <div className="detail-sub">{meta}</div>}
      {showNav && (
        <div className="detail-nav">
          {onPrev && (
            <button type="button" aria-label="previous" disabled={prevDisabled} onClick={onPrev}>
              ◀
            </button>
          )}
          {position && <span className="pos">{position}</span>}
          {onNext && (
            <button type="button" aria-label="next" disabled={nextDisabled} onClick={onNext}>
              ▶
            </button>
          )}
        </div>
      )}
      {actions && <div className="detail-actions">{actions}</div>}
    </header>
  );
}
