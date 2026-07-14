import { useEffect, useState } from "react";

/**
 * 값이 바뀐 뒤 지정한 시간 동안 추가 변경이 없을 때만 최신 값을 반영한다.
 *
 * 검색 입력처럼 매 타건마다 요청을 보내면 부담이 큰 값에 사용한다.
 * 이 훅은 요청 빈도를 줄이는 역할만 하며, 이미 보낸 요청의 응답 순서는
 * AbortController 같은 별도 장치로 다뤄야 한다.
 *
 * @param value 디바운스할 원본 값
 * @param delay 최신 값을 반영하기 전 기다릴 시간(ms)
 * @returns 지정한 시간 동안 안정화된 값
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [value, delay]);

  return debouncedValue;
};
