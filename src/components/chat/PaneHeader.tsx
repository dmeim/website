import { IconButton } from "@/ui/react";

type PaneHeaderProps = {
  title: string;
  onOpenSidebar: () => void;
};

export function PaneHeader({ title, onOpenSidebar }: PaneHeaderProps) {
  return (
    <header className="chat-main__header">
      <IconButton icon="list" label="Open sidebar" tooltip={false} className="chat-main__menu" onClick={onOpenSidebar} />
      <div className="chat-main__title-block">
        <h1 className="chat-main__title">{title}</h1>
      </div>
    </header>
  );
}
