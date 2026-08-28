"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "./input"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** aria-label while the password is hidden (the toggle's action is "show"). */
  showLabel: string
  /** aria-label while the password is visible (the toggle's action is "hide"). */
  hideLabel: string
}

/**
 * A real `<input type="password">` — never swapped for a text element — so
 * autofill/password managers (Keychain, 1Password, Chrome) keep working
 * exactly as before; only the `type` attribute toggles between
 * `"password"` and `"text"` on click. Visibility is per-instance UI state,
 * never persisted anywhere.
 */
function PasswordInput({ className, showLabel, hideLabel, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-9", className)} {...props} />
      {/* Full input height (not the smaller `icon-xs` used for compact inline
          actions elsewhere) so the tap target is a comfortable ~32px square
          on mobile, not just the visual icon size — see item 15 of the brief. */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 rounded-l-none [&_svg]:size-4"
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

export { PasswordInput }
