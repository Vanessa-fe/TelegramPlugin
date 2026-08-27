import Link from 'next/link';

type MDXComponents = Record<string, React.ComponentType<any>>;

export const mdxComponents: MDXComponents = {
    a: ({ href, children, ...props }) => {
      if (href?.startsWith('http')) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700 font-medium underline decoration-purple-200 hover:decoration-purple-400 transition-colors"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          href={href || '#'}
          className="text-purple-600 hover:text-purple-700 font-medium underline decoration-purple-200 hover:decoration-purple-400 transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    },
    h1: ({ children, ...props }) => (
      <h1
        className="text-4xl lg:text-5xl font-bold mt-12 mb-6 text-gray-900 leading-tight first:mt-0"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-3xl lg:text-4xl font-bold mt-12 mb-5 text-gray-900 pb-3 border-b-2 border-purple-100 leading-tight"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-2xl lg:text-3xl font-bold mt-10 mb-4 text-gray-800 leading-snug"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="text-xl lg:text-2xl font-semibold mt-8 mb-3 text-gray-800 leading-snug"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p className="mb-6 text-lg text-gray-700 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="mb-6 space-y-3 text-lg text-gray-700" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="mb-6 space-y-3 text-lg text-gray-700" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="ml-6 pl-2 relative before:content-[''] before:absolute before:left-[-1.25rem] before:top-[0.6em] before:w-2 before:h-2 before:bg-purple-500 before:rounded-full" {...props}>
        {children}
      </li>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-8 rounded-xl shadow-lg border-2 border-purple-200 bg-white">
        <table className="min-w-full divide-y divide-purple-200" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-gradient-to-r from-purple-600 to-purple-700" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="bg-white divide-y divide-gray-200" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr className="hover:bg-purple-50 transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        className="px-6 py-4 text-left text-sm font-bold text-white tracking-wide whitespace-nowrap"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-6 py-4 text-base text-gray-800 border-r border-gray-100 last:border-r-0" {...props}>
        {children}
      </td>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-purple-500 bg-purple-50 pl-6 pr-6 py-4 my-8 italic text-gray-800 rounded-r-lg shadow-sm"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, ...props }) => (
      <code
        className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono border border-purple-200 font-semibold"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ...props }) => (
      <pre
        className="bg-gradient-to-br from-purple-50 to-purple-100 text-gray-900 p-6 rounded-xl overflow-x-auto my-8 shadow-lg border-2 border-purple-200"
        {...props}
      >
        {children}
      </pre>
    ),
    hr: (props) => (
      <hr className="my-12 border-t-2 border-gray-200" {...props} />
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic text-gray-800" {...props}>
        {children}
      </em>
    ),
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
