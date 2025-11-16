import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "secondary" | "outline" | "accent" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variantClass =
      variant === "secondary"
        ? "btn secondary"
        : variant === "outline"
        ? "btn outline"
        : variant === "accent"
        ? "btn accent"
        : variant === "ghost"
        ? "btn ghost"
        : "btn";

    const sizeClass = size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : "";

    return <button ref={ref} className={cn(variantClass, sizeClass, className)} {...props} />;
  },
);

Button.displayName = "Button";
