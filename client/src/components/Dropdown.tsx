import type { SelectHTMLAttributes } from 'react';

type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function Dropdown({ label, children, ...props }: DropdownProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}
