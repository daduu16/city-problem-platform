import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryTreeNode } from '@/lib/categoryTree';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type CheckboxProps = {
  mode: 'checkbox';
  checkedKeys: Record<string, boolean>;
  onToggleKey: (key: string) => void;
  onToggleKeys: (keys: string[], checked: boolean) => void;
  counts?: Record<string, number>;
  countHint?: string;
};

type SelectProps = {
  mode: 'select';
  selectedKey: string | 'ALL';
  onSelectKey: (key: string | 'ALL') => void;
  allLabel: string;
};

type Props = {
  tree: CategoryTreeNode[];
  emptyMessage: string;
  defaultExpanded?: boolean;
} & (CheckboxProps | SelectProps);

function collectLeafKeys(node: CategoryTreeNode): string[] {
  if (!node.children?.length) return [node.key];
  return node.children.flatMap(collectLeafKeys);
}

function groupCheckState(
  keys: string[],
  checkedKeys: Record<string, boolean>,
): boolean | 'indeterminate' {
  if (keys.length === 0) return false;
  const checkedCount = keys.filter((k) => checkedKeys[k] === true).length;
  if (checkedCount === 0) return false;
  if (checkedCount === keys.length) return true;
  return 'indeterminate';
}

function TreeGroup({
  node,
  depth,
  isNodeExpanded,
  onToggleExpand,
  props,
}: {
  node: CategoryTreeNode;
  depth: number;
  isNodeExpanded: (key: string) => boolean;
  onToggleExpand: (key: string) => void;
  props: Props;
}) {
  const leafKeys = collectLeafKeys(node);
  const isOpen = isNodeExpanded(node.key);

  if (node.children?.length) {
    const checkState =
      props.mode === 'checkbox'
        ? groupCheckState(leafKeys, props.checkedKeys)
        : false;

    return (
      <div className="space-y-1">
        <div
          className="flex items-center gap-1"
          style={{ paddingLeft: depth * 12 }}
        >
          <button
            type="button"
            onClick={() => onToggleExpand(node.key)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-foreground/70 hover:bg-muted/60 hover:text-foreground"
            aria-expanded={isOpen}
            aria-label={node.label}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          {props.mode === 'checkbox' && (
            <Checkbox
              id={`cat-group-${node.key}`}
              checked={checkState}
              onCheckedChange={() =>
                props.onToggleKeys(leafKeys, checkState !== true)
              }
              className="shrink-0"
            />
          )}
          <Label
            htmlFor={props.mode === 'checkbox' ? `cat-group-${node.key}` : undefined}
            className={cn(
              'min-w-0 flex-1 cursor-pointer py-0.5 text-sm font-medium text-foreground',
              props.mode === 'select' && 'cursor-default font-semibold',
            )}
            onClick={
              props.mode === 'select' ? () => onToggleExpand(node.key) : undefined
            }
          >
            {node.label}
          </Label>
        </div>
        {isOpen && (
          <div className="space-y-1">
            {node.children.map((child) => (
              <TreeNode
                key={child.key}
                node={child}
                depth={depth + 1}
                isNodeExpanded={isNodeExpanded}
                onToggleExpand={onToggleExpand}
                props={props}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <TreeLeaf node={node} depth={depth} props={props} leafKeys={leafKeys} />
  );
}

function TreeLeaf({
  node,
  depth,
  props,
  leafKeys,
}: {
  node: CategoryTreeNode;
  depth: number;
  props: Props;
  leafKeys: string[];
}) {
  void leafKeys;
  if (props.mode === 'select') {
    const selected = props.selectedKey === node.key;
    return (
      <button
        type="button"
        onClick={() => props.onSelectKey(node.key)}
        className={cn(
          'flex w-full items-center rounded-md py-1 pr-2 text-left text-sm transition-colors',
          selected
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-foreground hover:bg-muted/50',
        )}
        style={{ paddingLeft: depth * 12 + 28 }}
      >
        {node.label}
      </button>
    );
  }

  const checked = props.checkedKeys[node.key] === true;
  const count = props.counts?.[node.key] ?? 0;

  return (
    <div
      className="flex items-center gap-2"
      style={{ paddingLeft: depth * 12 + 28 }}
    >
      <Checkbox
        id={`cat-${node.key}`}
        checked={checked}
        onCheckedChange={() => props.onToggleKey(node.key)}
        className="shrink-0"
      />
      <Label
        htmlFor={`cat-${node.key}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal text-foreground"
      >
        <span className="truncate">{node.label}</span>
        {props.counts && (
          <span
            className="shrink-0 tabular-nums text-foreground/65"
            title={props.countHint}
          >
            {count}
          </span>
        )}
      </Label>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  isNodeExpanded,
  onToggleExpand,
  props,
}: {
  node: CategoryTreeNode;
  depth: number;
  isNodeExpanded: (key: string) => boolean;
  onToggleExpand: (key: string) => void;
  props: Props;
}) {
  if (node.children?.length) {
    return (
      <TreeGroup
        node={node}
        depth={depth}
        isNodeExpanded={isNodeExpanded}
        onToggleExpand={onToggleExpand}
        props={props}
      />
    );
  }
  return (
    <TreeLeaf
      node={node}
      depth={depth}
      props={props}
      leafKeys={[node.key]}
    />
  );
}

export function CategoryTreeView(props: Props) {
  const { tree, emptyMessage, defaultExpanded = true } = props;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: prev[key] === false,
    }));
  };

  const isNodeExpanded = (key: string) =>
    expanded[key] !== undefined ? expanded[key] !== false : defaultExpanded;

  if (tree.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-foreground/70">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-1">
      {props.mode === 'select' && (
        <button
          type="button"
          onClick={() => props.onSelectKey('ALL')}
          className={cn(
            'mb-1 flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            props.selectedKey === 'ALL'
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-foreground hover:bg-muted/50',
          )}
        >
          {props.allLabel}
        </button>
      )}
      {tree.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          depth={0}
          isNodeExpanded={isNodeExpanded}
          onToggleExpand={toggleExpand}
          props={props}
        />
      ))}
    </div>
  );
}
