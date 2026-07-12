import { useCallback, useEffect, useRef, useState } from "react";
import { searchGames, type Game } from "../../../api/rawg";

type Status = "idle" | "loading" | "error" | "success";

type Params = {
  search: string;
  ordering: string;
  genres: string;
};

export const useGamesSearch = ({ search, ordering, genres }: Params) => {
  const [games, setGames] = useState<Game[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const pageRef = useRef(1);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    setGames([]);
    runFetch(1, "reset");

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [search, ordering, genres, runFetch]);

  const loadMore = () => {
    if (isFetchingMore || status === "loading" || !hasMore) {
      return;
    }
    runFetch(pageRef.current + 1, "append");
  };

  return { games, status, error, hasMore, isFetchingMore, loadMore };
};
