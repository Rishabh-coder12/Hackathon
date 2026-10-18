import React from 'react';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  action?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  action,
  children,
  className = '',
  ...props
}) => {
  return (
    <section className={`panel ${className}`.trim()} {...props}>
      {(title || action) && (
        <div className="panel-header">
          {title && <div className="panel-title">{title}</div>}
          {action && <div className="panel-action">{action}</div>}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
};
