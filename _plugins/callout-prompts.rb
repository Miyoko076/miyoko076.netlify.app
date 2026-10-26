# Turns Notion callouts with a prompt custom emoji (`> :prompt-tip: > body`) into Chirpy prompts.
require 'kramdown'

module CalloutPrompts
  PROMPTS = %w[prompt-tip prompt-info prompt-warning prompt-danger].freeze
  ICON = /\A[ \t]*:([\w-]+):[ \t]*>[ \t]?/ # ":prompt-tip: > " before the body

  def convert_blockquote(el, indent)
    para = el.children.first
    text = para.children.first if para&.type == :p
    match = text.value.match(ICON) if text&.type == :text
    if match && PROMPTS.include?(match[1])
      text.value = text.value.delete_prefix(match[0])
      el.children.shift if text.value.empty? && para.children.size == 1 # no body
      el.attr['class'] = [match[1], el.attr['class']].compact.join(' ')
    end
    super
  end
end

Kramdown::Converter::Html.prepend(CalloutPrompts)
