export type TokenId = 'ETH' | 'KTI' | 'USDT' | 'BTC' | 'USDC'

export interface Token {
  id: TokenId
  name: string
  symbol: string
  price: number
  balance: number
  networkLabel: string
  change24h: number
  native?: boolean
}

export const TOKENS: Record<TokenId, Token> = {
  ETH: { id: 'ETH', name: 'Ethereum', symbol: 'ETH', price: 3500, balance: 1, networkLabel: 'ETH · Ethereum', change24h: 1.08 },
  KTI: { id: 'KTI', name: 'KTI Coin', symbol: 'KTI', price: 0.000025, balance: 0, networkLabel: 'KTI · Ethereum', change24h: 4.8, native: true },
  USDT: { id: 'USDT', name: 'Tether USD', symbol: 'USDT', price: 1, balance: 0, networkLabel: 'USDT · Ethereum', change24h: 0 },
  BTC: { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', price: 67000, balance: 0, networkLabel: 'BTC · Ethereum', change24h: 0.6 },
  USDC: { id: 'USDC', name: 'USD Coin', symbol: 'USDC', price: 1, balance: 0, networkLabel: 'USDC · Ethereum', change24h: 0 },
}

export const TOKEN_LIST: Token[] = [TOKENS.KTI, TOKENS.ETH, TOKENS.USDT, TOKENS.BTC, TOKENS.USDC]

export interface Network {
  id: string
  name: string
  hasKtiPool: boolean
}

export const NETWORKS: Network[] = [
  { id: 'eth', name: 'Ethereum', hasKtiPool: true },
  { id: 'bnb', name: 'BNB Chain', hasKtiPool: true },
  { id: 'poly', name: 'Polygon', hasKtiPool: true },
  { id: 'arb', name: 'Arbitrum', hasKtiPool: true },
  { id: 'base', name: 'Base', hasKtiPool: true },
  { id: 'op', name: 'Optimism', hasKtiPool: true },
  { id: 'avax', name: 'Avalanche', hasKtiPool: false },
]

export interface WalletOption {
  id: string
  name: string
  color: string
  glyph: string
  recommended?: boolean
}

export const WALLETS: WalletOption[] = [
  { id: 'kotai', name: 'Kotai Wallet', color: '#ffffff', glyph: 'K', recommended: true },
  { id: 'metamask', name: 'MetaMask', color: '#f6851b', glyph: 'M' },
  { id: 'walletconnect', name: 'WalletConnect', color: '#3b99fc', glyph: 'W' },
  { id: 'coinbase', name: 'Coinbase', color: '#0052ff', glyph: 'C' },
  { id: 'trust', name: 'Trust Wallet', color: '#3375bb', glyph: 'T' },
  { id: 'phantom', name: 'Phantom', color: '#ab9ff2', glyph: 'P' },
  { id: 'rabby', name: 'Rabby', color: '#8697ff', glyph: 'R' },
  { id: 'ledger', name: 'Ledger', color: '#1d2433', glyph: 'L' },
]

export interface HistoryItem {
  from: TokenId
  to: TokenId
  label: string
  when: string
  status: 'Completed' | 'Failed'
}

export const HISTORY: HistoryItem[] = [
  { from: 'ETH', to: 'USDT', label: '0.5 ETH for 1,280.81 USDT', when: 'Today · 14:32', status: 'Completed' },
  { from: 'USDT', to: 'KTI', label: '250 USDT for 9,820,000 KTI', when: 'Yesterday · 09:12', status: 'Completed' },
  { from: 'ETH', to: 'USDC', label: '1.2 ETH for 3,071.4 USDC', when: 'Oct 3 · 18:47', status: 'Completed' },
  { from: 'USDC', to: 'ETH', label: '100 USDC for 0.028 ETH', when: 'Oct 1 · 11:05', status: 'Failed' },
  { from: 'ETH', to: 'USDT', label: '0.2 ETH for 512.3 USDT', when: 'Sep 28 · 20:31', status: 'Completed' },
]

export const LANGUAGES = [
  { name: 'English', native: 'English' },
  { name: 'Português (Brasil)', native: 'Portuguese' },
  { name: 'Español', native: 'Spanish' },
  { name: 'Français', native: 'French' },
  { name: 'Deutsch', native: 'German' },
  { name: '日本語', native: 'Japanese' },
]

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'ARS', name: 'Argentine Peso' },
]

export const ADDRESS = '0x7a25…c3e1'
export const TX_HASH = '0x9f3c2b7e5a41d8c06f93e1b2a7d4058c3e8f…'

export const fmt = (n: number, max = 4): string => {
  if (!isFinite(n)) return '0'
  return n.toLocaleString('en-US', { maximumFractionDigits: max })
}
export const usd = (n: number): string =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
