/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type GlobalDialogSize = "md" | "lg" | "xl"
type GlobalDialogMode = "add" | "edit"

interface GlobalDialogOptions {
  mode?: GlobalDialogMode
  title: string
  description?: string
  eyebrow?: string
  breadcrumbs?: string[]
  icon?: ReactNode
  content: ReactNode
  footer?: ReactNode
  size?: GlobalDialogSize
  hideHeaderTitle?: boolean
  onOpenChange?: (open: boolean) => void
}

interface GlobalDialogContextValue {
  openDialog: (options: GlobalDialogOptions) => void
  closeDialog: () => void
  isOpen: boolean
}

const sizeClassName: Record<GlobalDialogSize, string> = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
}

const GlobalDialogContext = createContext<GlobalDialogContextValue | null>(null)

export function GlobalDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<GlobalDialogOptions | null>(null)

  const closeDialog = useCallback(() => {
    setDialog((current) => {
      current?.onOpenChange?.(false)
      return null
    })
  }, [])

  const openDialog = useCallback((options: GlobalDialogOptions) => {
    setDialog(options)
    options.onOpenChange?.(true)
  }, [])

  const value = useMemo(
    () => ({ openDialog, closeDialog, isOpen: Boolean(dialog) }),
    [openDialog, closeDialog, dialog],
  )

  const handleOpenChange = (open: boolean) => {
    if (!open) closeDialog()
  }

  return (
    <GlobalDialogContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(dialog)} onOpenChange={handleOpenChange}>
        {dialog && (
          <DialogContent
            className={cn(
              "max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0 sm:w-[calc(100%-4rem)]",
              sizeClassName[dialog.size ?? "lg"],
            )}
          >
            <DialogHeader className={cn("gap-0 px-6 pt-5 sm:px-8", dialog.hideHeaderTitle ? "pb-2" : "pb-4")}>
              <div className="flex min-h-8 items-center gap-2 pr-10 text-sm text-muted-foreground">
                {dialog.eyebrow && (
                  <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-medium text-foreground">
                    {dialog.eyebrow}
                  </span>
                )}
                {dialog.breadcrumbs?.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <ChevronRight className="size-3.5 text-muted-foreground/70" />
                    <span className="font-medium">{item}</span>
                  </span>
                ))}
              </div>
              {!dialog.hideHeaderTitle ? (
                <div className="mt-10 flex items-start gap-4">
                  {dialog.icon && (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      {dialog.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {dialog.title}
                    </DialogTitle>
                    {dialog.description && (
                      <DialogDescription className="mt-3 text-base font-medium">
                        {dialog.description}
                      </DialogDescription>
                    )}
                  </div>
                </div>
              ) : (
                <DialogTitle className="sr-only">{dialog.title}</DialogTitle>
              )}
            </DialogHeader>
            <div className={cn("min-h-[18rem] overflow-y-auto px-6 pb-6 sm:px-8", dialog.hideHeaderTitle ? "pt-2" : "pt-0")}>
              {dialog.content}
            </div>
            <DialogFooter>
              {dialog.footer ?? (
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  閉じる
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </GlobalDialogContext.Provider>
  )
}

export function useGlobalDialog() {
  const ctx = useContext(GlobalDialogContext)
  if (!ctx) throw new Error("useGlobalDialog must be used within GlobalDialogProvider")
  return ctx
}
