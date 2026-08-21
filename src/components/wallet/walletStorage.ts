export const WALLET_CREATED_KEY = "chattm-wallet-created";
export const WALLET_BALANCE_KEY = "chattm-wallet-balance";
export const WALLET_AMOUNT_KEY = "chattm-wallet-add-amount";
export const WALLET_WITHDRAW_AMOUNT_KEY = "chattm-wallet-withdraw-amount";
export const WALLET_WITHDRAW_DEST_KEY = "chattm-wallet-withdraw-dest";
export const WALLET_TXS_KEY = "chattm-wallet-txs";
export const WALLET_ACCOUNTS_KEY = "chattm-wallet-accounts";
export const WALLET_BANK_DRAFT_KEY = "chattm-wallet-bank-draft";
export const INITIAL_BALANCE = 5240;

export type WalletTx = {
  id: string;
  name: string;
  detail: string;
  amount: number;
  time: string;
  avatar?: string;
  icon?: string;
};

export type LinkedAccount = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  object: "object-top" | "object-bottom";
};

export type BankDraft = {
  tab: "bank" | "upi";
  bankId: string;
  bankName: string;
  holderName: string;
  accountNumber: string;
  ifsc: string;
  mobile: string;
  upiId: string;
};

export function formatInr(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function readCreated() {
  return sessionStorage.getItem(WALLET_CREATED_KEY) === "1";
}

export function markCreated() {
  sessionStorage.setItem(WALLET_CREATED_KEY, "1");
  if (!sessionStorage.getItem(WALLET_BALANCE_KEY)) {
    sessionStorage.setItem(WALLET_BALANCE_KEY, String(INITIAL_BALANCE));
  }
}

export function readBalance() {
  const raw = sessionStorage.getItem(WALLET_BALANCE_KEY);
  return raw ? Number(raw) : INITIAL_BALANCE;
}

export function writeBalance(value: number) {
  sessionStorage.setItem(WALLET_BALANCE_KEY, String(value));
}

export function readAmount() {
  const raw = sessionStorage.getItem(WALLET_AMOUNT_KEY);
  return raw ? Number(raw) : 1000;
}

export function writeAmount(value: number) {
  sessionStorage.setItem(WALLET_AMOUNT_KEY, String(value));
}

export function readWithdrawAmount() {
  const raw = sessionStorage.getItem(WALLET_WITHDRAW_AMOUNT_KEY);
  return raw ? Number(raw) : 0;
}

export function writeWithdrawAmount(value: number) {
  sessionStorage.setItem(WALLET_WITHDRAW_AMOUNT_KEY, String(value));
}

export function readWithdrawDest() {
  return sessionStorage.getItem(WALLET_WITHDRAW_DEST_KEY) || "chase";
}

export function writeWithdrawDest(value: string) {
  sessionStorage.setItem(WALLET_WITHDRAW_DEST_KEY, value);
}

export function readExtraTxs(): WalletTx[] {
  const raw = sessionStorage.getItem(WALLET_TXS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WalletTx[];
  } catch {
    return [];
  }
}

export function prependTx(tx: WalletTx) {
  sessionStorage.setItem(WALLET_TXS_KEY, JSON.stringify([tx, ...readExtraTxs()]));
}

const EMPTY_DRAFT: BankDraft = {
  tab: "bank",
  bankId: "",
  bankName: "",
  holderName: "",
  accountNumber: "",
  ifsc: "",
  mobile: "",
  upiId: "",
};

export function readBankDraft(): BankDraft {
  const raw = sessionStorage.getItem(WALLET_BANK_DRAFT_KEY);
  if (!raw) return { ...EMPTY_DRAFT };
  try {
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as BankDraft) };
  } catch {
    return { ...EMPTY_DRAFT };
  }
}

export function writeBankDraft(draft: Partial<BankDraft>) {
  sessionStorage.setItem(WALLET_BANK_DRAFT_KEY, JSON.stringify({ ...readBankDraft(), ...draft }));
}

export function clearBankDraft() {
  sessionStorage.removeItem(WALLET_BANK_DRAFT_KEY);
}

export function readLinkedAccounts(): LinkedAccount[] {
  const raw = sessionStorage.getItem(WALLET_ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LinkedAccount[];
  } catch {
    return [];
  }
}

export function addLinkedAccount(account: LinkedAccount) {
  sessionStorage.setItem(WALLET_ACCOUNTS_KEY, JSON.stringify([account, ...readLinkedAccounts()]));
}
