# SK하이닉스 IR 실적발표 일정 검증

- 마지막 확인: 2026-09-29 16:02:08 KST (Asia/Seoul)
- 데이터 변동: 없음. `src/data/events.json`의 공식 확정 일정과 일치함.
- 공식 IR 최신 일정: 2026년 2분기 실적발표 — **2026-07-29 09:00 KST**. 공식 IR에서 확인된 향후 실적발표 일정은 없음.
- 토스증권 비교: 동적 캘린더의 국내 실적 항목에서 SK하이닉스 **2026-07-29** 확인. 공식 IR 및 `src/data/events.json`과 일치. 향후 SK하이닉스 일정은 표시되지 않음.
- 저장소의 향후 예상 일정: 2026년 3분기 2026-10-26, 2026년 4분기 2027-01-25. 두 날짜 모두 공식 확정 일정이 아님.

## 실행 이력

### 2026-09-29 16:02:08 KST

- 확인한 URL: [SK하이닉스 공식 IR Event](https://www.skhynix.com/ir/UI-FR-IR10), [Euroland AllEvents JSON](https://asia.tools.euroland.com/tools/FinCalendar2/Home/AllEvents?companyCode=kr-000660&lang=en-gb&CurrentPage=1&RowPerPage=200&SortOrder=DESC&v=redesign), [토스증권 증시 캘린더](https://www.tossinvest.com/calendar).
- 기존 데이터와의 차이: Euroland 응답의 `type: Earnings Release` 12건이 저장소의 SK하이닉스 확정 일정 12건과 날짜 및 시각까지 일치. 최신 일정은 2026-07-29 09:00 KST이며 향후 확정 일정은 없음. 토스증권의 2026-07-29 표시도 일치.
- 수행한 조치: 원격 `main`을 fast-forward 확인 후 동기화(이미 최신). 일정 데이터는 유지하고 검증 로그를 작성.
- 오류: 없음.
