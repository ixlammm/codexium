// Codexium UI kit — authentic Codex settings components extracted from the
// real rendered settings pages (misc/html-exports). Every component uses the
// app's exact classes so it matches the rest of Settings in light & dark mode.
import { Skt as codexiumReactFactory } from "./app-initial-CUcIZsiK.js";
import { iconSvg } from "./codexium-icons.js";

const React = codexiumReactFactory();
const h = React.createElement;
const { useState } = React;

export const cx = (...c) => c.filter(Boolean).join(" ");

/** Full clsx-style class combiner: accepts strings, arrays, and conditional
 * objects `{ "text-red": true }`. Useful when composing Tailwind classes. */
export function clxs(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string" || typeof arg === "number") {
      out.push(arg);
    } else if (Array.isArray(arg)) {
      const joined = clxs(...arg);
      if (joined) out.push(joined);
    } else if (typeof arg === "object") {
      for (const [key, value] of Object.entries(arg)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(" ");
}

// ---------------------------------------------------------------------------
// Page — matches the settings page content frame: right padding (p-panel), a
// max-width 3xl container, a page header with a divider, then sections.
// ---------------------------------------------------------------------------

/** Page shell: fills the content height, scrolls, standard padding + max width. */
export function Page({ title, description, actions, children, className }) {
  return (
    <div className={cx("h-full min-h-0 scrollbar-stable overflow-y-auto p-panel", className)}>
      <div className="mx-auto flex w-full flex-col max-w-3xl electron:min-w-[calc(320px*var(--codex-window-zoom))]">
        <div className="pb-8">
          <header className="flex flex-col gap-4 px-[var(--detail-page-inline-inset,0px)] border-b border-token-border pb-4">
            <div className="flex min-w-0 items-start justify-between gap-4 flex-wrap">
              <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1.5">
                {title && <h1 className="min-w-0 break-words text-token-foreground heading-lg font-normal" style={{ margin: 0 }}>{title}</h1>}
                {description && <p className="min-w-0 text-sm text-token-text-secondary" style={{ margin: 0 }}>{description}</p>}
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
          </header>
        </div>
        <div className="flex flex-col gap-10">{children}</div>
      </div>
    </div>
  );
}

/** A titled settings section composed of setting "cards" / rows. */
export function Section({ title, description, actions, children }) {
  const hasHeader = title || description || actions;
  return (
    <section className="flex flex-col">
      {hasHeader ? (
        <div className="flex justify-between gap-4 min-h-toolbar items-center pb-1.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {title && <div className="font-medium text-token-text-primary text-base">{title}</div>}
            {description && <div className="text-xs text-token-text-secondary">{description}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Card — the core settings "card": rounded, bordered, background panel, with
// automatic dividers between its rows (the [&>*]:after pattern).
// ---------------------------------------------------------------------------
const cardCls =
  "flex flex-col [&>*:not(:last-child)]:relative [&>*:not(:last-child)]:after:pointer-events-none [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:inset-x-4 [&>*:not(:last-child)]:after:bottom-0 [&>*:not(:last-child)]:after:h-[0.5px] [&>*:not(:last-child)]:after:bg-token-border [&>*:not(:last-child)]:after:content-[''] rounded-2xl overflow-hidden border border-token-border";

const cardStyle = { backgroundColor: "var(--color-background-panel, var(--color-token-bg-fog))" };

/** Card container. Wraps a header + rows; auto-dividers children. */
export function Card({ header, className, children, footer }) {
  return <div className={clxs(cardCls, className)} style={cardStyle}>{header}{children}{footer}</div>;
}

/** Card row: label + description on the left, control on the right. */
export function Row({ label, description, control, hint, icon, children }) {
  return (
    <div className="flex items-center justify-between px-4 gap-6 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && <div className="flex shrink-0 items-center">{icon}</div>}
        <div className="flex min-w-0 flex-col gap-0.5">
          {label ? <div className="min-w-0 text-token-text-primary text-sm font-medium">{label}</div> : null}
          {children}
          {description && <div className="min-w-0 text-xs leading-4 text-balance text-token-text-secondary">{description}</div>}
          {hint && <div className="min-w-0 text-xs leading-4 text-token-text-tertiary">{hint}</div>}
        </div>
      </div>
      {control && <div className="flex max-w-full shrink-0 items-center gap-2">{control}</div>}
    </div>
  );
}

/** A "no description" label row without description spacing. */
export function RowLabel({ children }) {
  return <div className="min-w-0 text-token-text-primary text-sm font-medium">{children}</div>;
}

/** Card header (optional): title/description at top of a card, with actions on the right. */
export function CardHeader({ title, description, actions }) {
  return (
    <div className="flex items-center justify-between px-4 gap-6 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          {title && <div className="min-w-0 text-token-text-primary text-sm font-medium">{title}</div>}
          {description && <div className="min-w-0 text-xs leading-4 text-balance text-token-text-secondary">{description}</div>}
        </div>
      </div>
      {actions && <div className="flex max-w-full shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons (extracted from real classes)
// ---------------------------------------------------------------------------
const btnBase =
  "no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-lg text-base leading-[18px] transition-colors";

const btnVariants = {
  ghost: "text-token-text-tertiary enabled:hover:bg-token-list-hover-background enabled:hover:text-token-foreground border-transparent",
  subtle: "text-token-foreground bg-token-bg-fog enabled:hover:bg-token-list-hover-background border border-token-border",
  outline: "border-token-border bg-token-bg-primary enabled:hover:bg-token-list-hover-background text-token-text-primary",
  primary: "border-token-border bg-token-foreground text-token-dropdown-background enabled:hover:bg-token-foreground/80",
  secondary: "text-token-foreground bg-token-foreground/5 enabled:hover:bg-token-foreground/10 data-[state=open]:bg-token-foreground/10 border-transparent",
  danger: "bg-token-charts-red/10 enabled:hover:bg-token-charts-red/20 text-token-charts-red border-transparent",
  dangerGhost: "text-token-charts-red enabled:hover:bg-token-list-hover-background border-transparent",
};

/** App-styled button.
 *
 * Matches the real settings buttons: fixed height via `h-token-button-composer`
 * (with `py-0`), horizontal padding `px-2`, and `gap-1` between an icon and the
 * label. The icon (leading `icon` or trailing `iconRight`) is rendered with the
 * app's `icon-2xs` scale so it aligns with the text baseline. */
export function Button({ variant = "ghost", size = "md", icon, iconRight, className, children, ...props }) {
  const sizes = {
    sm: "h-token-button-composer px-2 py-0 text-sm",
    md: "h-token-button-composer px-2 py-0 text-base",
    lg: "h-token-button-composer px-3 py-0 text-base",
  };
  return (
    <button type="button" {...props} className={cx(btnBase, btnVariants[variant], sizes[size] || sizes.md, className)}>
      {icon && <span className="flex shrink-0 items-center [&>svg]:icon-2xs">{icon}</span>}
      {children}
      {iconRight && <span className="flex shrink-0 items-center [&>svg]:icon-2xs">{iconRight}</span>}
    </button>
  );
}

/** Dropdown / select trigger (the button that opens a menu). */
export function SelectTrigger({ value, prefix, onChange, options, className, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "flex h-9 max-w-full items-center justify-between rounded-lg border border-token-border bg-token-bg-primary px-2.5 py-0 shadow-sm text-sm text-token-text-primary enabled:hover:bg-token-list-hover-background w-[11rem] max-sm:w-full outline-hidden",
        className
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">{children || value || "Select…"}</span>
      <svg width={20} height={21} viewBox="0 0 20 21" fill="none" className="icon-2xs shrink-0 text-token-input-placeholder-foreground icon-xs opacity-65">
        <path d="M15.2793 7.71101C15.539 7.45131 15.961 7.45131 16.2207 7.71101C16.4804 7.97071 16.4804 8.39272 16.2207 8.65242L10.4707 14.4024C10.211 14.6621 9.78902 14.6621 9.52932 14.4024L3.77932 8.65242L3.69436 8.54792C3.52385 8.28979 3.55205 7.93828 3.77932 7.71101C4.00659 7.48374 4.3581 7.45554 4.61623 7.62605L4.72073 7.71101L10 12.9903L15.2793 7.71101Z" fill="currentColor" stroke="currentColor" strokeWidth={0.6} />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inputs — exact classes from real settings pages
// ---------------------------------------------------------------------------
const inputCls =
  "w-full rounded-md border border-token-input-border bg-token-input-background px-2.5 py-1.5 text-base text-token-input-foreground outline-none placeholder:text-token-input-placeholder-foreground focus:border-token-focus-border";

/** Text input. */
export function Input({ className, ...props }) {
  return <input {...props} className={cx(inputCls, className)} />;
}

/** Small input (fits in a row, e.g. "14" px). */
export function SmallInput({ className, ...props }) {
  return <input {...props} className={cx("w-16 rounded-md", inputCls, className)} />;
}

/** Aligned row input. */
export function RowInput({ className, ...props }) {
  return <input {...props} className={cx("min-w-0 flex-1", inputCls, className)} />;
}

/** Labeled field (label + input), matching the real `<label class="flex flex-col gap-1.5 text-sm">`. */
export function LabeledField({ label, hint, htmlFor, children }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-token-description-foreground" htmlFor={htmlFor}>
      {label}
      {children}
      {hint && <span className="text-xs text-token-text-tertiary">{hint}</span>}
    </label>
  );
}

/** Textarea. */
export function Textarea({ className, ...props }) {
  return <textarea {...props} rows={props.rows || 3} className={cx("min-h-20 w-full resize-y", inputCls, className)} />;
}

// ---------------------------------------------------------------------------
// Toggle / switch — exact classes from real settings pages
// ---------------------------------------------------------------------------

/** Toggle switch. */
export function Toggle({ checked, onChange, label, disabled, "aria-label": ariaLabel }) {
  const state = checked ? "checked" : "unchecked";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={ariaLabel || label}
      disabled={disabled}
      onClick={() => { if (!disabled) onChange && onChange(!checked); }}
      className={cx(
        "inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-focus-border focus-visible:rounded-full",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-interaction"
      )}
      data-state={state}
    >
      <span
        className={cx("relative inline-flex shrink-0 items-center rounded-full transition-colors duration-basic ease-out h-5 w-8", checked ? "bg-token-charts-blue" : "bg-token-foreground/10")}
        data-state={state}
      >
        <span
          className="rounded-full border border-[color:var(--gray-0)] bg-[color:var(--gray-0)] shadow-sm transition-transform duration-basic ease-out data-[state=unchecked]:translate-x-0 h-4 w-4 data-[state=unchecked]:translate-x-[2px] data-[state=checked]:translate-x-[14px]"
          data-state={state}
        />
      </span>
    </button>
  );
}

/** Checkbox. */
export function Checkbox({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={cx(
        "flex size-4 items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-focus-border disabled:opacity-40 cursor-interaction",
        checked ? "bg-token-foreground border-token-foreground text-token-dropdown-background" : "border-token-border bg-transparent enabled:hover:border-token-border-heavy"
      )}
    >
      {checked && (
        <svg className="icon-2xs" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Segmented control (pill group) — exact classes from real settings pages
// ---------------------------------------------------------------------------

/** Pill button. */
export function SegButton({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-full px-2 py-0.5 text-sm leading-[18px] shrink-0 transition-colors",
        active
          ? "text-token-foreground bg-token-foreground/5 enabled:hover:bg-token-foreground/10 border-transparent"
          : "text-token-text-tertiary enabled:hover:bg-token-list-hover-background enabled:hover:text-token-foreground border-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}

/** Group of pill buttons. */
export function SegmentedGroup({ options, value, onChange, className }) {
  return (
    <div className={cx("inline-flex hide-scrollbar relative min-w-0 max-w-full items-center gap-0.5 overflow-x-auto overflow-y-hidden", className)} role="group">
      {(options || []).map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const lab = typeof opt === "string" ? opt : opt.label;
        return <SegButton key={val} active={val === value} onClick={() => onChange && onChange(val)}>{lab}</SegButton>;
      })}
    </div>
  );
}

/** Tab button styled like the "Manage extensions" tabs: rounded-lg (not pill),
 * composer height, with an optional trailing count badge. */
export function TabButton({ active, onClick, count, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={cx(
        "no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-lg h-token-button-composer px-2 py-0 text-base leading-[18px] shrink-0",
        active
          ? "text-token-foreground bg-token-foreground/5 enabled:hover:bg-token-foreground/10 data-[state=open]:bg-token-foreground/10 border-transparent"
          : "text-token-text-tertiary enabled:hover:bg-token-list-hover-background data-[state=open]:bg-token-list-hover-background border-transparent",
        className
      )}
    >
      {children}
      {count != null && <span className="ms-0.5 text-token-input-placeholder-foreground">{count}</span>}
    </button>
  );
}

/** Group of tab buttons (e.g. All / API Key / OAuth) with an overflow-safe
 * horizontal scroll, mirroring the plugins "Manage extensions" tabs. */
export function SegmentedTabs({ options, value, onChange, className }) {
  return (
    <div className={cx("inline-flex hide-scrollbar relative min-w-0 max-w-full items-center gap-0.5 overflow-x-auto overflow-y-hidden", className)} role="group" aria-label="Filter providers">
      {(options || []).map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const lab = typeof opt === "string" ? opt : opt.label;
        const count = typeof opt === "object" ? opt.count : null;
        return <TabButton key={val} active={val === value} count={count} onClick={() => onChange && onChange(val)}>{lab}</TabButton>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function Badge({ color = "default", className, children }) {
  const map = {
    default: "bg-token-foreground/10 text-token-text-secondary",
    blue: "bg-token-charts-blue/10 text-token-charts-blue",
    green: "bg-token-charts-green/10 text-token-charts-green",
    red: "bg-token-charts-red/10 text-token-charts-red",
    orange: "bg-token-charts-orange/10 text-token-charts-orange",
    error: "bg-token-error text-token-button-foreground",
    outline: "border border-token-border text-token-text-secondary",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[color] || map.default, className)}>{children}</span>;
}

export function Divider({ className }) {
  return <div className={cx("h-px w-full bg-token-border-light my-2", className)} />;
}

export function EmptyState({ title, description, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-token-border bg-token-main-surface-primary px-6 py-10 text-center">
      {title && <div className="text-sm font-medium text-token-text-primary">{title}</div>}
      {description && <div className="max-w-sm text-sm text-token-text-secondary">{description}</div>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

/** Minimal centered empty state (matches the real "No plugins found" stub). */
export function SimpleEmptyState({ children }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center py-8">
      <div className="text-sm text-token-text-secondary">{children}</div>
    </div>
  );
}

const alertVariants = {
  // Matches the real Codex warning aside (tone/settings personality banner).
  warning: {
    bar: "border-token-editor-warning-foreground/30",
    overlay: "bg-token-input-validation-warning-background/30",
    icon: "text-token-editor-warning-foreground",
    iconPath: "M9.995 12.315c.489 0 .875.37.875.842 0 .473-.386.843-.875.843-.488 0-.875-.37-.875-.843 0-.472.387-.842.875-.842ZM10.001 6c.478 0 .778.295.778.79 0 .042 0 .107-.006.16l-.08 3.716c-.016.456-.252.725-.698.725-.445 0-.681-.269-.692-.725L9.217 6.95c0-.053-.006-.118-.006-.16 0-.495.307-.79.79-.79Z",
    iconRing: "M10 2.085a7.915 7.915 0 1 1 0 15.83 7.915 7.915 0 0 1 0-15.83Zm0 1.33a6.585 6.585 0 1 0 0 13.17 6.585 6.585 0 0 0 0-13.17Z",
  },
  error: {
    bar: "border-token-editor-error-foreground/30",
    overlay: "bg-token-input-validation-error-background/30",
    icon: "text-token-editor-error-foreground",
    iconPath: "M7.746 3.637C8.873 2.573 10.451 2.271 11.856 2.756C13.537 3.334 14.667 4.91 14.667 6.685V13.315C14.667 15.09 13.537 16.666 11.856 17.244C10.451 17.729 8.873 17.427 7.746 16.363L7.34 15.979C6.866 15.528 6.311 15.281 5.667 15.281H5.333C4 15.281 3 14.281 3 12.947V7.05298C3 5.71931 4 4.71931 5.333 4.71931H5.667C6.311 4.71931 6.866 4.4723 7.34 4.0203L7.746 3.637ZM10 6.66798C10.368 6.66798 10.667 6.96698 10.667 7.33398V10C10.667 10.368 10.368 10.667 10 10.667C9.632 10.667 9.333 10.368 9.333 10V7.33398C9.333 6.96698 9.632 6.66798 10 6.66798ZM10 12.667C10.368 12.667 10.667 12.368 10.667 12C10.667 11.632 10.368 11.333 10 11.333C9.632 11.333 9.333 11.632 9.333 12C9.333 12.368 9.632 12.667 10 12.667Z",
  },
  info: {
    bar: "border-token-border",
    overlay: "bg-token-bg-secondary",
    icon: "text-token-text-secondary",
    iconPath: "M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM10 8a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 10 8Z",
  },
  success: {
    bar: "border-token-charts-green/30",
    overlay: "bg-token-charts-green/10",
    icon: "text-token-charts-green",
    iconPath: "M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm3.62 5.05a.75.75 0 0 0-1.06-.02L8.75 10.86 7.1 9.24a.75.75 0 1 0-1.06 1.06l2.24 2.24a.75.75 0 0 0 1.06 0l4.24-4.22a.75.75 0 0 0 .04-1.07Z",
  },
};

/** Codex-style inline banner (matches the real settings `<aside>` notice).
 * Renders with a tinted background overlay, a leading icon, and the message. */
export function Alert({ variant = "info", title, children, className }) {
  const v = alertVariants[variant] || alertVariants.info;
  return (
    <aside className={cx(
      "relative isolate flex w-full overflow-hidden rounded-2xl border bg-token-main-surface-primary py-2 ps-3 pe-2 text-sm shadow-xs lg:mx-auto electron:border-0 electron:ring-[0.5px] electron:ring-token-border-heavy items-center gap-4",
      v.bar, "text-token-foreground", className
    )}>
      <div aria-hidden="true" className={cx("absolute inset-0 -z-10", v.overlay)} />
      <div className="flex h-full w-full items-center gap-2">
        <svg aria-hidden="true" className={cx("icon-sm shrink-0", v.icon)} xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path d={v.iconPath} />
          {variant === "warning" && <path fillRule="evenodd" clipRule="evenodd" d={v.iconRing} />}
        </svg>
        <div className="flex min-w-0 grow flex-row items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            {title && <div className="text-sm font-medium">{title}</div>}
            <div className="electron:leading-relaxed min-w-0 flex-1 text-pretty">{children}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Card container that groups a header + rows like the real settings sections. */
export function SettingsCard({ header, children, footer }) {
  return <Card header={header} children={children} footer={footer} />;
}

// ---------------------------------------------------------------------------
// Toast — a floating, dismissible alert that overlays content at the top of the
// viewport (matches the Codex "Refreshed hooks" notification markup). Auto-hides
// after `duration` ms and can be closed via the × button.
// ---------------------------------------------------------------------------

let toastIdCounter = 0;

// Slide-down + fade entrance for the toast, defined once (matches the app's
// "Refreshed hooks" notification feel). Mounted via a <style> tag so it works
// regardless of the app's compiled CSS.
const TOAST_ANIM_CSS = `
@keyframes cx-toast-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.cx-toast-enter {
  animation: cx-toast-in 180ms cubic-bezier(0.2, 0, 0, 1);
  will-change: opacity, transform;
}
`;

export function Toast({ variant = "info", message, onClose, duration = 6000, className }) {
  const [id] = React.useState(() => `cx-toast-${++toastIdCounter}`);
  React.useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);
  const variants = {
    info: "border-token-border bg-token-input-validation-info-background",
    success: "border-token-border bg-token-input-validation-info-background",
    error: "border-token-border bg-token-input-validation-error-background",
    warning: "border-token-border bg-token-input-validation-warning-background",
  };
  return (
    <div className={cx("pointer-events-none fixed z-[60]", className)} style={{ inset: "82px -0.2px 0 275px" }}>
      <style>{TOAST_ANIM_CSS}</style>
      <span className="absolute inset-y-0 start-0 mx-auto my-2 flex max-w-(--composer-adjacent-max-width) flex-col items-center justify-start md:pb-5" style={{ insetInlineEnd: "0px" }}>
        <span className="h-7 shrink-0" />
        <div className="pointer-events-auto flex w-full justify-center no-drag">
          <div
            className={cx(
              "alert-root cx-toast-enter inline-flex flex-row items-start gap-1.5 rounded-2xl px-2 py-2 text-base leading-[1.4] pointer-events-auto box-shadow-lg border text-token-foreground flex",
              variants[variant] || variants.info,
              className
            )}
            role="alert"
          >
            <div className="mt-0.5 shrink-0 grow-0">
              <ToastIcon variant={variant} />
            </div>
            <div className="min-w-0 flex-1 justify-center gap-2 break-words">
              <div className="whitespace-pre-wrap text-start">{message}</div>
            </div>
            <button type="button" aria-label="Close" onClick={onClose}
              className="mt-0.5 flex shrink-0 grow-0 cursor-interaction rounded-full opacity-50 hover:bg-token-button-secondary-hover-background/5 hover:opacity-80">
              <ToastCloseIcon />
            </button>
          </div>
        </div>
      </span>
    </div>
  );
}

function ToastIcon({ variant }) {
  // Info/success: circled check; error/warning: circled exclamation.
  const check = variant === "error" || variant === "warning";
  return (
    <svg width={20} height={21} viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-sm">
      {check ? (
        <>
          <path d="M12.2099 7.57522C12.4212 7.27498 12.8363 7.20277 13.1366 7.41415C13.4367 7.62553 13.5089 8.04066 13.2977 8.34094L9.33878 13.9659C9.22266 14.1307 9.03811 14.2344 8.83683 14.247C8.66047 14.258 8.48767 14.1982 8.35637 14.083L8.30265 14.0302L6.21965 11.7384L6.13957 11.6308C5.98139 11.365 6.02669 11.0151 6.26457 10.7989C6.50228 10.583 6.85382 10.5717 7.10344 10.754L7.20402 10.8437L8.72844 12.5206L12.2099 7.57522Z" fill="currentColor" />
          <path fillRule="evenodd" clipRule="evenodd" d="M9.99506 2.81226C14.3664 2.81226 17.9101 6.35596 17.9101 10.7273C17.9101 15.0986 14.3664 18.6423 9.99506 18.6423C5.62372 18.6423 2.08002 15.0986 2.08002 10.7273C2.08002 6.35596 5.62372 2.81226 9.99506 2.81226ZM9.99506 4.14233C6.35826 4.14233 3.4101 7.0905 3.4101 10.7273C3.4101 14.3641 6.35826 17.3123 9.99506 17.3123C13.6319 17.3123 16.58 14.3641 16.58 10.7273C16.58 7.0905 13.6319 4.14233 9.99506 4.14233Z" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M12.1599 7.63617C12.3713 7.33596 12.7863 7.26372 13.0866 7.47504C13.3867 7.68642 13.4589 8.10153 13.2477 8.40179L9.28876 14.0268C9.17264 14.1917 8.98808 14.2954 8.7868 14.308C8.61044 14.319 8.43764 14.2592 8.30634 14.144L8.25262 14.0912L6.16962 11.7993L6.08954 11.6918C5.93136 11.4259 5.97666 11.0761 6.21454 10.8598C6.45225 10.6439 6.80379 10.6326 7.05341 10.8149L7.15399 10.9047L8.67841 12.5815L12.1599 7.63617Z" fill="currentColor" />
          <path fillRule="evenodd" clipRule="evenodd" d="M9.99506 2.81226C14.3664 2.81226 17.9101 6.35596 17.9101 10.7273C17.9101 15.0986 14.3664 18.6423 9.99506 18.6423C5.62372 18.6423 2.08002 15.0986 2.08002 10.7273C2.08002 6.35596 5.62372 2.81226 9.99506 2.81226ZM9.99506 4.14233C6.35826 4.14233 3.4101 7.0905 3.4101 10.7273C3.4101 14.3641 6.35826 17.3123 9.99506 17.3123C13.6319 17.3123 16.58 14.3641 16.58 10.7273C16.58 7.0905 13.6319 4.14233 9.99506 4.14233Z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function ToastCloseIcon() {
  return (
    <svg width={21} height={21} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-xs">
      <path d="M14.6549 5.57307C14.9283 5.2997 15.3718 5.2997 15.6451 5.57307C15.9185 5.84643 15.9185 6.28993 15.6451 6.5633L11.3903 10.8182L15.6451 15.0731L15.735 15.1834C15.9141 15.4551 15.8842 15.8242 15.6451 16.0633C15.4061 16.3024 15.0369 16.3322 14.7653 16.1531L14.6549 16.0633L10.4 11.8084L6.14515 16.0633C5.87178 16.3367 5.42828 16.3367 5.15492 16.0633C4.88155 15.7899 4.88155 15.3464 5.15492 15.0731L9.4098 10.8182L5.15492 6.5633L5.06507 6.45295C4.88597 6.18128 4.91584 5.81214 5.15492 5.57307C5.39399 5.33399 5.76313 5.30413 6.0348 5.48322L6.14515 5.57307L10.4 9.82795L14.6549 5.57307Z" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tooltip — matches the real Codex tooltip (Radix-style): a small rounded,
// bordered, dropdown-background popover shown on hover above the target.
// ---------------------------------------------------------------------------

/** Wraps a trigger and shows a `content` tooltip above it on hover/focus. */
export function Tooltip({ content, side = "top", children }) {
  const [open, setOpen] = React.useState(false);
  return h(
    "span",
    { className: "relative inline-flex", onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false), onFocus: () => setOpen(true), onBlur: () => setOpen(false) },
    children,
    open && content ? (
      h("span", {
        role: "tooltip",
        "data-side": side,
        className: "z-50 w-fit select-none text-sm whitespace-normal break-words rounded-lg border border-token-border bg-token-dropdown-background text-token-foreground px-2 py-1 absolute",
        style: { left: "50%", top: "0", transform: "translate(-50%, calc(-100% - 2px))", maxWidth: "min(20rem, calc(100vw - 16px))", pointerEvents: "none", willChange: "transform", textWrap: "nowrap" },
      },
        h("div", { className: "flex items-center gap-2" }, h("div", { className: "min-w-0" }, content))
      )
    ) : null
  );
}

// ---------------------------------------------------------------------------
// Provider / plugin-style card + favicon
// ---------------------------------------------------------------------------

/** Best-effort favicon URL from a provider base URL (e.g. api.deepseek.com -> deepseek.com favicon). */
export function faviconFor(baseUrl) {
  try {
    let host = (baseUrl || "").replace(/^https?:\/\//, "").split(/[/?#]/)[0];
    if (!host) return null;
    // strip `api.`/`api` subdomain to reach the top-level domain favicon
    const parts = host.split(".");
    if (parts.length > 2 && (parts[0] === "api" || parts[0] === "gateway")) {
      host = parts.slice(1).join(".");
    }
    const opt = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=64";
    return opt;
  } catch (e) {
    return null;
  }
}

/** Renders a provider brand mark: a bundled @lobehub/icons-static-svg SVG
 * when the icon id is known, otherwise a letter avatar. Falls back to the
 * letter avatar if the icon id is missing. */
export function Icon({ id, name, className, size = 20 }) {
  const svg = id ? iconSvg(id) : null;
  return (
    <span className={cx("inline-flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }}>
      {svg
        ? <span className="flex h-full w-full items-center justify-center text-token-foreground" style={{ fontSize: size }} dangerouslySetInnerHTML={{ __html: svg }} />
        : <span className="flex h-full w-full items-center justify-center rounded-md text-token-text-secondary font-medium uppercase" style={{ fontSize: Math.max(9, size * 0.45) }}>{(name || "?").charAt(0)}</span>}
    </span>
  );
}

/** The "add" glyph (a plus) used in Add buttons, matching the app icon set. */
export function PlusIcon({ className, size = 20 }) {
  return (
    <svg className={cx("inline-block align-middle", className)} width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9.33496 16.5V10.665H3.5C3.13273 10.665 2.83496 10.3673 2.83496 10C2.83496 9.63273 3.13273 9.33496 3.5 9.33496H9.33496V3.5C9.33496 3.13273 9.63273 2.83496 10 2.83496C10.3673 2.83496 10.665 3.13273 10.665 3.5V9.33496H16.5L16.6338 9.34863C16.9369 9.41057 17.165 9.67857 17.165 10C17.165 10.3214 16.9369 10.5894 16.6338 10.6514L16.5 10.665H10.665V16.5C10.665 16.8673 10.3673 17.165 10 17.165C9.63273 17.165 9.33496 16.8673 9.33496 16.5Z" fill="currentColor" />
    </svg>
  );
}

/** The "edit/pencil" glyph (matches the app's icon set). */
export function PencilIcon({ className, size = 20 }) {
  return (
    <svg className={cx("inline-block align-middle", className)} width={size} height={size} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M11.7313 4.20472C13.1489 2.92391 15.3377 2.96644 16.7039 4.33265L16.8318 4.46742C18.0713 5.8393 18.0713 7.93343 16.8318 9.30531L16.7039 9.44007L10.4119 15.7311C10.0884 16.0546 9.85387 16.2917 9.62188 16.4821L9.3875 16.6588C9.18236 16.799 8.96432 16.9196 8.73711 17.0192L8.50762 17.1119C8.32585 17.1785 8.13845 17.2266 7.92168 17.2711L7.15703 17.4069L4.76348 17.8053C4.62062 17.8291 4.46916 17.8552 4.34063 17.8649C4.24185 17.8723 4.10835 17.875 3.9627 17.8395L3.81426 17.7907C3.59124 17.695 3.40749 17.5271 3.2918 17.316L3.2459 17.2223C3.1596 17.0209 3.16176 16.8276 3.17168 16.6959C3.18138 16.5674 3.20744 16.4159 3.23125 16.2731L3.62969 13.8795L3.76445 13.1149C3.80902 12.898 3.85797 12.7108 3.92461 12.5289L4.01738 12.2985C4.11693 12.0715 4.23774 11.854 4.37774 11.6491L4.55352 11.4147C4.74395 11.1825 4.98173 10.9484 5.30547 10.6246L11.5965 4.33265L11.7313 4.20472ZM6.2459 11.5651C5.89673 11.9142 5.71261 12.0998 5.58672 12.2526L5.47539 12.3991C5.38197 12.5358 5.30159 12.6812 5.23516 12.8327L5.17363 12.9869C5.1333 13.0971 5.1025 13.2125 5.06817 13.3815L4.94121 14.0983L4.54277 16.4918L4.5418 16.4938H4.54473L6.93828 16.0944L7.65508 15.9684C7.82408 15.9341 7.93949 15.9033 8.04961 15.8629L8.20293 15.8014C8.35464 15.7349 8.49956 15.6538 8.63652 15.5602L8.78399 15.4498C8.93677 15.3239 9.12233 15.1398 9.47149 14.7907L14.4588 9.80238L11.2332 6.57679L6.2459 11.5651ZM15.7635 5.27308C14.9282 4.43776 13.6058 4.38573 12.7098 5.11683L12.5369 5.27308L12.1736 5.63636L15.4002 8.86195L15.7635 8.49964L15.9197 8.32581C16.6016 7.48961 16.6016 6.28311 15.9197 5.44691L15.7635 5.27308Z" fill="currentColor" />
    </svg>
  );
}

/** The refresh/reload glyph (matches the app's icon set). */
export function RefreshIcon({ className, size = 20 }) {
  return (
    <svg className={cx("inline-block align-middle", className)} width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3.50205 16.6664V13.3333C3.50205 12.9661 3.79982 12.6683 4.16709 12.6683H7.5001L7.63389 12.682C7.93696 12.7439 8.16514 13.0119 8.16514 13.3333C8.16514 13.6547 7.93696 13.9227 7.63389 13.9847L7.5001 13.9984H5.47471C6.58687 15.2249 8.21848 16.0013 10.0001 16.0013C13.06 16.0013 15.586 13.711 15.9552 10.7513L15.9854 10.6195C16.0846 10.3266 16.3786 10.1335 16.6974 10.1732C17.0617 10.2186 17.3198 10.551 17.2745 10.9154L17.2247 11.2523C16.6301 14.7051 13.6225 17.3313 10.0001 17.3314C8.01108 17.3314 6.17193 16.5383 4.83213 15.2474V16.6664C4.83213 17.0335 4.53416 17.3312 4.16709 17.3314C3.79982 17.3314 3.50205 17.0336 3.50205 16.6664ZM4.04502 9.24936C3.99941 9.61354 3.66706 9.87179 3.30283 9.82651C2.93839 9.78106 2.67926 9.44877 2.72471 9.08432L4.04502 9.24936ZM10.0001 2.6683C11.994 2.66834 13.8372 3.46552 15.1778 4.76205V3.33334C15.1778 2.96617 15.4757 2.66846 15.8429 2.6683C16.2101 2.6683 16.5079 2.96607 16.5079 3.33334V6.66635C16.5079 7.03362 16.2101 7.33139 15.8429 7.33139H12.5099C12.1426 7.33139 11.8448 7.03362 11.8448 6.66635C11.845 6.29923 12.1427 6.00131 12.5099 6.00131H14.5255C13.4134 4.77489 11.7816 3.99842 10.0001 3.99838C6.94004 3.99838 4.41411 6.28948 4.04502 9.24936L3.38486 9.16635L2.72471 9.08432C3.1758 5.46703 6.26081 2.6683 10.0001 2.6683Z" fill="currentColor" />
    </svg>
  );
}

/** Renders a provider brand icon inside a rounded tile, like the screenshots. */
export function ProviderIconTile({ size, id, name, className }) {
  return (
    <span className={cx("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-token-border/40 bg-token-bg-fog text-token-foreground", className)}>
      <Icon id={id} name={name} size={size ?? 24} />
    </span>
  );
}

/** The small connection-typed badge shown next to a provider name
 * ("Custom" / "API key"). */
export function ProviderBadge({ providerType }) {
  const text = providerType === "apiKey" ? "API key" : "Custom";
  return <span className="shrink-0 rounded-full bg-token-bg-fog border border-token-border px-1.5 py-0.5 text-xs text-token-text-secondary">{text}</span>;
}

/** Search input with a magnifier icon and a clear button. */
let searchIdCounter = 0;

/** Search input matching the real Codex search field: a rounded-full pill with
 * a border, the app's magnifier icon, an accessible label, and an inline input
 * that fills the row (with an optional trailing keystroke/search action). */
export function SearchInput({ value, onChange, placeholder, label, action, className }) {
  const [id] = React.useState(() => `cx-search-${++searchIdCounter}`);
  return (
    <div className={cx("no-drag flex h-8 items-center gap-2 rounded-full border border-token-input-border bg-token-input-background/90 px-2.5 py-0 text-base leading-[18px] backdrop-blur-sm electron:dark:bg-token-dropdown-background", className)}>
      <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-sm text-token-text-secondary">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.33057 1.98535C10.2484 1.98535 12.6136 4.3508 12.6138 7.26855C12.6138 8.58031 12.1346 9.77942 11.3433 10.7031L13.9897 13.3496C14.1655 13.5253 14.1655 13.8106 13.9897 13.9863C13.814 14.1621 13.5288 14.1621 13.353 13.9863L10.7017 11.335C9.78678 12.0942 8.61243 12.5518 7.33057 12.5518C4.41281 12.5516 2.04736 10.1864 2.04736 7.26855C2.04754 4.35091 4.41292 1.98553 7.33057 1.98535ZM7.33057 2.88574C4.90998 2.88592 2.94793 4.84796 2.94775 7.26855C2.94775 9.68929 4.90987 11.6522 7.33057 11.6523C9.75141 11.6523 11.7144 9.6894 11.7144 7.26855C11.7142 4.84786 9.75131 2.88574 7.33057 2.88574Z" fill="currentColor" />
      </svg>
      <label className="sr-only" htmlFor={id}>{label || placeholder || "Search"}</label>
      <input
        id={id}
        className="min-w-0 flex-1 bg-transparent text-base leading-[18px] text-token-input-foreground outline-none select-text placeholder:text-token-input-placeholder-foreground [&::placeholder]:select-none"
        placeholder={placeholder}
        type="text"
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  );
}

/** Plugin-style provider card (icon + name + description), clickable. */
export function ProviderCard({ name, description, iconUrl, icon, providerType, onClick, actions, readonly, enabledCount }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick && onClick(); } }}
      className="group flex w-full cursor-interaction flex-col gap-2.5 rounded-2xl p-2.5 hover:bg-token-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-token-focus-border"
    >
      <div className="flex w-full items-center gap-3">
        <span className="shrink-0"><ProviderIconTile id={icon} name={name} /></span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-token-foreground font-medium">{name}</div>
            {providerType && <ProviderBadge providerType={providerType} />}
            {readonly && <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-token-text-tertiary border border-token-border-light">Built-in</span>}
          </div>
          <div className="text-token-text-secondary text-sm leading-relaxed text-token-description-foreground line-clamp-1">{description || (modelCount ? modelCount + " models" : "")}</div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </div>
  );
}

/** A horizontal connected-provider row (icon + name + description + action),
 * matching the "Connected providers" section of the Providers page. */
export function ProviderListItem({ icon, name, description, providerType, badge, action }) {
  return (
    <div className="flex w-full items-center gap-3 p-3">
      <span className="shrink-0"><ProviderIconTile id={icon} name={name} /></span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-token-foreground font-medium">{name}</div>
          {(badge || providerType) && <ProviderBadge providerType={badge || providerType} />}
        </div>
        {description && <div className="min-w-0 text-xs leading-4 text-token-text-secondary">{description}</div>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal (used for add-provider popup)
// ---------------------------------------------------------------------------

/** Codex-style dialog (matches the real `codex-dialog`). Centered, blurred,
 * rounded-3xl, with a close button and optional footer actions. */
export function Modal({ title, description, onClose, children, footer }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="codex-dialog fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none bg-token-dropdown-background/90 text-token-foreground ring-token-border max-w-[92vw] rounded-3xl ring-[0.5px] ring-token-border shadow-lg backdrop-blur-xl overflow-hidden"
      style={{ pointerEvents: "auto", width: "min(600px, 92vw)" }}
    >
      <div className="flex flex-col gap-0 px-5 py-5 text-base leading-normal tracking-normal">
        <div className="flex w-full flex-col pt-3 first:pt-0">
          <div className="flex flex-col items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1 self-stretch">
              {title && <div className="heading-dialog min-w-0 font-semibold">{title}</div>}
              {description && <div className="text-token-description-foreground text-base leading-normal tracking-normal">{description}</div>}
            </div>
          </div>
        </div>
        {children && <div className="flex w-full flex-col pt-3 first:pt-0 gap-3">{children}</div>}
        {footer && (
          <div className="flex w-full flex-col pt-3 first:pt-0">
            <div className="flex w-full items-center justify-end gap-3">{footer}</div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="no-drag cursor-interaction rounded p-1 leading-none text-token-foreground/80 hover:bg-token-toolbar-hover-background focus:outline-none focus-visible:ring-1 focus-visible:ring-token-focus-border absolute top-4 right-4"
      >
        <svg width={21} height={21} viewBox="0 0 21 21" fill="none" aria-hidden="true" className="icon-xs">
          <path d="M14.6549 5.57307C14.9283 5.2997 15.3718 5.2997 15.6451 5.57307C15.9185 5.84643 15.9185 6.28993 15.6451 6.5633L11.3903 10.8182L15.6451 15.0731L15.735 15.1834C15.9141 15.4551 15.8842 15.8242 15.6451 16.0633C15.4061 16.3024 15.0369 16.3322 14.7653 16.1531L14.6549 16.0633L10.4 11.8084L6.14515 16.0633C5.87178 16.3367 5.42828 16.3367 5.15492 16.0633C4.88155 15.7899 4.88155 15.3464 5.15492 15.0731L9.4098 10.8182L5.15492 6.5633L5.06507 6.45295C4.88597 6.18128 4.91584 5.81214 5.15492 5.57307C5.39399 5.33399 5.76313 5.30413 6.0348 5.48322L6.14515 5.57307L10.4 9.82795L14.6549 5.57307Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

export default { Page, Section, Card, Row, RowLabel, CardHeader, Button, SelectTrigger, Input, SmallInput, RowInput, LabeledField, Textarea, Toggle, Checkbox, SegButton, SegmentedGroup, TabButton, SegmentedTabs, Badge, Divider, EmptyState, SimpleEmptyState, Alert, Toast, Tooltip, ProviderCard, ProviderListItem, ProviderIconTile, ProviderBadge, Icon, PlusIcon, PencilIcon, RefreshIcon, faviconFor, SearchInput, Modal, cx, clxs };





