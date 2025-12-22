type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SearchBar = ({ label, value, onChange, placeholder }: Props) => (
  <label className="search-bar">
    <span>{label}</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </label>
)

export default SearchBar

