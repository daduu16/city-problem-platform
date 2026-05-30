import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { CategoryTreeNode } from '@/lib/categoryTree';
import {
  flattenMatchingCategoryLeaves,
  findLeafCategoryLabel,
} from '@/lib/categoryTree';
import { CategoryTreeView } from '@/components/shared/CategoryTreeView';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type SelectDropdownProps = {
  mode: 'select';
  selectedKey: string | 'ALL';
  onSelectKey: (key: string | 'ALL') => void;
  allLabel: string;
  closeOnSelect?: boolean;
};

type CheckboxDropdownProps = {
  mode: 'checkbox';
  checkedKeys: Record<string, boolean>;
  onToggleKey: (key: string) => void;
  onToggleKeys: (keys: string[], checked: boolean) => void;
  checkboxKeys: string[];
  counts?: Record<string, number>;
  countHint?: string;
  allLabel: string;
  allAriaLabel: string;
};

type Props = {
  tree: CategoryTreeNode[];
  triggerLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
  className?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
} & (SelectDropdownProps | CheckboxDropdownProps);

export function CategoryTreeDropdown(props: Props) {
  const {
    tree,
    triggerLabel,
    searchPlaceholder,
    emptyMessage,
    className,
    contentClassName,
    align = 'start',
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const displayTree = useMemo(() => {
    const q = query.trim();
    if (q) return flattenMatchingCategoryLeaves(tree, q);
    return tree;
  }, [tree, query]);

  const allChecked =
    props.mode === 'checkbox' &&
    props.checkboxKeys.length > 0 &&
    props.checkboxKeys.every((key) => props.checkedKeys[key] === true);

  const someChecked =
    props.mode === 'checkbox' &&
    props.checkboxKeys.some((key) => props.checkedKeys[key] === true);

  const handleSelect = (key: string | 'ALL') => {
    if (props.mode !== 'select') return;
    props.onSelectKey(key);
    if (props.closeOnSelect !== false) {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 w-full min-w-0 justify-between gap-2 font-normal shadow-sm',
            className,
          )}
        >
          <span className="truncate text-left">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn('w-[min(100vw-2rem,20rem)] p-0', contentClassName)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-border/60 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-foreground/50" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-sm"
              aria-label={searchPlaceholder}
            />
          </div>
        </div>

        {props.mode === 'checkbox' && props.checkboxKeys.length > 0 && !query.trim() && (
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <Checkbox
              id="category-dropdown-all"
              checked={
                allChecked ? true : someChecked ? 'indeterminate' : false
              }
              onCheckedChange={() =>
                props.onToggleKeys(props.checkboxKeys, !allChecked)
              }
              aria-label={props.allAriaLabel}
            />
            <Label
              htmlFor="category-dropdown-all"
              className="cursor-pointer text-xs font-normal text-foreground/80"
            >
              {props.allLabel}
            </Label>
          </div>
        )}

        <div className="max-h-56 overflow-y-auto p-2">
          {props.mode === 'select' ? (
            <CategoryTreeView
              mode="select"
              tree={displayTree}
              emptyMessage={emptyMessage}
              selectedKey={props.selectedKey}
              onSelectKey={handleSelect}
              allLabel={props.allLabel}
              defaultExpanded={!!query.trim()}
            />
          ) : (
            <CategoryTreeView
              mode="checkbox"
              tree={displayTree}
              emptyMessage={emptyMessage}
              checkedKeys={props.checkedKeys}
              onToggleKey={props.onToggleKey}
              onToggleKeys={props.onToggleKeys}
              counts={props.counts}
              countHint={props.countHint}
              defaultExpanded={!!query.trim()}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function getSelectCategoryTriggerLabel(
  tree: CategoryTreeNode[],
  selectedKey: string | 'ALL',
  allLabel: string,
): string {
  if (selectedKey === 'ALL') return allLabel;
  return findLeafCategoryLabel(tree, selectedKey) ?? selectedKey;
}

export function getCheckboxCategoryTriggerLabel(
  checkboxKeys: string[],
  checkedKeys: Record<string, boolean>,
  allLabel: string,
  selectedCountLabel: (count: number, total: number) => string,
): string {
  if (checkboxKeys.length === 0) return allLabel;
  const checkedCount = checkboxKeys.filter((k) => checkedKeys[k] === true).length;
  if (checkedCount === 0) return selectedCountLabel(0, checkboxKeys.length);
  if (checkedCount === checkboxKeys.length) return allLabel;
  return selectedCountLabel(checkedCount, checkboxKeys.length);
}
