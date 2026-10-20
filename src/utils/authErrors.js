// Maps Supabase auth errors to translation keys; falls back to the raw message.
const CODE_TO_KEY = {
  invalid_credentials: 'authInvalidCredentials',
  email_not_confirmed: 'authEmailNotConfirmed',
  user_already_exists: 'authUserExists',
  email_exists: 'authUserExists',
  over_email_send_rate_limit: 'authRateLimited',
  over_request_rate_limit: 'authRateLimited',
  same_password: 'authSamePassword',
  weak_password: 'authPasswordTooShort',
  otp_expired: 'authLinkExpired',
  wrong_current_password: 'authWrongCurrentPassword',
}

export function authErrorMessage(error, t) {
  if (!error) return ''
  const key = CODE_TO_KEY[error.code] ?? (error.status === 429 ? 'authRateLimited' : null)
  return key ? t(key) : error.message
}
