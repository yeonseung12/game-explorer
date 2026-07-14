import type { Game } from "../../../api/rawg";

type GameCardProps = {
  game: Game;
};

/**
 * 게임 하나를 카드 형태로 보여준다.
 *
 * API에서 받은 게임 데이터를 화면용 정보(이미지, 이름, 평점, 출시일, 장르)로 풀어낸다.
 * 이미지가 없으면 고정 비율 placeholder를 보여 레이아웃이 흔들리지 않게 한다.
 *
 * @param props.game 카드에 표시할 게임 데이터
 */
export const GameCard = ({ game }: GameCardProps) => {
  const released = game.released ?? "출시일 미정";
  const genreNames = game.genres.map((genre) => genre.name).join(", ");

  return (
    <article className="game-card">
      <div className="game-card__image-frame">
        {game.background_image ? (
          <img
            className="game-card__image"
            src={game.background_image}
            alt={game.name}
            loading="lazy"
          />
        ) : (
          <div className="game-card__image-fallback" aria-label="이미지 없음">
            No Image
          </div>
        )}
      </div>

      <div className="game-card__body">
        <h2 className="game-card__title">{game.name}</h2>
        <dl className="game-card__meta">
          <div>
            <dt>평점</dt>
            <dd>{game.rating.toFixed(1)}</dd>
          </div>
          <div>
            <dt>출시일</dt>
            <dd>{released}</dd>
          </div>
        </dl>
        {genreNames && <p className="game-card__genres">{genreNames}</p>}
      </div>
    </article>
  );
};
