const {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} = React;

function cx(...values) {
  const classNames = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string') {
      classNames.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      classNames.push(cx(...value));
      continue;
    }
    if (typeof value === 'object') {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) classNames.push(key);
      }
    }
  }
  return classNames.join(' ');
}

function toDomId(value) {
  return String(value).replace(/[^A-Za-z0-9_-]/g, '_');
}

function LiquidGlassFilter({ id, distortionScale = 150 }) {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
      <filter id={id} x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.01 0.01"
          numOctaves={1}
          seed={5}
          result="turbulence"
        />

        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
          <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
          <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
        </feComponentTransfer>

        <feGaussianBlur in="turbulence" stdDeviation={3} result="softMap" />

        <feSpecularLighting
          in="softMap"
          surfaceScale={5}
          specularConstant={1}
          specularExponent={100}
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x={-200} y={-200} z={300} />
        </feSpecularLighting>

        <feComposite in="specLight" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="litImage" />

        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale={distortionScale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

const LiquidGlassSurface = forwardRef(function LiquidGlassSurface(
  {
    as,
    variant = 'surface',
    interactive = true,
    tint,
    blur,
    distortionScale,
    style,
    className,
    contentClassName,
    children,
    ...props
  },
  ref
) {
  const Component = as ?? 'div';
  const filterId = `lg_glass_${toDomId(useId())}`;

  const mergedStyle = { ...(style ?? {}) };
  if (tint) mergedStyle['--lg-tint'] = tint;
  if (blur) mergedStyle['--lg-blur'] = blur;

  return (
    <Component
      ref={ref}
      className={cx('lg', variant !== 'surface' && `lg--${variant}`, interactive && 'lg--interactive', className)}
      style={mergedStyle}
      {...props}
    >
      <LiquidGlassFilter id={filterId} distortionScale={distortionScale} />
      <div aria-hidden="true" className="lg__effect" style={{ filter: `url(#${filterId})` }} />
      <div aria-hidden="true" className="lg__tint" />
      <div aria-hidden="true" className="lg__shine" />
      <div className={cx('lg__content', contentClassName)}>{children}</div>
    </Component>
  );
});

const LiquidGlassButton = forwardRef(function LiquidGlassButton(
  {
    className,
    contentClassName,
    tint,
    blur,
    distortionScale,
    interactive,
    size = 'lg',
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <LiquidGlassSurface
      as="button"
      ref={ref}
      variant="button"
      tint={tint}
      blur={blur}
      distortionScale={distortionScale}
      interactive={interactive}
      className={cx(size === 'sm' && 'lgButton--sm', className)}
      contentClassName={contentClassName}
      type={type}
      {...props}
    />
  );
});

function LiquidGlassCard({ title, subtitle, footer, dataCardId, style, className, contentClassName, children }) {
  return (
    <LiquidGlassSurface
      as="article"
      variant="card"
      interactive={false}
      data-lg-card-id={dataCardId}
      style={style}
      className={className}
      contentClassName={cx('lgCard', contentClassName)}
    >
      {(title || subtitle) && (
        <header className="lgCard__header">
          {title && <div className="lgCard__title">{title}</div>}
          {subtitle && <div className="lgCard__subtitle">{subtitle}</div>}
        </header>
      )}
      {children && <div className="lgCard__body">{children}</div>}
      {footer && <footer className="lgCard__footer">{footer}</footer>}
    </LiquidGlassSurface>
  );
}

function LiquidGlassMenu({
  items,
  orientation = 'vertical',
  className,
  contentClassName,
  itemClassName,
  style,
  tint,
  blur,
  distortionScale,
  'aria-label': ariaLabel = 'Menu',
}) {
  return (
    <LiquidGlassSurface
      as="nav"
      variant="menu"
      className={className}
      contentClassName={cx('lgMenu', orientation === 'horizontal' && 'lgMenu--row', contentClassName)}
      aria-label={ariaLabel}
      interactive={false}
      style={style}
      tint={tint}
      blur={blur}
      distortionScale={distortionScale}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx('lgMenu__item', itemClassName)}
          onClick={item.onSelect}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </LiquidGlassSurface>
  );
}

function clampToPx(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function LiquidGlassSwitcherMenu({
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  optionClassName,
  style,
  tint,
  blur,
  width = 1100,
  height = 'auto',
  'aria-label': ariaLabel = 'Switcher',
}) {
  const isControlled = value !== undefined;
  const initialValue = useMemo(() => {
    if (defaultValue) return defaultValue;
    return options[0]?.id;
  }, [defaultValue, options]);

  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const selectedId = (isControlled ? value : uncontrolledValue) ?? options[0]?.id;

  const previousIndexRef = useRef(null);
  const containerRef = useRef(null);
  const toggleRef = useRef(null);
  const optionRefs = useRef(new Map());
  const pendingBumpRef = useRef(false);

  const selectedIndex = useMemo(() => {
    const index = options.findIndex((o) => o.id === selectedId);
    return index >= 0 ? index : 0;
  }, [options, selectedId]);

  const bump = useCallback(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;
    toggle.classList.remove('lgSwitcher__toggle--bump');
    toggle.offsetWidth;
    toggle.classList.add('lgSwitcher__toggle--bump');
  }, []);

  const updateToggle = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;

    const selected = options[selectedIndex];
    const selectedButton = selected ? optionRefs.current.get(selected.id) : null;
    if (!selectedButton) return;

    const rootRect = root.getBoundingClientRect();
    const btnRect = selectedButton.getBoundingClientRect();

    const paddingLeft = Number.parseFloat(window.getComputedStyle(root).paddingLeft);
    const x = clampToPx(btnRect.left - rootRect.left - (Number.isFinite(paddingLeft) ? paddingLeft : 0));
    const w = clampToPx(btnRect.width);

    root.style.setProperty('--lg-switcher-x', `${x}px`);
    root.style.setProperty('--lg-switcher-w', `${w}px`);

    const prev = previousIndexRef.current;
    const dir = prev === null ? 'none' : selectedIndex > prev ? 'right' : 'left';
    root.dataset.lgDir = dir;
  }, [options, selectedIndex]);

  useLayoutEffect(() => {
    updateToggle();
    if (pendingBumpRef.current) {
      bump();
      pendingBumpRef.current = false;
    }
  }, [bump, height, updateToggle, width]);

  useEffect(() => {
    const onResize = () => updateToggle();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateToggle]);

  const onSelect = (nextId) => {
    if (!nextId) return;
    const nextIndex = options.findIndex((o) => o.id === nextId);
    previousIndexRef.current = selectedIndex;

    if (!isControlled) setUncontrolledValue(nextId);
    onValueChange?.(nextId);

    if (containerRef.current) {
      containerRef.current.dataset.lgDir =
        nextIndex > selectedIndex ? 'right' : nextIndex < selectedIndex ? 'left' : 'none';
    }

    pendingBumpRef.current = true;
  };

  const mergedStyle = { ...(style ?? {}), width, height };
  if (tint) mergedStyle['--lg-tint'] = tint;
  if (blur) mergedStyle['--lg-blur'] = blur;

  return (
    <LiquidGlassSurface
      as="nav"
      variant="menu"
      interactive={false}
      aria-label={ariaLabel}
      className={cx('lgSwitcherSurface', className)}
      style={mergedStyle}
    >
      <div ref={containerRef} className="lgSwitcher" data-lg-dir="none">
        <div aria-hidden="true" ref={toggleRef} className="lgSwitcher__toggle" />
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              key={option.id}
              ref={(el) => {
                if (!el) {
                  optionRefs.current.delete(option.id);
                  return;
                }
                optionRefs.current.set(option.id, el);
              }}
              type="button"
              className={cx('lgSwitcher__option', isSelected && 'lgSwitcher__option--selected', optionClassName)}
              aria-pressed={isSelected}
              disabled={option.disabled}
              onClick={() => onSelect(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </LiquidGlassSurface>
  );
}

function getLineHeightPx(element) {
  const styles = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(styles.lineHeight);
  if (Number.isFinite(lineHeight)) return lineHeight;
  const fontSize = Number.parseFloat(styles.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.45 : 22;
}

function LiquidGlassExpandableBox({
  title,
  children,
  lines = 5,
  defaultExpanded = false,
  moreLabel = 'Read more',
  lessLabel = 'Show less',
  className,
  contentClassName,
  style,
  tint,
  blur,
}) {
  const controlsId = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [collapsedHeight, setCollapsedHeight] = useState(null);
  const [expandedHeight, setExpandedHeight] = useState(null);
  const textRef = useRef(null);

  const measure = () => {
    const el = textRef.current;
    if (!el) return;
    const lineHeight = getLineHeightPx(el);
    const nextCollapsed = Math.max(0, Math.round(lineHeight * Math.max(1, lines)));
    const nextExpanded = Math.max(nextCollapsed, el.scrollHeight);
    setCollapsedHeight(nextCollapsed);
    setExpandedHeight(nextExpanded);
  };

  useLayoutEffect(() => {
    measure();
  }, [lines]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isExpandable = useMemo(() => {
    if (!collapsedHeight || !expandedHeight) return false;
    return expandedHeight > collapsedHeight + 4;
  }, [collapsedHeight, expandedHeight]);

  const height = expanded ? expandedHeight ?? undefined : collapsedHeight ?? undefined;

  const mergedStyle = { ...(style ?? {}) };
  if (tint) mergedStyle['--lg-tint'] = tint;
  if (blur) mergedStyle['--lg-blur'] = blur;

  return (
    <LiquidGlassSurface
      as="section"
      variant="card"
      interactive={false}
      className={cx('lgExpand', className)}
      contentClassName={cx('lgExpand__content', contentClassName)}
      style={mergedStyle}
    >
      {title && <div className="lgExpand__title">{title}</div>}

      <div
        id={controlsId}
        ref={textRef}
        className={cx('lgExpand__text', isExpandable && !expanded && 'lgExpand__text--collapsed')}
        style={height ? { height } : undefined}
      >
        {children}
      </div>

      {isExpandable && (
        <button
          type="button"
          className="lgExpand__toggle"
          aria-controls={controlsId}
          aria-expanded={expanded}
          onClick={() => {
            setExpanded((prev) => !prev);
            queueMicrotask(() => measure());
          }}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </LiquidGlassSurface>
  );
}

function LiquidGlassPopupBox({
  title,
  children,
  previewLines = 5,
  openLabel = 'More',
  className,
  contentClassName,
  style,
  tint,
  blur,
}) {
  const previewRef = useRef(null);
  const modalRef = useRef(null);
  const [state, setState] = useState('closed');
  const [fromRect, setFromRect] = useState(null);

  const isOpen = state === 'opening' || state === 'open' || state === 'closing';

  const mergedStyle = useMemo(() => {
    const next = { ...(style ?? {}) };
    next['--lg-popup-lines'] = previewLines;
    if (tint) next['--lg-tint'] = tint;
    if (blur) next['--lg-blur'] = blur;
    return next;
  }, [blur, previewLines, style, tint]);

  const open = useCallback(() => {
    // Prevent aria-hidden focus warnings by blurring before hiding preview.
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFromRect(rect);
    setState('opening');
  }, []);

  const close = useCallback(() => {
    setState((prev) => (prev === 'closed' ? prev : 'closing'));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (state !== 'opening' || !fromRect) return;
    const modal = modalRef.current;
    if (!modal) return;

    const toRect = modal.getBoundingClientRect();
    const dx = clampToPx(fromRect.left - toRect.left);
    const dy = clampToPx(fromRect.top - toRect.top);
    const sx = toRect.width > 0 ? fromRect.width / toRect.width : 1;
    const sy = toRect.height > 0 ? fromRect.height / toRect.height : 1;

    modal.style.setProperty('--lg-popup-from-x', `${dx}px`);
    modal.style.setProperty('--lg-popup-from-y', `${dy}px`);
    modal.style.setProperty('--lg-popup-from-sx', `${sx}`);
    modal.style.setProperty('--lg-popup-from-sy', `${sy}`);

    requestAnimationFrame(() => setState('open'));
  }, [fromRect, state]);

  useEffect(() => {
    if (state !== 'closing') return;
    const id = window.setTimeout(() => {
      setState('closed');
      setFromRect(null);
    }, 420);
    return () => window.clearTimeout(id);
  }, [state]);

  return (
    <>
      <LiquidGlassSurface
        ref={previewRef}
        as="section"
        variant="card"
        interactive={false}
        className={cx('lgPopup', className)}
        contentClassName={cx('lgPopup__content', contentClassName)}
        style={mergedStyle}
        aria-hidden={isOpen}
        data-lg-hidden={isOpen ? 'true' : 'false'}
      >
        {title && <div className="lgPopup__title">{title}</div>}
        <div className="lgPopup__text">{children}</div>
        <button type="button" className="lgPopup__open" onClick={open}>
          {openLabel}
        </button>
      </LiquidGlassSurface>

      {isOpen &&
        ReactDOM.createPortal(
          <div
            className="lgPopupOverlay"
            data-lg-state={state}
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <LiquidGlassSurface
              ref={modalRef}
              as="section"
              variant="card"
              interactive={false}
              className="lgPopupModal"
              contentClassName="lgPopupModal__content"
              aria-modal="true"
              role="dialog"
            >
              <button type="button" className="lgPopupModal__close" aria-label="Close" onClick={close}>
                ×
              </button>
              {title && <div className="lgPopupModal__title">{title}</div>}
              <div className="lgPopupModal__body">{children}</div>
            </LiquidGlassSurface>
          </div>,
          document.body
        )}
    </>
  );
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function LiquidGlassDynamicCards({
  defaultCards,
  className,
  direction = 'top-to-bottom',
  addLabel = 'Add card',
  createCard,
  showControls = true,
  listContainerClassName,
  listClassName,
  autoScrollOnAdd = false,
}) {
  const instanceId = useId();
  const initialCards = useMemo(
    () =>
      defaultCards ?? [
        {
          id: `lg_card_${instanceId}_1`,
          title: 'Card 1',
          body: 'Click “Add card” to add more.',
        },
      ],
    [defaultCards, instanceId]
  );

  const [cards, setCards] = useState(initialCards);
  const [splitState, setSplitState] = useState(null);
  const listContainerRef = useRef(null);
  const pendingAutoScrollRef = useRef(null);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const id of timeouts) window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!splitState || splitState.phase !== 'active') return;
    const timeoutId = window.setTimeout(() => setSplitState(null), 580);
    timeoutsRef.current.push(timeoutId);
    return () => window.clearTimeout(timeoutId);
  }, [splitState]);

  useEffect(() => {
    if (!autoScrollOnAdd) return;
    const mode = pendingAutoScrollRef.current;
    if (!mode) return;
    const container = listContainerRef.current;
    if (!container) return;

    const isHorizontal = direction === 'left-to-right' || direction === 'right-to-left';

    if (mode === 'end') {
      container.scrollTo({
        top: isHorizontal ? 0 : container.scrollHeight,
        left: isHorizontal ? container.scrollWidth : 0,
        behavior: 'smooth',
      });
    } else {
      container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }

    pendingAutoScrollRef.current = null;
  }, [autoScrollOnAdd, cards.length, direction, splitState?.phase]);

  const addCard = () => {
    if (splitState) return;
    const nextIndex = cards.length + 1;
    const nextCard = (createCard && createCard(nextIndex)) || {
      id: createId(),
      title: `Card ${nextIndex}`,
      body: 'Liquid Glass card',
    };

    const insertAtStart = direction === 'bottom-to-top' || direction === 'right-to-left';
    setCards((prev) => (insertAtStart ? [nextCard, ...prev] : [...prev, nextCard]));

    const newId = nextCard.id;
    setSplitState({ newId, phase: 'prep' });

    if (autoScrollOnAdd) {
      pendingAutoScrollRef.current = insertAtStart ? 'start' : 'end';
    }

    requestAnimationFrame(() => {
      setSplitState((prev) => {
        if (!prev) return null;
        if (prev.newId !== newId) return prev;
        if (prev.phase === 'active') return prev;
        return { ...prev, phase: 'active' };
      });
    });
  };

  return (
    <section
      className={cx(
        'lgCards',
        direction.startsWith('left') || direction.startsWith('right') ? 'lgCards--row' : 'lgCards--col',
        direction === 'bottom-to-top' && 'lgCards--up',
        direction === 'top-to-bottom' && 'lgCards--down',
        direction === 'left-to-right' && 'lgCards--right',
        direction === 'right-to-left' && 'lgCards--left',
        className
      )}
      aria-label="Cards"
      data-lg-direction={direction}
    >
      {showControls && (
        <div className="lgCards__toolbar">
          <LiquidGlassButton
            size="sm"
            disabled={splitState !== null}
            onClick={addCard}
            style={{ '--lg-fg': 'white' }}
          >
            {addLabel}
          </LiquidGlassButton>
        </div>
      )}

      <div ref={listContainerRef} className={cx('lgCards__listContainer', listContainerClassName)}>
        <div className={cx('lgCards__list', listClassName)}>
          {cards.map((card) => {
            const isSplitNew = !!splitState && splitState.phase === 'active' && card.id === splitState.newId;
            const isSplitNewPrep = !!splitState && splitState.phase === 'prep' && card.id === splitState.newId;

            return (
              <LiquidGlassCard
                key={card.id}
                dataCardId={card.id}
                title={card.title}
                className={cx('lgCards__card', isSplitNew && 'lgCard--splitNew', isSplitNewPrep && 'lgCard--splitNewPrep')}
              >
                {card.body}
              </LiquidGlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiquidGlassStaticCards({ items, className, direction = 'left-to-right', listContainerClassName, listClassName }) {
  const isReversed = direction === 'right-to-left';
  const orderedItems = isReversed ? [...items].reverse() : items;

  return (
    <section
      className={cx(
        'lgCards',
        'lgCards--row',
        direction === 'left-to-right' && 'lgCards--right',
        direction === 'right-to-left' && 'lgCards--left',
        className
      )}
      aria-label="Cards"
      data-lg-direction={direction}
    >
      <div className={cx('lgCards__listContainer', listContainerClassName)}>
        <div className={cx('lgCards__list', listClassName)}>
          {orderedItems.map((card) => (
            <LiquidGlassCard key={card.id} dataCardId={card.id} title={card.title} className="lgCards__card">
              {card.body}
            </LiquidGlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function App() {
  const menuItems = [
    { id: 'home', label: 'Home', onSelect: () => console.log('Home') },
    { id: 'products', label: 'Products', onSelect: () => console.log('Products') },
    { id: 'about', label: 'About', onSelect: () => console.log('About') },
    { id: 'contact', label: 'Contact', onSelect: () => console.log('Contact') },
  ];

  const [selectedMenuId, setSelectedMenuId] = useState(menuItems[0]?.id ?? 'home');

  const staticCards = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const cardNumber = index + 1;
      return {
        id: `static_${cardNumber}`,
        title: `Static card ${cardNumber}`,
        body: 'Liquid Glass card',
      };
    });
  }, []);

  return (
    <>
      <div className="pageContainer">
        <div className="demo">
          <div className="demo__top">
            <div className="demo__stack">
            <div className="demo__section">
              <span className="demo__sectionTitle">Menu</span>
              <LiquidGlassMenu items={menuItems} orientation="horizontal" />
              <LiquidGlassSwitcherMenu
                width={1100}
                options={menuItems.map(({ id, label }) => ({ id, label }))}
                value={selectedMenuId}
                onValueChange={(nextId) => {
                  setSelectedMenuId(nextId);
                  menuItems.find((item) => item.id === nextId)?.onSelect?.();
                }}
                aria-label="Menu switcher"
              />
            </div>

            <div className="demo__section">
              <span className="demo__sectionTitle">Expandable Box</span>
              <LiquidGlassExpandableBox title="Read more" lines={5}>
                <p>
                  Liquid Glass is a layered effect: a blurred backdrop, a subtle tint, and specular highlights. This demo
                  keeps the surface reusable while letting you mix components like menus, switchers, and dynamic cards.
                </p>
                <p>
                  Click “Add card” in the lists below to see the split-style entrance animation. The switcher menu above
                  uses a moving selection pill inspired by the CodePen switcher animation.
                </p>
                <p>
                  This expandable box starts collapsed, showing only a few lines, and expands inline to reveal the full
                  content without leaving the page.
                </p>
              </LiquidGlassExpandableBox>
            </div>

            <div className="demo__section">
              <span className="demo__sectionTitle">Popup Box</span>
              <LiquidGlassPopupBox title="Long content" previewLines={5} openLabel="More">
                <p>
                  This box previews like a “read more” card, but opens into a full-screen overlay for longer content. The
                  open button sits at the bottom-right, and a close button fades in once the overlay finishes opening.
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil dolore reiciendis sunt neque, eaque
                  impedit sed placeat, omnis incidunt provident officia. Dicta odit soluta, vero optio molestiae porro
                  commodi minus.
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis beatae, incidunt, laudantium quae
                  sequi ab itaque impedit fugiat, deserunt iusto illo? Repudiandae, beatae. Sequi, similique.
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa voluptates at facilis quaerat illum,
                  recusandae nesciunt iste provident dolores, facere itaque amet. Suscipit rem totam, alias quidem nihil
                  incidunt.
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero deserunt corporis a ipsa natus quisquam
                  minus dolor enim, sint, repellendus beatae. Laboriosam illo dolorum optio.
                </p>
              </LiquidGlassPopupBox>
            </div>

            <div className="demo__section">
              <span className="demo__sectionTitle">Carousel</span>
              <LiquidGlassStaticCards direction="left-to-right" items={staticCards} listContainerClassName="demoListXContainer" />
            </div>
            </div>
          </div>

          <div className="demoLists">
            <span className="demo__sectionTitle">Dynamic Card Lists</span>
            <div className="demoLists__cols">
              <div className="demoLists__panel">
                <div className="demoLists__heading">Add to bottom</div>
                <LiquidGlassDynamicCards
                  listContainerClassName="demoListYContainer"
                  autoScrollOnAdd
                />
              </div>
              <div className="demoLists__panel">
                <div className="demoLists__heading">Add to top</div>
                <LiquidGlassDynamicCards
                  direction="bottom-to-top"
                  listContainerClassName="demoListYContainer"
                  autoScrollOnAdd
                />
              </div>
            </div>

            <div className="demoLists__rows">
              <div className="demoLists__panel demoLists__panel--wide">
                <div className="demoLists__heading">Add to right</div>
                <LiquidGlassDynamicCards
                  direction="left-to-right"
                  listContainerClassName="demoListXContainer"
                  autoScrollOnAdd
                />
              </div>
              <div className="demoLists__panel demoLists__panel--wide">
                <div className="demoLists__heading">Add to left</div>
                <LiquidGlassDynamicCards
                  direction="right-to-left"
                  listContainerClassName="demoListXContainer"
                  autoScrollOnAdd
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');

if (typeof ReactDOM.createRoot === 'function') {
  ReactDOM.createRoot(rootEl).render(<App />);
} else {
  ReactDOM.render(<App />, rootEl);
}
