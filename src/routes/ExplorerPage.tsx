import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../features/games/hooks/useDebouncedValue";
import { useGamesSearch } from "../features/games/hooks/useGamesSearch";
import { useInfiniteScrollTrigger } from "../features/games/hooks/useInfiniteScrollTrigger";

const ExplorerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const ordering = searchParams.get("ordering") ?? "-rating";
  const genres = searchParams.get("genres") ?? "";

  // input은 URL이 아니라 이 로컬 state에 직접 연결한다 (한글 IME 조합이
  // 매 타건마다 URL 네비게이션에 끊기는 문제를 피하기 위함).
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebouncedValue(localSearch, 400);

  // 디바운스가 끝난 값만 URL에 반영한다.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        prev.set("q", debouncedSearch);
        return prev;
      },
      { replace: true },
    );
  }, [debouncedSearch, setSearchParams]);

  // 뒤로가기 등으로 URL의 q가 바깥에서 바뀌면 로컬 입력값도 따라간다.
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const { games, status, error, hasMore, isFetchingMore, loadMore } =
    useGamesSearch({ search: debouncedSearch, ordering, genres });

  const sentinelRef = useInfiniteScrollTrigger({
    onIntersect: loadMore,
    enabled: hasMore && !isFetchingMore && status !== "loading",
  });

  return (
    <div>
      <input
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="게임 검색"
      />

      {status === "loading" && <p>로딩 중...</p>}
      {status === "error" && <p>에러: {error}</p>}
      {status === "success" && games.length === 0 && <p>검색 결과 없음</p>}

      <ul>
        {games.map((game) => (
          <li key={game.id}>
            {game.name} (⭐ {game.rating})
          </li>
        ))}
      </ul>

      {isFetchingMore && <p>다음 페이지 불러오는 중...</p>}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
};

export default ExplorerPage;
