import { useEffect } from "react";

let lockCount = 0;

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    lockCount++;
    if (lockCount === 1) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [locked]);
}
