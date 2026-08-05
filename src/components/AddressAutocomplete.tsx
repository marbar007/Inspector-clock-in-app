import '@geoapify/geocoder-autocomplete/styles/minimal.css'
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete'
import './AddressAutocomplete.css'

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  placeholder?: string
}

interface GeoapifyFeature {
  properties?: { formatted?: string }
}

export default function AddressAutocomplete({ value, onChange, placeholder }: AddressAutocompleteProps) {
  if (!GEOAPIFY_API_KEY) {
    return (
      <input
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
      />
    )
  }

  return (
    <div className="geoapify-field w-full rounded-lg border border-neutral-300 text-sm focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-200">
      <GeoapifyContext apiKey={GEOAPIFY_API_KEY}>
        <GeoapifyGeocoderAutocomplete
          placeholder={placeholder}
          filterByCountryCode={['us']}
          placeSelect={(feature: GeoapifyFeature) => onChange(feature?.properties?.formatted ?? '')}
          onUserInput={(input: string) => onChange(input)}
        />
      </GeoapifyContext>
    </div>
  )
}
