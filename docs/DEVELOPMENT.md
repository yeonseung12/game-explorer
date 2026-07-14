# 개발 설명 문서

이 문서는 게임 검색 탐색기 앱을 다른 사람에게 설명할 때 사용할 수 있도록 작성한 개발 노트입니다.

## 한 줄 소개

RAWG API에서 게임 데이터를 가져와 검색어, 정렬, 장르 필터로 탐색하고, IntersectionObserver로 다음 페이지를 이어 붙이는 React 앱입니다.

## 핵심 학습 목표

이 앱은 데이터 패칭 라이브러리 없이 React 기본 기능만으로 다음 문제를 직접 다루는 연습을 위해 만들었습니다.

- 검색 입력 디바운스
- 요청 취소와 race condition 방지
- 로딩/에러/빈 결과/성공 상태 분기
- URL query parameter와 UI 상태 동기화
- IntersectionObserver 기반 무한스크롤
- 이미지 lazy loading과 CLS 방지

## 전체 흐름

```txt
사용자 입력
  -> 검색어 / 정렬 / 장르 변경
  -> URL query parameter 변경
  -> ExplorerPage가 URL에서 조건 읽기
  -> useGamesSearch가 RAWG /games 요청
  -> 결과를 reset 또는 append
  -> GameGrid / GameCard로 렌더링
```

## 파일별 책임

| 파일 | 책임 |
| --- | --- |
| `src/routes/ExplorerPage.tsx` | URL 상태를 읽고, 검색/정렬/장르 UI와 데이터 훅을 연결 |
| `src/api/rawg.ts` | RAWG API 요청 함수와 응답 타입 정의 |
| `src/features/games/hooks/useGamesSearch.ts` | 게임 목록 요청, 상태 관리, 요청 취소, 페이지 누적 |
| `src/features/games/hooks/useGenres.ts` | 장르 목록 요청과 상태 관리 |
| `src/features/games/hooks/useDebouncedValue.ts` | 검색어 디바운스 처리 |
| `src/features/games/hooks/useInfiniteScrollTrigger.ts` | IntersectionObserver 연결 |
| `src/features/games/components/GameGrid.tsx` | 게임 배열을 카드 그리드로 렌더링 |
| `src/features/games/components/GameCard.tsx` | 게임 하나의 이미지/이름/평점/출시일/장르 표시 |

## 왜 URL을 중심 상태로 사용했나

검색어, 정렬, 장르는 사용자가 공유하거나 새로고침 후 복원하기 원하는 조건입니다. 그래서 이 세 값은 URL query parameter로 관리합니다.

```txt
?q=zelda&ordering=-rating&genres=action
```

반대로 `page`는 URL에 넣지 않았습니다. page는 필터 조건이 아니라 무한스크롤을 얼마나 내려갔는지에 가까운 UI 진행 상태이기 때문입니다.

## 검색 input을 로컬 state로 둔 이유

검색어도 최종적으로는 URL에 저장하지만, input의 `value`를 URL에 직접 연결하지는 않았습니다.

```txt
localSearch
  -> debounce 400ms
  -> URL q
  -> useGamesSearch
```

이렇게 나눈 이유는 다음과 같습니다.

- 매 타건마다 URL 변경과 API 요청이 발생하지 않게 하기 위해
- 한글 입력 조합 중 URL 업데이트로 입력 경험이 흔들리는 것을 줄이기 위해
- 사용자가 입력 중인 값과 실제 요청 기준 값을 구분하기 위해

## 디바운스와 AbortController의 역할 차이

디바운스는 요청 빈도를 줄입니다.

```txt
a
ab
abc
```

이렇게 빠르게 입력할 때 마지막 값이 안정화된 뒤 요청하게 만듭니다.

AbortController는 응답 순서 문제를 다룹니다. 이미 나간 요청이 늦게 도착해 최신 검색 결과를 덮어쓰는 상황을 막기 위해 이전 요청을 취소합니다.

즉, 둘은 서로 다른 문제를 풉니다.

| 도구 | 해결하는 문제 |
| --- | --- |
| 디바운스 | 요청이 너무 자주 나가는 문제 |
| AbortController | 오래된 응답이 최신 화면을 덮어쓰는 문제 |

## useGamesSearch 설명

`useGamesSearch`는 게임 목록 데이터 패칭을 담당하는 핵심 훅입니다.

주요 상태는 다음과 같습니다.

| 상태 | 의미 |
| --- | --- |
| `games` | 현재 화면에 보여줄 누적 게임 목록 |
| `status` | 첫 페이지 요청 상태 |
| `error` | 요청 실패 메시지 |
| `hasMore` | 다음 페이지 존재 여부 |
| `isFetchingMore` | 다음 페이지 요청 중 여부 |
| `pageRef` | 현재까지 성공적으로 불러온 page |

검색 조건이 바뀌면 다음 순서로 동작합니다.

```txt
search / ordering / genres 변경
  -> games를 빈 배열로 초기화
  -> page 1 요청
  -> 성공 시 results로 목록 교체
```

무한스크롤에서는 다음 순서로 동작합니다.

```txt
sentinel 노출
  -> loadMore()
  -> 현재 page + 1 요청
  -> 성공 시 기존 games 뒤에 append
```

## useGenres 설명

`useGenres`는 장르 select에 들어갈 옵션 목록을 가져옵니다.

게임 검색 요청과 장르 목록 요청은 목적이 다르기 때문에 훅을 분리했습니다.

- `useGamesSearch`: 검색 결과 데이터
- `useGenres`: 필터 옵션 데이터

이렇게 분리하면 각 훅의 책임이 명확하고, 나중에 장르 UI가 다른 곳에서 필요해져도 재사용하기 쉽습니다.

## 무한스크롤 설명

`useInfiniteScrollTrigger`는 sentinel ref를 반환합니다.

```tsx
{hasMore && <div ref={sentinelRef} />}
```

이 요소가 화면에 들어오면 observer callback이 실행되고, `loadMore()`가 다음 페이지를 요청합니다.

observer는 `enabled`가 true일 때만 연결합니다.

```txt
enabled = hasMore && !isFetchingMore && status !== "loading"
```

그래서 마지막 페이지에 도달했거나 로딩 중일 때는 추가 요청을 막습니다.

## UI 컴포넌트 분리 기준

`ExplorerPage`는 데이터와 URL 흐름을 연결하는 역할만 담당합니다. 실제 카드 UI는 `GameGrid`와 `GameCard`로 분리했습니다.

```txt
ExplorerPage
  -> GameGrid
    -> GameCard
```

이 구조의 장점은 다음과 같습니다.

- 페이지 컴포넌트가 너무 길어지지 않음
- 카드 UI 수정이 데이터 패칭 로직에 영향을 주지 않음
- 나중에 즐겨찾기 버튼을 카드에 붙이기 쉬움

## 현재 한계와 다음 개선

현재 구현은 과제의 핵심 데이터 패칭 흐름을 먼저 잡은 상태입니다. 다음 작업으로는 아래 항목을 진행할 예정입니다.

1. 즐겨찾기 localStorage 구현
2. 같은 page 중복 요청을 더 강하게 막는 ref 추가
3. 필터 영역 레이아웃 정리
4. 앱 화면에 RAWG 출처 표기
5. README에 배포 링크 추가

## 설명할 때 사용할 요약

이 프로젝트는 `useSearchParams`로 검색 조건을 URL에 저장하고, 그 값을 기준으로 `useGamesSearch`가 RAWG API를 호출합니다. 검색어는 400ms 디바운스를 거쳐 URL에 반영되고, 새 요청이 시작되면 이전 요청은 AbortController로 취소합니다. 무한스크롤은 IntersectionObserver가 sentinel을 감지하면 다음 page를 요청하고, 응답 결과를 기존 목록 뒤에 append하는 방식입니다.
