import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownContent({ text }) {
  return (
    <div className="text-[13px] font-semibold text-textPrimary leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <div className="text-[16px] font-extrabold mt-2.5 mb-1" {...props} />,
          h2: ({ node, ...props }) => <div className="text-[14px] font-extrabold mt-2.5 mb-1" {...props} />,
          h3: ({ node, ...props }) => <div className="text-[13px] font-extrabold mt-2 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-1.5 flex flex-col gap-0.5 marker:text-accent" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-1.5 flex flex-col gap-0.5 marker:text-accent marker:font-bold" {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          strong: ({ node, ...props }) => <strong className="font-extrabold" {...props} />,
          a: ({ node, ...props }) => <a className="text-accent underline" target="_blank" rel="noreferrer" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-accentSoft pl-3 my-1.5 text-textSecondary" {...props} />
          ),
          pre: ({ node, ...props }) => (
            <pre
              className="rounded-xl bg-[#232634] text-[#E2E4F3] p-3 my-2 overflow-x-auto text-[12px] font-mono leading-relaxed"
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
              <code className="px-1.5 py-0.5 rounded-md bg-surfaceAlt text-coral text-[12px] font-mono" {...props}>
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
