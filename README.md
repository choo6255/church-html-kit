# church-html-kit

교회·교육 사역에 쓰는 휴대폰용 HTML 페이지 모음입니다.

## 폴더 구성
- `skill/` — 작업 기준(디자인·부품·문구·배포). Claude가 작업 전에 읽습니다.
- `templates/` — 종류별 틀. 코드는 그대로 두고 내용만 바꿔 씁니다.
  - `cue-sheet/` 행사 큐시트·진행 도우미
  - `devotional/` 교사 묵상 (준비 중)
- `projects/` — 실제 결과물. 행사·페이지마다 폴더 하나.

## 새 행사 큐시트를 만들 때
Claude Code에 이렇게 말하면 됩니다.
> 큐시트 틀로 새 행사 페이지 만들어 줘. 행사 이름은 ○○, 날짜는 ○○. 순서표는 이거야. (표 붙여 넣기)

직접 고칠 때는 `data/` 폴더만 엽니다.
- `event.json` 행사 이름·날짜
- `cues.csv` 순서표 (엑셀에서 열고 고친 뒤 CSV로 저장)
- `checklist.csv` 물품 목록

## 색 바꾸기
`theme.css` 맨 위 6줄만 바꾸면 됩니다. 아래쪽에 예시 팔레트가 있습니다.

## 주소
`https://choo6255.github.io/church-html-kit/projects/폴더이름/`
