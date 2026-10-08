export type TokenId = 'BNB' | 'ETH' | 'KTI' | 'USDT' | 'BTC' | 'USDC'

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

/* KTI exists only on BNB Chain (BSC), so every pair in the app is a BEP-20 pair on that network:
   BNB is the gas token and the default "from", USDT/USDC are the stable pairs, ETH/BTC are the pegged versions. */
export const KTI_NETWORK = 'bnb'
export const GAS_TOKEN: TokenId = 'BNB'

export const TOKENS: Record<TokenId, Token> = {
  BNB: { id: 'BNB', name: 'BNB', symbol: 'BNB', price: 600, balance: 3, networkLabel: 'BNB · BNB Chain', change24h: -0.42 },
  KTI: { id: 'KTI', name: 'KTI Coin', symbol: 'KTI', price: 0.000025, balance: 0, networkLabel: 'KTI · BNB Chain', change24h: 4.8, native: true },
  USDT: { id: 'USDT', name: 'Tether USD', symbol: 'USDT', price: 1, balance: 250, networkLabel: 'USDT · BNB Chain', change24h: 0 },
  USDC: { id: 'USDC', name: 'USD Coin', symbol: 'USDC', price: 1, balance: 0, networkLabel: 'USDC · BNB Chain', change24h: 0 },
  ETH: { id: 'ETH', name: 'Ethereum', symbol: 'ETH', price: 3500, balance: 0, networkLabel: 'ETH · BNB Chain', change24h: 1.08 },
  BTC: { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', price: 67000, balance: 0, networkLabel: 'BTCB · BNB Chain', change24h: 0.6 },
}

export const TOKEN_LIST: Token[] = [TOKENS.KTI, TOKENS.BNB, TOKENS.USDT, TOKENS.USDC, TOKENS.ETH, TOKENS.BTC]

export interface Network {
  id: string
  name: string
  hasKtiPool: boolean
}

export const NETWORKS: Network[] = [
  { id: 'bnb', name: 'BNB Chain', hasKtiPool: true },
  { id: 'eth', name: 'Ethereum', hasKtiPool: false },
  { id: 'poly', name: 'Polygon', hasKtiPool: false },
  { id: 'arb', name: 'Arbitrum', hasKtiPool: false },
  { id: 'base', name: 'Base', hasKtiPool: false },
  { id: 'op', name: 'Optimism', hasKtiPool: false },
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
  { from: 'BNB', to: 'KTI', label: '0.5 BNB for 11,940,000 KTI', when: 'Today · 14:32', status: 'Completed' },
  { from: 'USDT', to: 'KTI', label: '250 USDT for 9,950,000 KTI', when: 'Yesterday · 09:12', status: 'Completed' },
  { from: 'BNB', to: 'USDT', label: '1.2 BNB for 718.2 USDT', when: 'Oct 3 · 18:47', status: 'Completed' },
  { from: 'KTI', to: 'BNB', label: '4,000,000 KTI for 0.166 BNB', when: 'Oct 1 · 11:05', status: 'Failed' },
  { from: 'USDT', to: 'BNB', label: '120 USDT for 0.199 BNB', when: 'Sep 28 · 20:31', status: 'Completed' },
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
/** Unit price of a token: cents-level tokens keep their significant digits ($0.000025), the rest read as money ($600.00). */
export const unitPrice = (n: number): string => (n > 0 && n < 0.01 ? '$' + Number(n.toPrecision(3)).toFixed(Math.min(10, Math.ceil(-Math.log10(n)) + 2)).replace(/0+$/, '') : usd(n))
export const pctText = (p: number): string => (p === 0 ? '0.00%' : `${p > 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(2)}%`)
export const usd = (n: number): string =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
