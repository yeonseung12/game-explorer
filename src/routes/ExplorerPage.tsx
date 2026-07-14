import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GameGrid } from "../features/games/components/GameGrid";
import { useDebouncedValue } from "../features/games/hooks/useDebouncedValue";
import { useGamesSearch } from "../features/games/hooks/useGamesSearch";
import { useGenres } from "../features/games/hooks/useGenres";
import { useInfiniteScrollTrigger } from "../features/games/hooks/useInfiniteScrollTrigger";

/**
 * 게임 검색 탐색기 메인 페이지.
 *
 * 검색어, 정렬, 장르를 URL query parameter와 동기화하고,
 * 해당 조건으로 게임 목록을 요청해 무한스크롤로 이어 붙인다.
 */
const ExplorerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const ordering = searchParams.get("ordering") ?? "-rating";
  const genres = searchParams.get("genres") ?? "";

  // input은 URL이 아니라 이 로컬 state에 직접 연결한다 (한글 IME 조합이
  // 매 타건마다 URL 네비게이션에 끊기는 문제를 피하기 위함).
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebouncedValue(localSearch, 400);

  /**
   * 디바운스가 끝난 검색어만 URL에 반영한다.
   *
   * `replace: true`를 사용해 타이핑 중 생기는 중간 검색어가 브라우저 히스토리에
   * 과하게 쌓이지 않도록 한다.
   */
  useEffect(() => {
    setSearchParams(
      (prev) => {
        prev.set("q", debouncedSearch);
        return prev;
      },
      { replace: true },
    );
  }, [debouncedSearch, setSearchParams]);

  /**
   * 뒤로가기/공유 링크 진입처럼 URL의 검색어가 외부에서 바뀌면 입력창도 같은 값으로 맞춘다.
   */
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  /**
   * 정렬 select 변경값을 URL에 저장한다.
   *
   * URL이 바뀌면 `ordering` 값도 바뀌고, `useGamesSearch`가 첫 페이지부터 다시 요청한다.
   *
   * @param value RAWG ordering 값
   */
  const handleOrderingChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set("ordering", value);
      return prev;
    });
  };

  /**
   * 장르 select 변경값을 URL에 저장한다.
   *
   * 빈 값은 "전체 장르"를 뜻하므로 URL에서 `genres`를 제거한다.
   *
   * @param value RAWG genre slug
   */
  const handleGenreChange = (value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set("genres", value);
      } else {
        prev.delete("genres");
      }
      return prev;
    });
  };

  const {
    genres: genreOptions,
    status: genresStatus,
    error: genresError,
  } = useGenres();

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

      <select
        value={ordering}
        onChange={(e) => handleOrderingChange(e.target.value)}
        aria-label="정렬 방식"
      >
        <option value="-rating">평점 높은순</option>
        <option value="-released">최신 출시순</option>
        <option value="name">이름순</option>
      </select>

      <select
        value={genres}
        onChange={(e) => handleGenreChange(e.target.value)}
        aria-label="장르"
        disabled={genresStatus === "loading"}
      >
        <option value="">
          {genresStatus === "loading" ? "장르 불러오는 중" : "전체 장르"}
        </option>
        {genreOptions.map((genre) => (
          <option key={genre.id} value={genre.slug}>
            {genre.name}
          </option>
        ))}
      </select>

      {genresStatus === "error" && <p>장르 로딩 실패: {genresError}</p>}

      {status === "loading" && <p>로딩 중...</p>}
      {status === "error" && <p>에러: {error}</p>}
      {status === "success" && games.length === 0 && <p>검색 결과 없음</p>}

      <GameGrid games={games} />

      {isFetchingMore && <p>다음 페이지 불러오는 중...</p>}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
};

export default ExplorerPage;
