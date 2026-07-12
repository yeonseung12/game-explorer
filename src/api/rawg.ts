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
