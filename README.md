# 반도체 실적 캘린더

삼성전자와 SK하이닉스의 분기 실적발표 일정을 공식 IR 자료에서 수집해 보여주는 월간 캘린더입니다.

## 주요 기능

- 최근 12개월의 확정 일정과 향후 2개 분기 일정 표시
- 기업별 필터, 월 이동, 오늘 이동, 날짜별 상세 정보
- 확정 일정과 과거 발표 패턴 기반 예상 일정 구분
- 공식 IR 데이터를 매일 자동 확인하고 GitHub Pages에 배포

## 로컬 실행

```bash
npm install
npm run update:data
npm run dev
```

테스트와 프로덕션 빌드는 다음 명령으로 확인합니다.

```bash
npm test
npm run build
```

## 데이터 출처

- [삼성전자 IR Events](https://www.samsung.com/global/ir/ir-events-presentations/events/)
- [SK하이닉스 IR Event](https://www.skhynix.com/ir/UI-FR-IR10)

예상 일정은 최근 3년 동일 분기의 공식 발표 패턴을 사용하며 실제 일정과 다를 수 있습니다.
