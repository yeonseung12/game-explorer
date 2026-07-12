import { useEffect, useRef } from "react";

type Options = {
  onIntersect: () => void;
  enabled: boolean;
};

export const useInfiniteScrollTrigger = ({ onIntersect, enabled }: Options) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onIntersect();
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enabled, onIntersect]);

  return sentinelRef;
};
