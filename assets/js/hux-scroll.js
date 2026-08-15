/*!
 * Hux-style unified scroll controller for Chirpy
 * ------------------------------------------------
 * Hux 테마의 "헤더 <-> TOC 연동" 스크롤 동작을 Chirpy 에 이식하기 위한 골격.
 * 이 파일은 "배관"만 담당한다: 스크롤을 rAF 로 코얼레싱해 상태(state)를 계산하고,
 * 두 훅(applyHeader / applyToc)에 전달한다. 실제 클래스 토글 로직은 다음 단계에서
 * 이 훅 안을 채운다. 현재 훅은 no-op 이라 화면 변화가 없다(안전).
 *
 * - 바닐라 JS (jQuery 미사용)
 * - 스크롤 주체: window (Chirpy 는 :root 에 overflow-y:scroll, 문서 전체 스크롤)
 * - 활성 구간: viewport >= ACTIVE_MIN_WIDTH (현재 lg=850. CSS 미디어쿼리와 일치)
 */
(function () {
  'use strict';

  // 컨트롤러 활성 최소 폭(px). 이 미만에서는 비활성(Chirpy 기본 topbar 유지).
  // ★ CSS 의 플로팅 미디어쿼리 경계와 반드시 일치시킬 것.
  //   전 구간(모바일 포함)에서 플로팅을 켜므로 0 으로 둔다.
  //   (진행 이력: xl=1200 테스트 → lg=850 확장 → 0 전 구간)
  var ACTIVE_MIN_WIDTH = 0;

  // topbar 높이(px). Chirpy $topbar-height = 3rem, :root font-size 16px => 48px.
  // 헤더 방향 로직의 기준 높이로 사용(다음 단계).
  var TOPBAR_HEIGHT = 48;

  var ScrollController = {
    // ---- 런타임 상태 ----
    enabled: false, // 현재 활성 구간(>=xl)인지
    ticking: false, // rAF 예약 여부(프레임당 1회 계산 보장)

    // 스크롤 상태 스냅샷. 훅에 그대로 넘긴다.
    state: {
      prevY: 0, // 직전 프레임의 scrollY (방향 판정용)
      currentY: 0, // 현재 scrollY
      dir: 0, // 스크롤 방향: -1=위로, +1=아래로, 0=변화없음
      atTop: true, // 최상단(scrollY<=0) 여부
      topbarHeight: TOPBAR_HEIGHT
    },

    // ---- 헤더 상태 머신 ----
    // headerState: 'FLOW'(흐름/클래스없음) | 'HIDDEN'(fixed 숨김) | 'VISIBLE'(fixed 보임)
    // latched: "y 가 헤더높이(H)를 지난 적이 있는가" (Hux 의 is-fixed 존재와 1:1)
    //   - false→true : y > H 로 처음 넘어갈 때
    //   - true→false : y == 0 복귀 시
    headerState: 'FLOW',
    latched: false,

    // ---- 훅 포인트 ----
    // 헤더 상태 머신. 설계 전이표를 그대로 구현.
    //
    //   구성: H=헤더높이, y=currentY, dir(up/down), latched(이력 플래그)
    //   상태: FLOW(클래스없음) / HIDDEN(.hux-hidden) / VISIBLE(.hux-visible)
    //
    //   [아래로]
    //     FLOW  + !latched + y ≤ H   → FLOW    (흐름 유지)
    //     FLOW  + !latched + y > H   → HIDDEN  (첫 숨김, 즉시) + latch
    //     VISIBLE          + y > 0   → HIDDEN  (재숨김, 부드럽게)
    //     HIDDEN                     → HIDDEN  (유지)
    //   [위로]
    //     HIDDEN  + y > 0            → VISIBLE (등장, 부드럽게)
    //     VISIBLE + y > 0            → VISIBLE (유지)
    //     (any)   + y == 0           → FLOW    (복귀) + unlatch
    //     FLOW    + y ≤ H            → FLOW    (fresh, 등장 안 함)
    //
    // 다음 상태를 먼저 계산한 뒤, 바뀔 때만 DOM 클래스를 갱신한다.
    applyHeader: function (s) {
      var H = s.topbarHeight;
      var y = s.currentY;
      var next = this.headerState;

      // y == 0 복귀는 방향과 무관하게 항상 FLOW + 이력 리셋 (최우선)
      if (y <= 0) {
        next = 'FLOW';
        this.latched = false;
      } else if (s.dir > 0) {
        // ── 아래로 ──
        if (this.headerState === 'VISIBLE') {
          next = 'HIDDEN'; // 재숨김 (부드럽게 위로)
        } else if (this.headerState === 'HIDDEN') {
          next = 'HIDDEN'; // 유지
        } else {
          // FLOW
          if (y > H) {
            next = 'HIDDEN'; // 첫 숨김 (즉시)
            this.latched = true;
          } else {
            next = 'FLOW'; // 아직 헤더높이 이내
          }
        }
      } else if (s.dir < 0) {
        // ── 위로 ──
        if (this.latched) {
          // 48 지난 이력이 있으면: 숨김이든 보임이든 등장/유지
          next = 'VISIBLE';
        } else {
          // fresh (아직 안 지남): 등장 안 함
          next = 'FLOW';
        }
      }
      // dir === 0 이면 next = 현재 상태 유지

      if (next !== this.headerState) {
        this.headerState = next;
        var cl = document.body.classList;
        cl.remove('hux-hidden');
        cl.remove('hux-visible');
        if (next === 'HIDDEN') {
          cl.add('hux-hidden');
        } else if (next === 'VISIBLE') {
          cl.add('hux-visible');
        }
        // FLOW 는 클래스 없음
      }
    },

    // TOC 위치 기반 2상태 로직이 들어갈 자리. 지금은 no-op.
    applyToc: function (/* state */) {
      /* TODO: fixed 토글 (기준선 통과 판정) */
    },

    // ---- 코어 ----
    // 스크롤 값을 읽어 state 를 갱신하고 훅을 호출. rAF 안에서만 실행된다.
    update: function () {
      var s = this.state;
      s.currentY = window.scrollY || window.pageYOffset || 0;

      if (s.currentY < s.prevY) {
        s.dir = -1; // 위로
      } else if (s.currentY > s.prevY) {
        s.dir = 1; // 아래로
      } else {
        s.dir = 0;
      }
      s.atTop = s.currentY <= 0;

      // 서브시스템에 전달 (현재 no-op)
      this.applyHeader(s);
      this.applyToc(s);

      s.prevY = s.currentY;
      this.ticking = false;
    },

    // 스크롤 이벤트 핸들러: 직접 계산하지 않고 rAF 로 코얼레싱(프레임당 1회).
    onScroll: function () {
      if (!this.enabled) {
        return;
      }
      if (!this.ticking) {
        this.ticking = true;
        window.requestAnimationFrame(this.update.bind(this));
      }
    },

    // 뷰포트 폭 변화 시 활성/비활성 재평가. (위치값 재계산 훅도 여기서 호출 예정)
    onResize: function () {
      var wasEnabled = this.enabled;
      this.enabled = window.innerWidth >= ACTIVE_MIN_WIDTH;

      if (this.enabled && !wasEnabled) {
        // 비활성 -> 활성: 상태를 현재 스크롤로 초기화 후 1회 계산
        this.state.prevY = window.scrollY || window.pageYOffset || 0;
        this.onScroll();
      } else if (!this.enabled && wasEnabled) {
        // 활성 -> 비활성(xl 미만): 헤더 상태를 초기화해 Chirpy 기본으로 되돌린다.
        this.headerState = 'FLOW';
        this.latched = false;
        var cl = document.body.classList;
        cl.remove('hux-hidden');
        cl.remove('hux-visible');
      }
    },

    init: function () {
      // 포스트 본문이 있는 페이지에서만 의미가 있으나, 골격 단계에서는
      // 조건을 느슨히 두고(항상 리스너 등록) 활성 여부만 폭으로 판단한다.
      this.enabled = window.innerWidth >= ACTIVE_MIN_WIDTH;
      this.state.prevY = window.scrollY || window.pageYOffset || 0;

      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
      window.addEventListener('resize', this.onResize.bind(this));

      // 초기 1회 계산(현재 no-op 이라 무해)
      if (this.enabled) {
        this.onScroll();
      }

      // [초기 전환 억제 해제] body.hux-preload 는 첫 페인트 동안 topbar 트랜지션을
      // 꺼두어, 로드 시 "불투명→투명" 페이드가 재생되는 것을 막는다. 여기서 제거해
      // 이후 상태 전환부터 정상 애니메이션이 걸리게 한다.
      // ★ 같은 프레임에 바로 제거하면 브라우저가 초기 스타일 적용과 트랜지션 활성화를
      //   한 번에 처리해 여전히 페이드가 보일 수 있다. 강제 리플로우로 현재(투명) 상태를
      //   확정한 뒤, 다음 프레임에 제거한다.
      var body = document.body;
      if (body.classList.contains('hux-preload')) {
        // 강제 리플로우: 현재 계산된 스타일(트랜지션 꺼진 상태의 투명)을 확정
        void body.offsetHeight;
        requestAnimationFrame(function () {
          body.classList.remove('hux-preload');
        });
      }
    }
  };

  /* ============================================================
   * HeroSearchSync — 검색 열림/닫힘에 맞춰 히어로 헤더 표시 동기화
   * ------------------------------------------------------------
   * [문제] gem 의 검색 로직(search-display.js: ResultSwitch)은 검색이 켜지면
   *   `#main-wrapper>.container>.row` 요소들에 .d-none 을 붙여 본문을 숨긴다.
   *   그러나 우리 히어로(.hux-hero)는 full-bleed 를 위해 .row 밖(.container 직속)
   *   에 두었기에 그 셀렉터에 안 잡혀, 검색 결과 화면에서도 히어로만 남는다.
   *
   * [해법] gem 번들/소스는 건드리지 않는다(번들 전 소스라 재빌드가 필요함).
   *   대신 검색 트리거 요소들은 전부 우리 topbar.html 소유이므로, 여기에 리스너를
   *   추가로 건다. addEventListener 는 누적되므로 gem 리스너와 공존한다(간섭 없음):
   *     · gem 핸들러  → 본문 .row 숨김
   *     · 우리 핸들러 → 히어로 숨김
   *
   * [상태 판단] gem 실행 순서에 의존하지 않도록, gem 의 내부 상태를 읽지 않고
   *   우리 스스로 열림/닫힘을 판단한다(이벤트 기반, 상시 비용 0 — 폴링 아님):
   *     · #search-trigger 클릭            → 열림(모바일: 아이콘 탭)
   *     · #search-cancel  클릭            → 닫힘
   *     · #search-input   입력(값 유무)   → 값 있으면 열림 / 비면 닫힘(데스크톱 경로)
   *   숨김은 .d-none(Bootstrap display:none)을 토글해 gem 방식과 일치시킨다.
   *
   * [안전] 히어로 없는 페이지(.hux-hero 부재)에서는 조용히 no-op.
   * ============================================================ */
  var HeroSearchSync = {
    hero: null,

    setHidden: function (hidden) {
      if (!this.hero) {
        return;
      }
      this.hero.classList.toggle('d-none', hidden);
    },

    init: function () {
      this.hero = document.querySelector('.hux-hero');
      if (!this.hero) {
        return; // 히어로 없는 페이지: 아무것도 하지 않는다
      }

      var trigger = document.getElementById('search-trigger');
      var cancel = document.getElementById('search-cancel');
      var input = document.getElementById('search-input');
      var self = this;

      if (trigger) {
        trigger.addEventListener('click', function () {
          self.setHidden(true);
        });
      }

      if (cancel) {
        cancel.addEventListener('click', function () {
          self.setHidden(false);
        });
      }

      if (input) {
        // gem 의 input 핸들러(search-display.js)와 동일한 분기를 따른다.
        // gem 은 입력이 비었을 때 isMobileView() 로 갈라 동작한다:
        //   · 모바일: 검색을 끄지 않는다(힌트만 복원). 검색 종료는 오직 취소 버튼.
        //   · 데스크톱: ResultSwitch.off() 로 검색을 끈다(입력창이 늘 보이므로).
        // isMobileView() = 취소 버튼(#search-cancel)이 표시 상태(.d-block)인가.
        // => 우리도 이 규칙을 그대로 미러링해, 모바일에서 입력만 비웠을 때
        //    히어로가 되살아나 검색 결과와 겹치는 어긋남을 막는다.
        input.addEventListener('input', function () {
          var isMobileView = cancel && cancel.classList.contains('d-block');
          if (input.value.trim() !== '') {
            self.setHidden(true); // 입력 있음: 검색 켜짐 → 히어로 숨김
          } else if (!isMobileView) {
            self.setHidden(false); // 데스크톱 + 입력 빔: 검색 꺼짐 → 히어로 복원
          }
          // 모바일 + 입력 빔: 검색 유지 → 히어로 계속 숨김(아무것도 안 함)
        });
      }
    }
  };

  function initAll() {
    ScrollController.init();
    HeroSearchSync.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // 디버깅용으로 전역에 노출(다음 단계 튜닝 시 콘솔에서 state 관찰 가능).
  window.HuxScroll = ScrollController;
})();
