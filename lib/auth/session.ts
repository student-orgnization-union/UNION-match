'use client'

import { createClient } from '@/lib/supabase/client'

export type AuthUserType = 'company' | 'organization' | 'student' | null

export type CompanyProfile = {
  id: string
  name: string | null
  contact_email: string | null
}

export type OrganizationProfile = {
  id: string
  name: string | null
  contact_email: string | null
  contact_phone: string | null
}

export type StudentProfile = {
  id: string
  name: string | null
  email: string | null
  university: string | null
  department: string | null
  grade: string | null
  contact_email: string | null
}

export type CompanySession = {
  accessToken: string | null
  refreshToken: string | null
  profile: CompanyProfile | null
}

export type OrganizationSession = {
  accessToken: string | null
  refreshToken: string | null
  profile: OrganizationProfile | null
}

export type StudentSession = {
  accessToken: string | null
  refreshToken: string | null
  profile: StudentProfile | null
}

const ACCESS_TOKEN_KEY = 'um.auth.accessToken'
const REFRESH_TOKEN_KEY = 'um.auth.refreshToken'
const USER_TYPE_KEY = 'um.auth.userType'
const COMPANY_PROFILE_KEY = 'um.company.profile'
const ORGANIZATION_PROFILE_KEY = 'um.organization.profile'
const STUDENT_PROFILE_KEY = 'um.student.profile'
const COMPANY_ID_KEY = 'um.company.id'
const ORGANIZATION_ID_KEY = 'um.organization.id'
const STUDENT_ID_KEY = 'um.student.id'

const LEGACY_COMPANY_ID_KEY = 'company_id'
const LEGACY_ORGANIZATION_ID_KEY = 'organization_id'

const COMPANY_COOKIE = 'um-company-session'
const ORGANIZATION_COOKIE = 'um-organization-session'
const STUDENT_COOKIE = 'um-student-session'

const AUTH_CHANGE_EVENT = 'um-auth-change'

export const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function dispatchAuthChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

function setCookie(name: string, value: string, options: { maxAge?: number } = {}) {
  if (typeof document === 'undefined') return
  const { maxAge } = options
  if (maxAge !== undefined) {
    document.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}`
  } else {
    document.cookie = `${name}=${value}; Path=/; SameSite=Lax`
  }
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0`
}

function safeSetItem(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key)
  } else {
    window.localStorage.setItem(key, value)
  }
}

function safeRemoveItem(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

function getJSONValue<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function setJSONValue(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key)
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
}

function clearLegacyKeys() {
  safeRemoveItem(LEGACY_COMPANY_ID_KEY)
  safeRemoveItem(LEGACY_ORGANIZATION_ID_KEY)
}

export function persistCompanySession(params: {
  accessToken?: string | null
  refreshToken?: string | null
  profile?: CompanyProfile | null
}) {
  if (typeof window === 'undefined') return
  const { accessToken, refreshToken, profile } = params

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (profile) {
    setJSONValue(COMPANY_PROFILE_KEY, profile)
    safeSetItem(COMPANY_ID_KEY, profile.id)
  }

  window.localStorage.setItem(USER_TYPE_KEY, 'company')

  setCookie(COMPANY_COOKIE, '1', { maxAge: 60 * 60 * 24 * 14 })
  clearCookie(ORGANIZATION_COOKIE)

  clearLegacyKeys()
  dispatchAuthChange()
}

export function persistOrganizationSession(params: {
  accessToken?: string | null
  refreshToken?: string | null
  profile?: OrganizationProfile | null
}) {
  if (typeof window === 'undefined') return
  const { accessToken, refreshToken, profile } = params

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (profile) {
    setJSONValue(ORGANIZATION_PROFILE_KEY, profile)
    safeSetItem(ORGANIZATION_ID_KEY, profile.id)
  }

  window.localStorage.setItem(USER_TYPE_KEY, 'organization')

  setCookie(ORGANIZATION_COOKIE, '1', { maxAge: 60 * 60 * 24 * 14 })
  clearCookie(COMPANY_COOKIE)
  clearCookie(STUDENT_COOKIE)

  clearLegacyKeys()
  dispatchAuthChange()
}

export function persistStudentSession(params: {
  accessToken?: string | null
  refreshToken?: string | null
  profile?: StudentProfile | null
}) {
  if (typeof window === 'undefined') return
  const { accessToken, refreshToken, profile } = params

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (profile) {
    setJSONValue(STUDENT_PROFILE_KEY, profile)
    safeSetItem(STUDENT_ID_KEY, profile.id)
  }

  window.localStorage.setItem(USER_TYPE_KEY, 'student')

  setCookie(STUDENT_COOKIE, '1', { maxAge: 60 * 60 * 24 * 14 })
  clearCookie(COMPANY_COOKIE)
  clearCookie(ORGANIZATION_COOKIE)

  clearLegacyKeys()
  dispatchAuthChange()
}

export function getCompanySession(): CompanySession {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, profile: null }
  }

  const profile = getJSONValue<CompanyProfile>(COMPANY_PROFILE_KEY)
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)

  return {
    profile,
    accessToken,
    refreshToken,
  }
}

export function getOrganizationSession(): OrganizationSession {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, profile: null }
  }

  const profile = getJSONValue<OrganizationProfile>(ORGANIZATION_PROFILE_KEY)
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)

  return {
    profile,
    accessToken,
    refreshToken,
  }
}

export function getStudentSession(): StudentSession {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, profile: null }
  }

  const profile = getJSONValue<StudentProfile>(STUDENT_PROFILE_KEY)
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)

  return {
    profile,
    accessToken,
    refreshToken,
  }
}

export function getStoredUserType(): AuthUserType {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(USER_TYPE_KEY)
  if (value === 'company' || value === 'organization' || value === 'student') {
    return value
  }
  return null
}

export function clearCompanySession() {
  if (typeof window === 'undefined') return
  safeRemoveItem(COMPANY_PROFILE_KEY)
  safeRemoveItem(COMPANY_ID_KEY)
  clearCookie(COMPANY_COOKIE)
  dispatchAuthChange()
}

export function clearOrganizationSession() {
  if (typeof window === 'undefined') return
  safeRemoveItem(ORGANIZATION_PROFILE_KEY)
  safeRemoveItem(ORGANIZATION_ID_KEY)
  clearCookie(ORGANIZATION_COOKIE)
  dispatchAuthChange()
}

export function clearStudentSession() {
  if (typeof window === 'undefined') return
  safeRemoveItem(STUDENT_PROFILE_KEY)
  safeRemoveItem(STUDENT_ID_KEY)
  clearCookie(STUDENT_COOKIE)
  dispatchAuthChange()
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return
  safeRemoveItem(ACCESS_TOKEN_KEY)
  safeRemoveItem(REFRESH_TOKEN_KEY)
  safeRemoveItem(USER_TYPE_KEY)
  dispatchAuthChange()
}

export function clearAllSessions() {
  if (typeof window === 'undefined') return
  clearCompanySession()
  clearOrganizationSession()
  clearStudentSession()
  clearAuthTokens()
  clearLegacyKeys()
}

export function subscribeAuthChange(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const handleChange = () => callback()

  window.addEventListener(AUTH_CHANGE_EVENT, handleChange)
  window.addEventListener('storage', handleChange)

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handleChange)
    window.removeEventListener('storage', handleChange)
  }
}

export async function signOutCurrentUser() {
  if (!hasSupabaseConfig) {
    clearAllSessions()
    return
  }

  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.warn('Supabase signOut failed (ignored):', error)
  } finally {
    clearAllSessions()
  }
}

