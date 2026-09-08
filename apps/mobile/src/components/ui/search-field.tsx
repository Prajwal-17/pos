import { Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

export function SearchField({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={`rounded-control bg-surface min-h-12 flex-row items-center border pl-3 ${focused ? "border-accent" : "border-border"}`}
    >
      <Search size={18} color="#4D544C" />
      <TextInput
        accessibilityLabel={label}
        placeholder={label}
        placeholderTextColor="#4D544C"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="text-ink min-h-12 min-w-0 flex-1 px-3 text-base"
      />
      {!!value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChange("")}
          className="h-12 w-12 items-center justify-center"
        >
          <X size={18} color="#4D544C" />
        </Pressable>
      )}
    </View>
  );
}

export function useSearch(value: string): string {
  const [search, setSearch] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(value.trim()), 180);
    return () => clearTimeout(timer);
  }, [value]);
  return search;
}
