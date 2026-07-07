# 게임 검색 탐색기 (RAWG API)

fetch + React 기본 훅만으로 만든 게임 검색/필터/무한스크롤/즐겨찾기 앱.
과제 상세 요구사항은 [ASSIGNMENT.md](./ASSIGNMENT.md) 참고.

## 개발 환경 구축

### 1. Node 버전
이 프로젝트는 Vite 최신 버전을 사용하며 **Node 18 이상**이 필요합니다. `.nvmrc`에 `22.13.1`을 지정해 두었습니다.

```bash
# nvm 사용 시
nvm use

# fnm 사용 시
fnm use
```

### 2. 의존성 설치
```bash
npm install
```

### 3. RAWG API 키 발급
1. https://rawg.io/apidocs 에서 계정 생성 후 API 키 발급 (무료)
2. 개인/취미/소규모 프로젝트는 무료지만 RAWG 출처 표기 조건이 있음 — 화면 하단 등에 "Powered by RAWG" 문구 필요

### 4. 환경 변수 설정
`.env.example`을 복사해서 `.env`를 만들고 발급받은 키를 넣습니다.
```bash
cp .env.example .env
```
```
VITE_RAWG_API_KEY=발급받은_키
VITE_RAWG_BASE_URL=https://api.rawg.io/api
```
- Vite는 `VITE_` 접두사가 붙은 변수만 클라이언트 번들에 노출합니다.
- 주의: 클라이언트 앱이라 키는 어차피 네트워크 탭/번들에 노출됩니다. 환경 변수 분리는 **하드코딩 방지** 목적이지 비밀 유지 목적이 아닙니다(RAWG 무료 키는 공개 키로 취급).

### 5. 개발 서버 실행
```bash
npm run dev
```

### 6. 빌드/배포
```bash
npm run build
```
Vercel/Netlify 등에 배포 시, 대시보드의 환경 변수 설정에도 `VITE_RAWG_API_KEY`를 동일하게 등록해야 합니다.

## 프로젝트 구조 (예정)
```
src/
  lib/rawg.ts              # RAWG API 클라이언트 함수 (searchGames, getGenres)
  features/games/
    hooks/useGamesSearch.ts       # 검색+필터+페이지네이션+abort 로직
    hooks/useDebouncedValue.ts
    hooks/useInfiniteScrollTrigger.ts
    components/GameGrid.tsx
    components/GameCard.tsx
    components/FilterBar.tsx
  features/favorites/
    hooks/useFavorites.ts   # localStorage 동기화
  routes/
    ExplorerPage.tsx
```

## 상태 관리 / 요청 취소 / 무한스크롤 (작성 예정)
> 구현 완료 후, 아래 항목을 채워서 제출하세요.

- 로딩/에러/빈 결과/성공 상태를 어떻게 나눴는지
- AbortController로 취소 처리한 방식과, `AbortError`를 에러로 취급하지 않은 이유
- 무한스크롤 종료 조건과 중복 호출 방지 가드
- URL을 상태의 단일 소스로 뒀는지, 로컬 state와 동기화했는지와 그 근거 (page를 URL에서 제외한 이유 포함)
- 더 시간이 있었다면 손보고 싶은 점

## Powered by RAWG
이 프로젝트는 [RAWG Video Games Database API](https://rawg.io)의 데이터를 사용합니다.
