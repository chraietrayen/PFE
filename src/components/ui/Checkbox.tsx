import { InputHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "w-4 h-4 rounded border-gray-300 text-violet-600",
            "focus:ring-violet-500 focus:ring-2 cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <span className="text-sm text-gray-600">{label}</span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = "Checkbox"