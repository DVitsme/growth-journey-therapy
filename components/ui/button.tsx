import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  // min-h keeps every size at or above the 44px touch-target floor (site a11y standard).
  "btn-label inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        solid: "bg-green text-on-green hover:bg-green-deep",
        outline: "border border-green text-green hover:bg-green hover:text-on-green",
        "outline-light": "border border-on-green/70 text-on-green hover:bg-on-green hover:text-green",
        ghost: "text-green hover:bg-panel",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-2.5",
        lg: "px-8 py-3.5",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof button> & { href?: string };

export function Button({ className, variant, size, href, ...props }: ButtonProps) {
  const classes = cn(button({ variant, size }), className);
  if (href) {
    const { type: _t, ...linkProps } = props;
    void _t;
    return (
      <Link href={href} className={classes} {...(linkProps as Omit<React.ComponentProps<typeof Link>, "href">)} />
    );
  }
  return <button className={classes} {...props} />;
}
