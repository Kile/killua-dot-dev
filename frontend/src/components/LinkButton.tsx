import React from 'react';

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  targetBlank?: boolean;
  rel?: string;
};

const LinkButton: React.FC<LinkButtonProps> = ({ href, children, className = '', targetBlank = true, rel }) => {
  const target = targetBlank ? '_blank' : undefined;
  const relAttr = rel ?? (targetBlank ? 'noopener noreferrer' : undefined);

  return (
    <a href={href} target={target} rel={relAttr} className={className}>
      {children}
    </a>
  );
};

export default LinkButton;


