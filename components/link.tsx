"use client";

import * as React from "react";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, ...props }, ref) => {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  }
);
Link.displayName = "Link";
