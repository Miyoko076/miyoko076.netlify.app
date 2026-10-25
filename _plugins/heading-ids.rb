# Gives headings inside HTML (e.g. toggle titles in <summary>) the same GFM ids as markdown headings.
require 'cgi'
require 'kramdown'
require 'kramdown-parser-gfm'

module HeadingIds
  HEADING = /\Ah[1-6]\z/

  # GFM skips HTML elements when it gives headings ids, so give all headings ids first,
  # in document order with its own generator and counter.
  def update_elements(element)
    assign_heading_ids(element) if @options[:auto_ids] && element.equal?(@root)
    super
  end

  private

  def assign_heading_ids(element)
    element.children.each do |child|
      html_heading = child.type == :html_element && child.value.match?(HEADING)
      if child.type == :header || html_heading
        next if child.attr.key?('id')
        text = html_heading ? CGI.unescapeHTML(update_raw_text(child)) : child.options[:raw_text]
        child.attr['id'] = generate_gfm_header_id(text)
      else
        assign_heading_ids(child)
      end
    end
  end
end

Kramdown::Parser::GFM.prepend(HeadingIds)
