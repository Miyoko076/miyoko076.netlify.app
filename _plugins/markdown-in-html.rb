# Parses markdown inside listed HTML tags without kramdown's site-wide parse_block_html.
require 'set'
require 'kramdown'
require 'kramdown-parser-gfm'

module MarkdownInHtml
  # Tag => kramdown markdown attribute ("1": block content, "span": inline content).
  MODES = {
    'details'    => '1',
    'figcaption' => 'span',
  }.freeze

  class << self
    attr_accessor :active
    attr_writer :sources

    def sources
      @sources ||= Set.new
    end

    def markdown?(doc)
      doc.site.find_converter_instance(Jekyll::Converters::Markdown).matches(doc.extname)
    end
  end

  def handle_kramdown_html_tag(el, closed, handle_body)
    mode = MarkdownInHtml.active && MODES[el.value]
    # Block mode needs the closing tag on its own line, so one-line blocks stay raw HTML.
    one_line_block = mode == '1' && @src.check(/[^\n]*<\/#{el.value}\s*>/i)
    el.attr['markdown'] = mode if mode && !one_line_block && !el.attr.key?('markdown')
    super
  end
end

Kramdown::Parser::GFM.prepend(MarkdownInHtml)

module MarkdownInHtmlConvert
  def convert(content)
    own_page = MarkdownInHtml.active
    # A page's raw markdown (e.g. markdownify in a related-post preview) is converted like the page itself.
    MarkdownInHtml.active = true if MarkdownInHtml.sources.include?(content)
    return super if MarkdownInHtml.active
    setup
    @parser.convert(content) # rendered HTML read again: no plugin, no cache
  ensure
    MarkdownInHtml.active = own_page
  end
end

Jekyll::Converters::Markdown.prepend(MarkdownInHtmlConvert)

# Every markdown page's source, so a preview converting it is treated like the page itself.
Jekyll::Hooks.register :site, :pre_render do |site|
  MarkdownInHtml.sources = (site.documents + site.pages)
    .select { |doc| MarkdownInHtml.markdown?(doc) }
    .to_set { |doc| doc.content.to_s.dup.freeze }
end

# Only while a page's own markdown is converted, not when markdownify re-reads rendered HTML.
Jekyll::Hooks.register [:documents, :pages], :pre_render do |doc|
  MarkdownInHtml.active = MarkdownInHtml.markdown?(doc)
end

Jekyll::Hooks.register [:documents, :pages], :post_convert do
  MarkdownInHtml.active = false
end
