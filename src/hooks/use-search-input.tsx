import React from "react";

type SearchInputProps = {
    debounceTime?: number;
}

export function useSearchInput({ debounceTime }: SearchInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedInputValue, setDebouncedInputValue] = React.useState("");

  const handleInputChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setInputValue(event.target.value);
  };

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
        setDebouncedInputValue(inputValue);
    }, debounceTime);
    return () => clearTimeout(timeoutId);
  }, [inputValue, debounceTime]);

  return { inputValue, setInputValue };
};