// hooks/usePointerLock.ts
import { useEffect } from "react";

export function usePointerLock(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const requestPointerLock = () => {
      element.requestPointerLock?.();
    };

    const onClick = () => {
      requestPointerLock();
    };

    element.addEventListener("click", onClick);

    return () => {
      element.removeEventListener("click", onClick);
    };
  }, [ref]);
}
