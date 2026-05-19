import * as React from "react"
import { Search } from "lucide-react"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (value: string) => void
  showKbd?: boolean
  isCompact?: boolean
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearchChange, showKbd = true, isCompact = false, ...props }, ref) => {
    const [showSearch, setShowSearch] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState(props.value?.toString() || "")

    React.useEffect(() => {
      if (props.value !== undefined) {
        setSearchValue(props.value.toString())
      }
    }, [props.value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setSearchValue(val)
      onSearchChange?.(val)
      props.onChange?.(e)
    }

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 bg-secondary/80 backdrop-blur-sm border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 rounded-md cursor-text transition-all duration-200",
          isCompact ? "h-8" : "h-10",
          className
        )}
        onClick={() => setShowSearch(true)}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {showSearch || searchValue ? (
          <input
            {...props}
            ref={ref}
            autoFocus={showSearch}
            className="bg-transparent text-sm text-foreground outline-none w-full placeholder-muted-foreground"
            value={searchValue}
            onChange={handleChange}
            onBlur={(e) => {
              if (!searchValue) {
                setTimeout(() => setShowSearch(false), 150)
              }
              props.onBlur?.(e)
            }}
          />
        ) : (
          <span className="text-sm text-muted-foreground flex-1 truncate">
            {props.placeholder || "検索..."}
          </span>
        )}
        {showKbd && !showSearch && !searchValue && (
          <Kbd className="hidden md:flex">⌘K</Kbd>
        )}
      </div>
    )
  }
)

SearchBar.displayName = "SearchBar"
