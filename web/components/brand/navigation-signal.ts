type Listener = (active: boolean) => void;

const listeners = new Set<Listener>();

export function subscribeAppNavigation(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function beginAppNavigation(href?: string) {
  if (typeof window === "undefined") return;
  if (href && isCurrentLocation(href)) return;
  listeners.forEach((listener) => listener(true));
}

export function endAppNavigation() {
  listeners.forEach((listener) => listener(false));
}

function isCurrentLocation(href: string) {
  try {
    const url = new URL(href, window.location.href);
    return (
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  } catch {
    return false;
  }
}
