import type { Locale } from '@/configs/i18n'

/**
 * Get localized URL by prepending the locale to the path
 * @param path - The path to localize
 * @param locale - The locale to use
 * @returns The localized URL
 */
export const getLocalizedUrl = (path: string, locale: Locale): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    // Return the localized URL with the locale prefix
    return `/${locale}/${cleanPath}`
}
