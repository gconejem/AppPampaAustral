/**
 * Utility functions for generating temporary codes for RCMs and Product Codes
 * These codes are used for display purposes only until finalization
 */

/**
 * Generate temporary RCM code in format RCM-001, RCM-002, etc.
 * @param index - The sequential index (1-based)
 * @returns Formatted temporary RCM code
 */
export function generateTemporaryRcmCode(index: number): string {
    return `RCM-${index.toString().padStart(3, '0')}`
}

/**
 * Generate temporary product code in format PRD-001, PRD-002, etc.
 * @param index - The sequential index (1-based)
 * @returns Formatted temporary product code
 */
export function generateTemporaryProductCode(index: number): string {
    return `PRD-${index.toString().padStart(3, '0')}`
}

/**
 * Check if a code is a temporary code (starts with RCM- or PRD-)
 * @param code - The code to check
 * @returns True if the code is temporary
 */
export function isTemporaryCode(code: string | undefined): boolean {
    if (!code) return false
    return code.startsWith('RCM-') || code.startsWith('PRD-')
}

/**
 * Extract the index from a temporary code
 * @param code - The temporary code (e.g., "RCM-001")
 * @returns The numeric index or null if invalid
 */
export function extractTemporaryCodeIndex(code: string): number | null {
    const match = code.match(/^(?:RCM|PRD)-(\d+)$/)
    if (!match) return null
    return parseInt(match[1], 10)
}
