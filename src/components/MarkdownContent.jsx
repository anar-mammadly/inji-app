import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Rendered journal markdown: regular-weight body at a comfortable size and
// line length, candy-colored accents for markers, links and inline code.
export default function MarkdownContent({ text }) {
  return (
    <div className="max-w-[68ch] text-[15px] font-medium text-textPrimary leading-relaxed break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <div className="text-[19px] leading-snug font-extrabold mt-4 mb-1.5" {...props} />,
          h2: ({ node, ...props }) => <div className="text-[17px] leading-snug font-extrabold mt-3.5 mb-1.5" {...props} />,
          h3: ({ node, ...props }) => <div className="text-[15px] leading-snug font-extrabold mt-3 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 flex flex-col gap-1 marker:text-accent" {...props} />,
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 mb-2 flex flex-col gap-1 marker:text-accentDark marker:font-bold" {...props} />
          ),
          li: ({ node, ...props }) => <li className="pl-0.5" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-extrabold" {...props} />,
          a: ({ node, ...props }) => (
            <a
              className="font-semibold text-blueDark underline decoration-2 underline-offset-2 decoration-blue/40 hover:decoration-blue"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="my-2 rounded-r-xl border-l-4 border-purple bg-purpleSoft/60 py-1.5 pl-3 pr-2 text-textSecondary" {...props} />
          ),
          pre: ({ node, ...props }) => (
            <pre
              className="my-2.5 overflow-x-auto rounded-2xl border-2 border-[#1B1D29] bg-[#232634] p-3.5 text-[13px] leading-relaxed text-[#E2E4F3] font-mono"
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }) => {
            const isBlock = /language-/.test(className || '') || String(children).includes('\n')
            if (isBlock) {
              return (
                <code className={`font-mono ${className || ''}`} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-pomSoft text-coralDark text-[13px] font-mono" {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
