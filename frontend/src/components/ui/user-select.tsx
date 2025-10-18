import Select, { components, StylesConfig } from 'react-select'
import { User } from 'lucide-react'

type UserOption = {
  value: string
  label: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role?: string
  }
}

type UserSelectProps = {
  users: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    role?: string
  }>
  value: string
  onChange: (userId: string) => void
  placeholder?: string
  isClearable?: boolean
  isDisabled?: boolean
}

const Option = (props: any) => {
  const { user } = props.data
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3 py-1">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <User size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-sm text-gray-500 truncate">{user.email}</div>
        </div>
      </div>
    </components.Option>
  )
}

const SingleValue = (props: any) => {
  const { user } = props.data
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <User size={12} className="text-blue-600" />
        </div>
        <span className="font-medium">
          {user.firstName} {user.lastName}
        </span>
      </div>
    </components.SingleValue>
  )
}

const customStyles: StylesConfig<UserOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': {
      borderColor: '#3b82f6',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#111827',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#3b82f6',
    },
  }),
}

export function UserSelect({ users, value, onChange, placeholder, isClearable, isDisabled }: UserSelectProps) {
  const options: UserOption[] = users.map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName} (${user.email})`,
    user,
  }))

  const selectedOption = options.find((opt) => opt.value === value) || null

  return (
    <Select<UserOption, false>
      options={options}
      value={selectedOption}
      onChange={(option) => onChange(option?.value || '')}
      placeholder={placeholder || 'Mitarbeiter auswählen...'}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isSearchable
      components={{ Option, SingleValue }}
      styles={customStyles}
      noOptionsMessage={() => 'Keine Mitarbeiter gefunden'}
      filterOption={(option, searchText) => {
        const { user } = option.data
        const search = searchText.toLowerCase()
        return (
          user.firstName.toLowerCase().includes(search) ||
          user.lastName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        )
      }}
    />
  )
}
