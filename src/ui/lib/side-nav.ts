export interface SideNavItem {
  id: string;
  href?: string;
  label: string;
  badge?: string;
  disabled?: boolean;
  current?: boolean;
}

export interface SideNavSection {
  id: string;
  title: string;
  badge?: string;
  count?: number;
  collapsible?: boolean;
  open?: boolean;
  items: SideNavItem[];
}
