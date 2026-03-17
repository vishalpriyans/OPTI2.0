"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DropdownInputProps {
  name: string
  placeholder: string
  options: string[]
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  optionLabels?: Record<string, string> // Optional labels to display for each option
}

export function DropdownInput({ 
  name, 
  placeholder, 
  options, 
  value, 
  onChange, 
  className,
  disabled = false,
  optionLabels
}: DropdownInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get the display value to use for filtering
    const searchValue = optionLabels?.[value] || value
    const searchText = searchValue.toLowerCase()
    
    const filtered = options.filter(option => {
      const optionText = option.toLowerCase()
      const labelText = optionLabels?.[option]?.toLowerCase() || ""
      // Filter by both option name and label
      return optionText.includes(searchText) || labelText.includes(searchText)
    })
    setFilteredOptions(filtered)
  }, [value, options, optionLabels])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // If optionLabels are provided, try to find the matching option by label
    if (optionLabels) {
      // Find the option that matches the label
      const matchingOption = Object.entries(optionLabels).find(
        ([_, label]) => label === newValue
      )?.[0]
      
      if (matchingOption) {
        onChange(matchingOption)
        setIsOpen(true)
        return
      }
      
      // If no exact match, try to find by partial match in label
      const partialMatch = Object.entries(optionLabels).find(
        ([_, label]) => label.toLowerCase().includes(newValue.toLowerCase())
      )?.[0]
      
      if (partialMatch) {
        onChange(partialMatch)
        setIsOpen(true)
        return
      }
    }
    
    // Fallback to direct value change
    onChange(newValue)
    setIsOpen(true)
  }

  const handleOptionSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  // Get display value (label if available, otherwise the raw value)
  const displayValue = optionLabels?.[value] || value
  
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        name={name}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        className={className}
        autoComplete="off"
        disabled={disabled}
      />
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => {
            const displayText = optionLabels?.[option] || option
            return (
              <div
                key={index}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                onClick={() => handleOptionSelect(option)}
              >
                {displayText}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
