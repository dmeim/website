import {
  MotionConfigProvider,
  Reveal,
  TextReveal,
} from "../motion";
import "./PageIntro.css";

type PageIntroProps = {
  title: string;
  lede?: string;
  eyebrow?: string;
  className?: string;
  titleId?: string;
};

export function PageIntro({
  title,
  lede,
  eyebrow,
  className = "",
  titleId,
}: PageIntroProps) {
  return (
    <MotionConfigProvider>
      <header className={`page-intro ${className}`.trim()}>
        {eyebrow ? (
          <Reveal delay={0} y={16}>
            <p className="page-intro__eyebrow">{eyebrow}</p>
          </Reveal>
        ) : null}
        <TextReveal
          text={title}
          as="h1"
          className="page-intro__title"
          delay={eyebrow ? 0.08 : 0}
          id={titleId}
        />
        {lede ? (
          <Reveal delay={0.18} y={20}>
            <p className="page-intro__lede">{lede}</p>
          </Reveal>
        ) : null}
      </header>
    </MotionConfigProvider>
  );
}

export type { PageIntroProps };
export default PageIntro;
