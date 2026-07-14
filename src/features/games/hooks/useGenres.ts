import { useEffect, useState } from "react";
import { getGenres, type Genre } from "../../../api/rawg";

type GenresStatus = "idle" | "loading" | "error" | "success";

/**
 * 장르 필터에 사용할 RAWG 장르 목록을 관리한다.
 *
 * 최초 마운트 시 한 번 `/genres`를 요청하고, 로딩/에러/성공 상태를 함께 반환한다.
 * 언마운트되면 진행 중인 요청을 취소하며, 취소로 발생한 AbortError는 에러 상태로 표시하지 않는다.
 *
 * @returns 장르 배열과 요청 상태
 */
export const useGenres = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [status, setStatus] = useState<GenresStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    /**
     * 장르 목록을 가져오고 요청 상태를 갱신한다.
     *
     * 이 함수는 이 useEffect 안에서만 호출되며,
     * 같은 useEffect 안에서 만든 AbortController를 사용한다.
     */
    const fetchGenres = async () => {
      setStatus("loading");
      setError(null);

      try {
        const genreList = await getGenres(controller.signal);
        setGenres(genreList);
        setStatus("success");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchGenres();

    return () => {
      controller.abort();
    };
  }, []);

  return { genres, status, error };
};
