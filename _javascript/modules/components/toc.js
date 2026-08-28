import { TocMobile as mobile } from './toc/toc-mobile';
import { TocDesktop as desktop } from './toc/toc-desktop';

/* 좌측 사이드바 제거로 CSS 우측 패널(TOC) 전환 경계를 1200→850 으로
   당겼다(assets/css/jekyll-theme-chirpy.scss 의 body:not(.has-sidebar)).
   여기 desktopMode 도 같은 값이어야 850~1199 에서 빈 패널이 안 뜬다.
   ★ CSS 경계를 조정하면 이 값도 반드시 함께 맞출 것. */
const desktopMode = matchMedia('(min-width: 850px)');

function refresh(e) {
  if (e.matches) {
    if (mobile.popupOpened) {
      mobile.hidePopup();
    }

    desktop.refresh();
  } else {
    mobile.refresh();
  }
}

function init() {
  if (document.querySelector('main>article[data-toc="true"]') === null) {
    return;
  }

  // Avoid create multiple instances of Tocbot. Ref: <https://github.com/tscanlin/tocbot/issues/203>
  if (desktopMode.matches) {
    desktop.init();
  } else {
    mobile.init();
  }

  const $tocWrapper = document.getElementById('toc-wrapper');
  $tocWrapper.classList.remove('invisible');

  desktopMode.onchange = refresh;
}

export { init as initToc };
