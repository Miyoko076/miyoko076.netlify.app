export class TocDesktop {
  /* Tocbot options Ref: https://github.com/tscanlin/tocbot#usage */
  static options = {
    tocSelector: '#toc',
    contentSelector: '.content',
    // Headings in quotes and callouts stay out of the TOC; of headings in toggles, only top-level toggle titles go in.
    ignoreSelector: '[data-toc-skip], blockquote *, details :not(.content > details > summary *)',
    headingSelector: 'h2, h3, h4',
    orderedList: false,
    scrollSmooth: false,
    headingsOffset: 16 * 2 // 2rem
  };

  static refresh() {
    tocbot.refresh(this.options);
  }

  static init() {
    tocbot.init(this.options);
  }
}
