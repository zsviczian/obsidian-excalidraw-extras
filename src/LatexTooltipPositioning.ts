const TOOLTIP_SELECTOR =
  '.excalidraw-LatexPrompt .cm-editor .cm-tooltip-cursor.cm-tooltip';
const ARROW_SELECTOR = '.cm-tooltip-arrow';

function setStyleIfChanged(
  element: HTMLElement,
  property: keyof CSSStyleDeclaration,
  value: string,
): void {
  if (element.style[property] !== value) {
    // CSSStyleDeclaration has several non-string members, so assign through
    // setProperty while keeping property names centralized in this module.
    element.style.setProperty(property as string, value);
  }
}

function applyTooltipPositioning(
  tooltip: HTMLElement,
  supportsAnchorPositioning: boolean,
): void {
  // CodeMirror writes left/top/position directly to the style attribute.
  // These inline values cannot be overridden by selector specificity without
  // priority declarations, so mirror the intended overrides at the same
  // cascade level.
  setStyleIfChanged(tooltip, 'left', 'unset');

  const arrow = tooltip.querySelector<HTMLElement>(ARROW_SELECTOR);
  if (arrow) {
    setStyleIfChanged(arrow, 'left', '50%');
  }

  if (!supportsAnchorPositioning) return;

  setStyleIfChanged(tooltip, 'position', 'fixed');
  setStyleIfChanged(
    tooltip,
    'top',
    tooltip.classList.contains('cm-tooltip-below')
      ? 'anchor(bottom)'
      : 'unset',
  );
}

function getElement(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null;
}

/**
 * Keeps the LaTeX cursor tooltip positioning compatible with CodeMirror's
 * inline positioning without relying on CSS priority overrides.
 */
export function installLatexTooltipPositioning(doc: Document): () => void {
  const MutationObserverCtor = doc.defaultView?.MutationObserver;
  if (!MutationObserverCtor) return () => undefined;

  const supportsAnchorPositioning =
    doc.defaultView?.CSS?.supports('anchor-name: --latex-editor') ?? false;
  const tooltipObservers = new Map<HTMLElement, MutationObserver>();

  const unregisterTooltip = (tooltip: HTMLElement): void => {
    tooltipObservers.get(tooltip)?.disconnect();
    tooltipObservers.delete(tooltip);
  };

  const registerTooltip = (tooltip: HTMLElement): void => {
    if (tooltipObservers.has(tooltip)) return;

    applyTooltipPositioning(tooltip, supportsAnchorPositioning);

    const observer = new MutationObserverCtor(() => {
      if (!tooltip.isConnected) {
        unregisterTooltip(tooltip);
        return;
      }
      applyTooltipPositioning(tooltip, supportsAnchorPositioning);
    });

    observer.observe(tooltip, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true,
    });
    tooltipObservers.set(tooltip, observer);
  };

  const forEachTooltip = (
    node: Node,
    callback: (tooltip: HTMLElement) => void,
  ): void => {
    const element = getElement(node);
    if (!element) return;

    if (element.matches(TOOLTIP_SELECTOR)) {
      callback(element as HTMLElement);
    }
    element
      .querySelectorAll<HTMLElement>(TOOLTIP_SELECTOR)
      .forEach((tooltip) => callback(tooltip));
  };

  doc
    .querySelectorAll<HTMLElement>(TOOLTIP_SELECTOR)
    .forEach((tooltip) => registerTooltip(tooltip));

  const documentObserver = new MutationObserverCtor((records) => {
    for (const record of records) {
      record.removedNodes.forEach((node) => {
        forEachTooltip(node, unregisterTooltip);
      });
      record.addedNodes.forEach((node) => {
        forEachTooltip(node, registerTooltip);
      });
    }
  });

  documentObserver.observe(doc.documentElement, {
    childList: true,
    subtree: true,
  });

  return () => {
    documentObserver.disconnect();
    for (const observer of tooltipObservers.values()) {
      observer.disconnect();
    }
    tooltipObservers.clear();
  };
}
