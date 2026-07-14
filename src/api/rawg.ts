export type Genre = {
  id: number;
  name: string;
  slug: string;
};

export type Game = {
  id: number;
  name: string;
  background_image: string | null;
  rating: number;
  released: string | null;
  genres: Genre[];
};

export type GameResponse = {
  count: number;
  next: string | null;
  results: Game[];
};

const BASE_URL = import.meta.env.VITE_RAWG_BASE_URL;
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

/**
 * RAWG 게임 목록을 검색한다.
 *
 * 검색어, 정렬, 장르, 페이지네이션 값을 하나의 `/games` 요청에 담아 보낸다.
 * `signal`을 함께 받아 컴포넌트/훅 쪽에서 이전 요청을 취소할 수 있게 한다.
 *
 * @param params RAWG `/games` 엔드포인트에 전달할 검색 조건
 * @param signal 요청 취소에 사용할 AbortSignal
 * @returns RAWG 게임 목록 응답
 */
export const searchGames = async (
  params: {
    search?: string;
    ordering?: string;
    genres?: string;
    page: number;
    pageSize?: number;
  },
  signal: AbortSignal,
): Promise<GameResponse> => {
  const sp = new URLSearchParams();
  sp.set("key", API_KEY);
  if (params.search) sp.set("search", params.search);
  if (params.ordering) sp.set("ordering", params.ordering);
  if (params.genres) sp.set("genres", params.genres);
  sp.set("page", String(params.page));
  sp.set("page_size", String(params.pageSize ?? 20));

  const res = await fetch(`${BASE_URL}/games?${sp}`, { signal });
  if (!res.ok) {
    throw new Error(`RAWG /games request failed: ${res.status}`);
  }
  return res.json();
};

/**
 * RAWG 장르 목록을 불러온다.
 *
 * 장르 필터 select를 채우기 위한 옵션 데이터를 가져온다.
 * `signal`은 페이지 이탈/언마운트 시 요청을 정리하기 위해 받는다.
 *
 * @param signal 요청 취소에 사용할 AbortSignal
 * @returns RAWG 장르 배열
 */
export const getGenres = async (signal?: AbortSignal): Promise<Genre[]> => {
  const sp = new URLSearchParams();
  sp.set("key", API_KEY);

  const res = await fetch(`${BASE_URL}/genres?${sp}`, { signal });
  if (!res.ok) {
    throw new Error(`RAWG /genres request failed: ${res.status}`);
  }
  const data: { results: Genre[] } = await res.json();
  return data.results;
};
