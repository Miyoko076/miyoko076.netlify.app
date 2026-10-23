# Parses markdown inside listed HTML tags without kramdown's site-wide parse_block_html.
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

# Only while a page's own markdown is converted, not when markdownify re-reads rendered HTML.
Jekyll::Hooks.register [:documents, :pages], :pre_render do |doc|
  ext = doc.respond_to?(:extname) ? doc.extname : doc.ext
  MarkdownInHtml.active = ext.to_s.match?(/\A\.(md|markdown)\z/i)
end

Jekyll::Hooks.register [:documents, :pages], :post_convert do
  MarkdownInHtml.active = false
end
