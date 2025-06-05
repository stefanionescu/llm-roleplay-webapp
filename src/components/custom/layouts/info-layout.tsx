import { marked } from 'marked';

type InfoLayoutProps = {
    markdown: string;
};

export const InfoLayout = ({
    markdown,
}: InfoLayoutProps) => {
    const titleMatch = /# (.*?)\n/.exec(markdown);
    const dateMatch = /\*Last Updated: (.*?)\*/.exec(
        markdown,
    );

    const title = titleMatch
        ? titleMatch[1]
        : 'Privacy Policy';
    const date = dateMatch
        ? dateMatch[1]
        : new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          });

    const contentWithoutTitleAndDate = markdown
        .replace(/# .*?\n/, '')
        .replace(/\*Last Updated: .*?\*\n\n/, '');

    const preRenderedHtml = marked.parse(
        contentWithoutTitleAndDate,
        {
            async: false,
        },
    );

    return (
        <div
            className={`w-full flex-1 overflow-y-auto pt-16`}
        >
            <div
                className={`mx-auto max-w-[900px] px-12 pt-8`}
            >
                <div className="mb-2 text-center">
                    <h1
                        className={`text-2xl font-bold text-white md:text-3xl`}
                    >
                        {title}
                    </h1>

                    <div
                        className={`mt-1 text-sm text-zinc-400 md:text-base`}
                    >
                        Last Updated: {date}
                    </div>

                    <hr className="my-2 border-zinc-800" />
                </div>

                <div
                    className={`prose prose-sm prose-invert mb-8 mt-4 max-w-[900px] prose-a:text-blue-400`}
                    dangerouslySetInnerHTML={{
                        __html: preRenderedHtml,
                    }}
                />
            </div>
        </div>
    );
};
