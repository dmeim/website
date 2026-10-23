import { PageHeader } from "@/ui/react";

type PageIntroProps = {
  title: string;
  lede?: string;
  eyebrow?: string;
  className?: string;
  titleId?: string;
};

/** Legacy entry point; renders the library PageHeader. */
export function PageIntro({ title, lede, eyebrow, className = "", titleId }: PageIntroProps) {
  return (
    <PageHeader
      className={`page-intro ${className}`.trim()}
      eyebrow={eyebrow}
      title={title}
      titleId={titleId}
      lede={lede}
    />
  );
}

export type { PageIntroProps };
export default PageIntro;
