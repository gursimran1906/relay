import * as React from 'react'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    {...props}
  />
))
Card.displayName = 'Card'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`p-4 ${className}`}
    {...props}
  />
))
CardContent.displayName = 'CardContent'

export { Card, CardContent }
