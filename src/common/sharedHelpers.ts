type StyleObject = Partial<CSSStyleDeclaration> & {
  [key: `--${string}`]: string | undefined;
};

export const setStyle = (
  element: HTMLElement | SVGSVGElement | null | undefined,
  styles: StyleObject,
): void => {
  if (!element) {
    return;
  }

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (key.startsWith('--')) {
      // Explicitly casting value as string fixes the type error safely
      element.style.setProperty(key, value as string);
    } else {
      // @ts-ignore: safe fallback for dynamic string keys matching standard CSS properties
      element.style[key] = value;
    }
  }
};
