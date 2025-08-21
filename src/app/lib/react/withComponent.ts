import React, { forwardRef, memo } from "react";
import type {
  ForwardRefExoticComponent,
  MemoExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from "react";

export type RenderFn<T, P = Record<string, never>> = (
  props: PropsWithoutRef<P>,
  ref: React.Ref<T>
) => React.ReactElement | null;

export type MemoComparator<T, P> = (
  prev: Readonly<PropsWithoutRef<P> & RefAttributes<T>>,
  next: Readonly<PropsWithoutRef<P> & RefAttributes<T>>
) => boolean;

export type MemoOption<T, P> = boolean | MemoComparator<T, P>;

export interface WithComponentOptions<
  T,
  P,
  S extends Record<string, unknown> = Record<string, never>
> {
  displayName?: string;
  memo?: MemoOption<T, P>;
  statics?: S;
}

type FR<T, P> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<T>
>;
type MaybeMemoFR<T, P> = FR<T, P> | MemoExoticComponent<FR<T, P>>;

export function withComponent<
  T,
  P,
  S extends Record<string, unknown> = Record<string, never>
>(render: RenderFn<T, P>, options?: WithComponentOptions<T, P, S>) {
  const { displayName, memo: memoOption = true, statics } = options ?? {};

  const Forwarded = forwardRef<T, P>(render);

  if (process.env.NODE_ENV !== "production") {
    Forwarded.displayName = displayName ?? render.name ?? "Component";
  }

  let Component: MaybeMemoFR<T, P>;
  if (memoOption === false) {
    Component = Forwarded;
  } else if (typeof memoOption === "function") {
    Component = memo(Forwarded, memoOption);
  } else {
    Component = memo(Forwarded);
  }

  // Chuẩn hoá kiểu trả về về FR<T,P> & S để dùng nhất quán bên ngoài
  const Result = Component as unknown as FR<T, P> & S;

  if (statics) {
    Object.assign(Result as unknown as object, statics as unknown as object);
  }

  return Result;
}

export function defineComponent<
  T,
  P,
  S extends Record<string, unknown> = Record<string, never>
>(
  render: RenderFn<T, P>,
  displayName?: string,
  memoOption: MemoOption<T, P> = true,
  statics?: S
) {
  return withComponent<T, P, S>(render, {
    displayName,
    memo: memoOption,
    statics,
  });
}

export type WithRef<T, P> = FR<T, P>;
