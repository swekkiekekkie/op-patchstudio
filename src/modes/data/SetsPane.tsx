import { useEffect, useRef, useState } from 'react';
import type { SetLibrary } from '../../hooks/useSetLibrary';
import type { SyncCockpit } from '../../hooks/useSyncCockpit';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CommitIcon,
  DataButton,
  HistoryIcon,
  InventoryPanel,
  ListIcon,
  NewSetIcon,
  PushIcon,
  PullIcon,
  SaveAsIcon,
} from './dataParts';

function NewSetSlab({ library }: { library: SetLibrary }) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => library.createSet(name);

  return (
    <div className="new-set-slab slab">
      <h3>new set</h3>
      <input
        ref={inputRef}
        type="text"
        value={name}
        placeholder="set name"
        aria-label="new set name"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit();
          if (event.key === 'Escape') library.setNewSetOpen(false);
        }}
      />
      <p className="mono">starts empty · pull or copy to fill</p>
      <div className="slab-actions">
        <button type="button" onClick={() => library.setNewSetOpen(false)}>cancel</button>
        <button type="button" className="primary" disabled={!name.trim()} onClick={submit}>
          create
        </button>
      </div>
    </div>
  );
}

interface SetsPaneProps {
  sync: SyncCockpit;
  library: SetLibrary;
}

export function SetsPane({ library }: SetsPaneProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const update = () => setSlideWidth(node.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeSet = library.activeSet;

  return (
    <div className={`solid-block sets-pane${activeSet.lastPushedToDevice ? ' on-device' : ''}`}>
        <div className="solid-block__head pane-head">
          <span className="title">sets</span>
          <span className="set-pane-name">{activeSet.name}</span>
        </div>
        <div className="solid-block__body sets-body">
          {library.historyOpen ? (
            <div className="history-panel">
              <div className="history-panel-head">
                <span>history</span>
                <span className="mono">{activeSet.name}</span>
              </div>
              <ul className="history-list">
                {activeSet.commits.map((label, index) => (
                  <li key={`${label}-${index}`} className={index === activeSet.commits.length - 1 ? 'current' : undefined}>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="sets-carousel-wrap">
              <div className="sets-viewport" ref={viewportRef}>
                <div
                  className="sets-track"
                  style={{ transform: slideWidth ? `translateX(-${library.setIndex * slideWidth}px)` : undefined }}
                >
                  {library.sets.map((set, index) => (
                    <div
                      key={set.id}
                      className={`set-slide${index === library.setIndex ? ' active' : ''}`}
                      style={slideWidth ? { width: slideWidth } : undefined}
                    >
                      <div className="set-live-inner">
                        <InventoryPanel
                          label="set inventory"
                          stats={set.stats}
                          rows={[
                            ['state', set.lastPushedToDevice ? 'matches device marker' : 'local only'],
                            ['history', `${Math.max(0, set.commits.length - 1)} checkpoints`],
                            ['storage', 'local size optional'],
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="solid-block__foot sets-toolbar">
          <div className="sets-toolbar-left">
            <DataButton label="" ariaLabel="previous set" onClick={library.prevSet}>
              <ChevronLeftIcon />
            </DataButton>
            <div className="set-dots" aria-label="sets">
              {library.sets.map((set, index) => (
                <i key={set.id} className={index === library.setIndex ? 'on' : undefined} />
              ))}
            </div>
            <DataButton label="" ariaLabel="next set" onClick={library.nextSet}>
              <ChevronRightIcon />
            </DataButton>
            <div className="sets-picker-wrap">
              {library.pickerOpen ? (
                <div className="sets-picker">
                  {library.sets.map((set, index) => (
                    <button
                      key={set.id}
                      type="button"
                      className={index === library.setIndex ? 'active' : undefined}
                      onClick={() => library.selectSet(index)}
                    >
                      {set.name}
                    </button>
                  ))}
                </div>
              ) : null}
              <DataButton
                label="list"
                active={library.pickerOpen}
                onClick={() => library.setPickerOpen((open) => !open)}
              >
                <ListIcon />
              </DataButton>
            </div>
          </div>
          <div className="sets-toolbar-right">
            <div className="sets-picker-wrap">
              {library.newSetOpen ? <NewSetSlab library={library} /> : null}
              <DataButton
                label="new"
                active={library.newSetOpen}
                onClick={() => library.setNewSetOpen(!library.newSetOpen)}
              >
                <NewSetIcon />
              </DataButton>
            </div>
            <DataButton label="commit" onClick={library.commit}>
              <CommitIcon />
            </DataButton>
            <DataButton
              label="history"
              active={library.historyOpen}
              onClick={() => library.setHistoryOpen((open) => !open)}
            >
              <HistoryIcon />
            </DataButton>
            <DataButton label="save as" onClick={library.saveAs}>
              <SaveAsIcon />
            </DataButton>
          </div>
        </div>
      </div>
  );
}

interface TransferRowProps {
  sync: SyncCockpit;
  library: SetLibrary;
  onConfirmPush: () => void;
}

export function TransferRow({ sync, library, onConfirmPush }: TransferRowProps) {
  return (
    <div className="transfer-row">
      <DataButton label="pull" disabled={sync.busy || !sync.connected} onClick={() => void sync.pull()}>
        <PullIcon />
      </DataButton>
      <DataButton
        label="push"
        disabled={sync.busy || !sync.connected || !sync.cacheReady}
        onClick={() => library.setPushSlabOpen(true)}
      >
        <PushIcon />
      </DataButton>
      {library.pushSlabOpen ? (
        <div className="push-preflight slab">
          <h3>push</h3>
          <p>
            push <span className="mono">{library.activeSet.name}</span> to device?
          </p>
          {sync.dirtyCount > 0 ? (
            <p className="mono">{sync.dirtyCount} modified preset(s) will push.</p>
          ) : (
            <p className="mono">no local edits detected.</p>
          )}
          <div className="slab-actions">
            <button type="button" onClick={() => library.setPushSlabOpen(false)}>cancel</button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                library.setPushSlabOpen(false);
                onConfirmPush();
              }}
            >
              confirm
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
