import * as React from "react"
import { Check, ChevronsUpDown, Search, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ComboboxProps {
  options: { label: string; value: string }[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  onCreateOptionQuick?: (search: string) => void
  onCreateOptionDetail?: (search: string) => void
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "選択してください...",
  searchPlaceholder,
  emptyText = "見つかりません",
  className,
  onCreateOptionQuick,
  onCreateOptionDetail,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = options.find((option) => option.value === value)

  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === search.trim().toLowerCase()
  )

  const defaultSearchPlaceholder = searchPlaceholder ?? (
    onCreateOptionQuick || onCreateOptionDetail
      ? "検索または新規追加..."
      : "検索..."
  )

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-8 text-xs font-normal border-none shadow-none bg-secondary/50", className)}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[200px] p-0 shadow-lg border-border/50">
        <div className="flex items-center border-b border-border px-3 h-9">
          <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          <input
            className="flex h-full w-full bg-transparent py-3 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={defaultSearchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[220px] overflow-y-auto p-1 flex flex-col gap-0.5">
          {filteredOptions.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {emptyText}
            </div>
          )}
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-muted transition-colors",
                value === option.value && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => {
                onValueChange(option.value === value ? "" : option.value)
                setOpen(false)
                setSearch("")
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-3.5 w-3.5",
                  value === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              {option.label}
            </div>
          ))}

          {search.trim() && !hasExactMatch && (
            <div className="border-t border-border/50 my-1 pt-1 flex flex-col gap-0.5">
              {onCreateOptionQuick && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateOptionQuick(search.trim())
                    setOpen(false)
                    setSearch("")
                  }}
                  className="flex items-center w-full px-2 py-1.5 rounded-sm text-xs font-bold text-primary hover:bg-primary/10 transition-colors text-left cursor-pointer"
                >
                  <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
                  「{search.trim()}」を簡易追加
                </button>
              )}
              {onCreateOptionDetail && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateOptionDetail(search.trim())
                    setOpen(false)
                    setSearch("")
                  }}
                  className="flex items-center w-full px-2 py-1.5 rounded-sm text-xs font-bold text-primary hover:bg-primary/10 transition-colors text-left cursor-pointer"
                >
                  <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
                  「{search.trim()}」を詳細入力して追加...
                </button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
