// Returns initials from string
export const getInitials = (string: string) => {
  if (!string) return ''
  
  return string
    .split(/\s/)
    .reduce((response, word) => (word[0] ? response + word[0] : response), '')
    .toUpperCase()
}
