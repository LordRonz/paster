import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Wrap clsx with tailwind merge */
const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export default cn;
