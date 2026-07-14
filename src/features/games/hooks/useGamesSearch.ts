import { useCallback, useEffect, useRef, useState } from "react";
import { searchGames, type Game } from "../../../api/rawg";

type Status = "idle" | "loading" | "error" | "success";

type Params = {
  search: string;
  ordering: string;
  genres: string;
};

/**
 * 게임 검색, 정렬, 장르 필터, 페이지 누적, 요청 취소를 담당한다.
 *
 * `search`, `ordering`, `genres`가 바뀌면 기존 결과를 비우고 1페이지부터 다시 불러온다.
 * 무한스크롤에서는 `loadMore`를 호출해 다음 페이지를 append한다.
 *
 * @param params URL/search UI에서 온 검색 조건
 * @returns 게임 목록, 요청 상태, 다음 페이지 여부, 추가 로딩 함수
 */
export const useGamesSearch = ({ search, ordering, genres }: Params) => {
  const [games, setGames] = useState<Game[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const pageRef = useRef(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * RAWG `/games` 요청을 실행하고 결과를 reset 또는 append 방식으로 반영한다.
   *
   * 새 요청이 시작될 때 이전 요청을 취소해 늦게 도착한 응답이 최신 목록을 덮어쓰지 못하게 한다.
   * AbortError는 사용자가 의도한 취소 흐름이므로 에러 상태로 노출하지 않는다.
   *
   * @param page 요청할 페이지 번호
   * @param mode reset이면 목록 교체, append면 기존 목록 뒤에 누적
   */
  const runFetch = useCallback(async (page: number, mode: "reset" | "append") => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (mode === "reset") {
      setStatus("loading");
    } else {
      setIsFetchingMore(true);
    }

    try {
      const response = await searchGames(
        { search, ordering, genres, page },
        controller.signal,
      );

      pageRef.current = page;
      setGames((prev) =>
        mode === "reset" ? response.results : [...prev, ...response.results],
      );
      setHasMore(response.next !== null);
      setStatus("success");
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mode === "append") {
        setIsFetchingMore(false);
      }
    }
  }, [search, ordering, genres]);

  /**
   * 검색 조건이 바뀔 때마다 누적 결과를 초기화하고 첫 페이지를 다시 요청한다.
   */
  useEffect(() => {
    setGames([]);
    runFetch(1, "reset");

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [search, ordering, genres, runFetch]);

  /**
   * 무한스크롤 sentinel이 보였을 때 다음 페이지를 요청한다.
   *
   * 이미 로딩 중이거나 마지막 페이지에 도달한 경우에는 요청하지 않는다.
   */
  const loadMore = () => {
    if (isFetchingMore || status === "loading" || !hasMore) {
      return;
    }
    runFetch(pageRef.current + 1, "append");
  };

  return { games, status, error, hasMore, isFetchingMore, loadMore };
};
