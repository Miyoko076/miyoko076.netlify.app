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
 * - 활성 구간: viewport >= XL_BREAKPOINT (Hux 의 MQL=1170 에 대응하는 Chirpy xl=1200)
 */
(function () {
  'use strict';

  // Chirpy xl 브레이크포인트. Hux 의 MQL(1170) 대응. 이 미만에서는 컨트롤러 비활성.
  var XL_BREAKPOINT = 1200;

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
      this.enabled = window.innerWidth >= XL_BREAKPOINT;

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
      this.enabled = window.innerWidth >= XL_BREAKPOINT;
      this.state.prevY = window.scrollY || window.pageYOffset || 0;

      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
      window.addEventListener('resize', this.onResize.bind(this));

      // 초기 1회 계산(현재 no-op 이라 무해)
      if (this.enabled) {
        this.onScroll();
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      ScrollController.init();
    });
  } else {
    ScrollController.init();
  }

  // 디버깅용으로 전역에 노출(다음 단계 튜닝 시 콘솔에서 state 관찰 가능).
  window.HuxScroll = ScrollController;
})();
