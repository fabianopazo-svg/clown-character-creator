import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

export default function MarkdownRenderer({ markdown }) {
  return (
    <div className="rulebook-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
