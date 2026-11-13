# 부품 구현 메모

모든 부품은 `templates/cue-sheet/app.js`에 실제 코드가 있다. 새 페이지에서는 그 함수를 복사해 쓴다.

## 한국 시간
```js
const kstParts = ms => { const d = new Date(ms + 9*3600e3); return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]; };
// "14:05" + 날짜 → 실제 시각(ms)
const kstMs = (date, hm) => { const [y,m,d] = date.split("-").map(Number); const [h,mi] = hm.split(":").map(Number); return Date.UTC(y, m-1, d, h-9, mi); };
```

## CSV 읽기
`parseCSV(text)` — 따옴표·쉼표·줄바꿈 처리, 첫 줄 한글 제목을 키로 하는 객체 배열을 돌려준다. BOM 제거 포함(엑셀에서 저장한 CSV 대비).

## 화면 켜짐 유지
`navigator.wakeLock.request("screen")`. 화면을 껐다 켜면 풀리므로 `visibilitychange`에서 다시 요청. 실패하면 “기기의 자동 잠금 시간을 늘려 주세요” 안내.

## 체크리스트 저장
`localStorage`에 `"cue-check:" + location.pathname` 키로 저장 → 행사 폴더마다 따로 저장된다.

## 보조 타이머
끝나면 `.timer.done` 클래스로 3번 깜빡임. 소리는 쓰지 않는다(현장 진행 방해).
