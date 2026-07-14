import { useEffect, useRef } from "react";

type Options = {
  onIntersect: () => void;
  enabled: boolean;
};

/**
 * IntersectionObserver로 무한스크롤 sentinel 노출을 감지한다.
 *
 * `enabled`가 true일 때만 observer를 연결하고, false가 되거나 언마운트되면 disconnect한다.
 * 반환된 ref를 화면 아래 sentinel 요소에 연결하면, 요소가 뷰포트에 들어왔을 때 `onIntersect`가 실행된다.
 *
 * @param options.onIntersect sentinel이 보였을 때 실행할 함수
 * @param options.enabled observer 활성화 여부
 * @returns sentinel DOM 요소에 연결할 ref
 */
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
