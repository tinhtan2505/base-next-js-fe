import React from "react";
import type { MenuProps } from "antd";
import type { AppMenuItem } from "./menu.config";

/** Kiểu node sau khi "trải phẳng" */
type FlatNode = { item: AppMenuItem; parents: string[] };

/** Trải phẳng cây để suy ra danh sách cha (parents) */
function flatten(items: AppMenuItem[], parents: string[] = []): FlatNode[] {
  return items.flatMap((it) => {
    const node: FlatNode = { item: it, parents };
    const children = it.children
      ? flatten(it.children, [...parents, it.key])
      : [];
    return [node, ...children];
  });
}

function isMatch(pathname: string, item: AppMenuItem) {
  if (item.exact) return pathname === item.key;
  return (
    pathname === item.key ||
    pathname.startsWith(item.key.endsWith("/") ? item.key : item.key + "/")
  );
}

export function findBestMatch(pathname: string, items: AppMenuItem[]) {
  const flat = flatten(items);
  const matches = flat
    .filter(({ item }) => !item.hidden && isMatch(pathname, item))
    .sort((a, b) => b.item.key.length - a.item.key.length);

  if (!matches.length)
    return { key: null as string | null, parents: [] as string[] };
  const best = matches[0];
  return { key: best.item.key, parents: best.parents };
}

/** Kiểu item của antd Menu */
type AntdItem = Required<MenuProps>["items"][number];
/** Type guard để lọc null một cách an toàn */
function isTruthy<T>(x: T | null | undefined): x is T {
  return Boolean(x);
}

export function buildAntdItems(items: AppMenuItem[]): MenuProps["items"] {
  const mapItem = (it: AppMenuItem): AntdItem | null => {
    if (it.hidden) return null;

    const iconNode = it.icon ? React.createElement(it.icon) : undefined;

    if (it.children?.length) {
      return {
        key: it.key,
        label: it.label,
        icon: iconNode,
        children: it.children.map(mapItem).filter(isTruthy) as AntdItem[],
      };
    }
    return { key: it.key, label: it.label, icon: iconNode };
  };

  return items.map(mapItem).filter(isTruthy);
}
