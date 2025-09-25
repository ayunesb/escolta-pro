// src/types/ui.ts
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

export type RechartsTooltipProps = TooltipProps<ValueType, NameType>;

export type Id = string & { readonly brand: unique symbol };

export type FileLike = File | Blob;

export type ChangeEvt<T extends EventTarget> = React.ChangeEvent<T>;
