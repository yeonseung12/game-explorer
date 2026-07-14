import type { Game } from "../../../api/rawg";
import { GameCard } from "./GameCard";

type GameGridProps = {
  games: Game[];
};

/**
 * 게임 목록을 반응형 카드 그리드로 배치한다.
 *
 * 데이터 요청 방식은 알지 못하고, 전달받은 games 배열을 화면 구조로 바꾸는 역할만 한다.
 *
 * @param props.games 화면에 표시할 게임 배열
 */
export const GameGrid = ({ games }: GameGridProps) => {
  return (
    <section className="game-grid" aria-label="게임 검색 결과">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </section>
  );
};
