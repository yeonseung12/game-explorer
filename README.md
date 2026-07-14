# 게임 검색 탐색기

RAWG API를 사용해 게임을 검색하고, 정렬/장르 필터와 무한스크롤로 결과를 탐색하는 React + TypeScript 앱입니다.

이 프로젝트의 학습 목표는 데이터 패칭 라이브러리 없이 `fetch`, `useState`, `useEffect`, `useRef`, `AbortController`, `IntersectionObserver`를 직접 다뤄 보는 것입니다.

## 현재 구현 상태

| 기능 | 상태 |
| --- | --- |
| RAWG `/games` 검색 요청 | 완료 |
| RAWG `/genres` 장르 목록 요청 | 완료 |
| 검색어 디바운스 | 완료 |
| 검색어/정렬/장르 URL 동기화 | 완료 |
| 검색 조건 변경 시 page 1부터 재요청 | 완료 |
| AbortController 요청 취소 | 완료 |
| AbortError 무시 | 완료 |
| 로딩/에러/빈 결과/성공 상태 분기 | 완료 |
| IntersectionObserver 무한스크롤 | 기본 구현 완료 |
| 게임 카드 그리드 | 완료 |
| 이미지 lazy loading / aspect-ratio | 완료 |
| 즐겨찾기 localStorage | 미구현 |
| 무한스크롤 중복 page 요청 보강 | 개선 예정 |

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env`를 만들고 RAWG API 키를 넣습니다.

```bash
cp .env.example .env
```

```bash
VITE_RAWG_API_KEY=발급받은_키
VITE_RAWG_BASE_URL=https://api.rawg.io/api
```

RAWG API 키는 클라이언트 번들과 네트워크 탭에 노출됩니다. 이 프로젝트에서 환경 변수를 쓰는 이유는 비밀 유지가 아니라 코드에 키를 하드코딩하지 않기 위해서입니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 주요 구조

```txt
src/
  api/
    rawg.ts
  features/
    games/
      components/
        GameCard.tsx
        GameGrid.tsx
      hooks/
        useDebouncedValue.ts
        useGamesSearch.ts
        useGenres.ts
        useInfiniteScrollTrigger.ts
  routes/
    ExplorerPage.tsx
```

## 데이터 흐름

`ExplorerPage`는 URL query parameter에서 검색 조건을 읽습니다.

```txt
URL query
  q
  ordering
  genres
```

이 값들이 `useGamesSearch`로 전달되고, 훅은 RAWG `/games` 엔드포인트에 하나의 요청으로 검색어, 정렬, 장르, 페이지 값을 함께 보냅니다.

```txt
ExplorerPage
  -> useGamesSearch({ search, ordering, genres })
  -> searchGames()
  -> RAWG /games
```

장르 select 옵션은 `useGenres`에서 별도로 `/genres`를 요청해 가져옵니다.

## 상태 관리

게임 목록 요청은 `useGamesSearch`에서 직접 상태를 관리합니다.

```ts
type Status = "idle" | "loading" | "error" | "success";
```

- `loading`: 첫 페이지 요청 중
- `error`: AbortError가 아닌 실제 요청 실패
- `success`: 요청 성공
- 빈 결과: `status === "success"`이고 `games.length === 0`

다음 페이지 요청은 첫 페이지 로딩과 구분하기 위해 `isFetchingMore`로 따로 관리합니다. 그래서 첫 로딩 화면과 무한스크롤 추가 로딩 문구를 다르게 보여줄 수 있습니다.

## 검색어 디바운스

검색 input은 바로 URL에 쓰지 않고 `localSearch`에 먼저 저장합니다. 이후 `useDebouncedValue(localSearch, 400)`을 거친 값만 URL의 `q`에 반영합니다.

이렇게 한 이유는 두 가지입니다.

- 매 타건마다 API 요청이 나가지 않게 하기 위해
- 한글 IME 조합 중 URL navigation이 계속 발생하는 문제를 줄이기 위해

## 요청 취소

`useGamesSearch`는 새 게임 요청을 시작하기 전에 이전 요청을 `abort()`합니다.

빠르게 검색어를 바꾸거나, 이전 요청이 늦게 도착하는 상황에서 오래된 응답이 최신 결과를 덮어쓰지 않게 하기 위한 처리입니다.

```ts
if (err instanceof Error && err.name === "AbortError") {
  return;
}
```

취소는 사용자가 의도한 정상 흐름이므로 에러 화면으로 보여주지 않습니다.

## 무한스크롤

무한스크롤은 `useInfiniteScrollTrigger`에서 `IntersectionObserver`로 구현했습니다.

- 화면 아래 sentinel 요소가 보이면 `loadMore()` 호출
- `hasMore`가 false면 observer 비활성화
- 첫 페이지 로딩 중이거나 다음 페이지 로딩 중이면 추가 요청 방지
- 응답의 `next` 값으로 다음 페이지 존재 여부 판단

현재는 기본 가드가 들어가 있으며, 이후 같은 page가 아주 빠르게 중복 호출되는 상황을 더 강하게 막기 위해 `requestedPageRef` 같은 보강을 추가할 예정입니다.

## URL 동기화 전략

URL에는 다음 값만 저장합니다.

```txt
q
ordering
genres
```

`page`는 URL에 저장하지 않습니다. 무한스크롤의 page는 사용자가 직접 선택하는 필터라기보다 현재 스크롤 진행 상태에 가깝기 때문입니다. 새로고침이나 공유 링크에서는 같은 검색 조건의 첫 페이지부터 다시 탐색하는 편이 자연스럽다고 판단했습니다.

검색 input은 로컬 state와 URL을 함께 사용합니다.

- 입력 중 값: `localSearch`
- 요청 기준 값: debounced search
- 복원 가능한 상태: URL query parameter

## 이미지 처리

게임 카드는 `background_image`를 사용합니다.

- `loading="lazy"`로 이미지 지연 로딩
- `aspect-ratio: 16 / 9`로 이미지 영역을 미리 확보
- 이미지가 없으면 `No Image` placeholder 표시

이렇게 해서 초기 렌더링 부담과 레이아웃 흔들림을 줄입니다.

## 남은 작업

- 즐겨찾기 버튼과 localStorage 저장
- 무한스크롤 중복 page 요청 방지 보강
- 필터 영역 UI 정리
- RAWG 출처 문구를 앱 화면에도 표시
- 배포 링크 연결

## 참고 문서

개발 의도와 설명용 문서는 [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)를 참고하세요.

## Powered by RAWG

This project uses the [RAWG Video Games Database API](https://rawg.io).
