import { TOTP } from 'otpauth'

export function generateTOTP(secret: string): string {
  try {
    // Ensure the secret is properly base32 encoded
    const cleanSecret = secret.replace(/[^A-Z2-7]/gi, '').toUpperCase()
    const totp = new TOTP({
      secret: cleanSecret,
      digits: 6,
      period: 30,
      algorithm: 'SHA1'
    })
    return totp.generate()
  } catch (error) {
    console.error('Error generating TOTP:', error)
    return '------' // Visual indicator of invalid secret
  }
}

export function getTimeRemaining(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30)
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const cleanSecret = secret.replace(/[^A-Z2-7]/gi, '').toUpperCase()
    const totp = new TOTP({
      secret: cleanSecret,
      digits: 6,
      period: 30,
      algorithm: 'SHA1'
    })
    return totp.validate({ token, window: 1 }) !== null
  } catch (error) {
    console.error('Error verifying TOTP:', error)
    return false
  }
}

export function validateTOTPSecret(secret: string): boolean {
  try {
    const cleanSecret = secret.replace(/[^A-Z2-7]/gi, '').toUpperCase()
    const totp = new TOTP({
      secret: cleanSecret,
      digits: 6,
      period: 30,
      algorithm: 'SHA1'
    })
    totp.generate() // This will throw if the secret is invalid
    return true
  } catch (error) {
    return false
  }
}

export function parseOTPAuthURL(url: string): { secret: string; label?: string } | null {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'otpauth:') return null

    const secret = parsedUrl.searchParams.get('secret')
    if (!secret) return null

    const label = decodeURIComponent(parsedUrl.pathname.substring(2))
    return { secret, label }
  } catch (error) {
    return null
  }
}