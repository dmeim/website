/**
 * Site content for dmeim.com
 * Visual structure adapted from Midnight Concert Hall reference.
 */

// Read from the files the site serves, so the page and the curl URLs can't disagree.
import pgpPublicKey from "../../public/keys/pgp.asc?raw";
import sshPublicKey from "../../public/keys/ssh_ed25519.pub?raw";

export type SiteMeta = {
  title: string;
  description: string;
};

export type HeroContent = {
  role: string;
};

export type ContactContent = {
  email: string;
  socialUrl: string;
  forgejoUrl: string;
};

export type KeyBlock = {
  id: string;
  title: string;
  kind: "SSH" | "GPG" | "Other";
  fingerprint: string;
  usage: string;
  commandLabel: string;
  command: string;
  body: string;
};

export const meta: SiteMeta = {
  title: "Dimitrios Meimaridis · IT manager and computer teacher",
  description:
    "Dimitrios Meimaridis (dmeim) is an IT manager, administrator, and computer teacher with over eight years of experience running school technology. Projects, tools, and public keys.",
};

/**
 * Cloudflare Web Analytics (cookieless). The token is public: it ships in every
 * page. Get it from Cloudflare dashboard > Analytics & Logs > Web Analytics >
 * dmeim.com > Manage site. Empty turns the beacon off.
 */
export const analytics = {
  cloudflareToken: "5f9f4b3b6b6a4c9a95cb078118f01b3b",
};

export const hero: HeroContent = {
  role: "definitely, semi, kinda, sorta, maybe, know what im doing",
};

export const contact: ContactContent = {
  email: "hello@dmeim.com",
  socialUrl: "https://github.com/dmeim",
  forgejoUrl: "https://git.mlabz.io/dmeim",
};

export const keys: KeyBlock[] = [
  {
    id: "ssh-ed25519",
    title: "SSH · Ed25519",
    kind: "SSH",
    fingerprint: "SHA256:nqaPo4ImFit8/kg+3RfF7UYf1GRHKVaV9+Vv87Z6lA4",
    usage: "Server logins and SSH signatures",
    commandLabel: "Add to a server",
    command:
      "mkdir -p ~/.ssh && chmod 700 ~/.ssh && curl -fsSL https://dmeim.com/keys/ssh_ed25519.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys",
    body: sshPublicKey.trim(),
  },
  {
    id: "gpg-primary",
    title: "GPG · Primary",
    kind: "GPG",
    fingerprint: "3A23 B8E5 D0B4 7019 44D5  8D2A 7E9D 73FE CE8F F326",
    usage: "Signatures and encrypted messages. Expires November 4, 2028.",
    commandLabel: "Import",
    command: "curl -fsSL https://dmeim.com/keys/pgp.asc | gpg --import",
    body: pgpPublicKey.trim(),
  },
];

export type CryptoWallet = {
  id: string;
  name: string;
  ticker: string;
  /** web3icons mark, by its `@/ui/icons/registry` name. */
  icon: TokenIcon;
  address: string;
  /** Tokens this same address can receive, on this wallet's network only. */
  alsoAccepts?: { ticker: string; icon: TokenIcon }[];
};

type TokenIcon = "token-btc" | "token-eth" | "token-sol" | "token-xrp" | "token-doge" | "token-trx" | "token-usdt" | "token-usdc";

type AcceptedToken = NonNullable<CryptoWallet["alsoAccepts"]>[number];
const usdt: AcceptedToken = { ticker: "USDT", icon: "token-usdt" };
const usdc: AcceptedToken = { ticker: "USDC", icon: "token-usdc" };

/** Donation addresses shown in the rail's wallet row. */
export const cryptoWallets: CryptoWallet[] = [
  { id: "btc", name: "Bitcoin", ticker: "BTC", icon: "token-btc", address: "bc1qah9gl4fmnpyaqlkfgmac7vdxg75gta4njtlud3" },
  { id: "eth", name: "Ethereum", ticker: "ETH", icon: "token-eth", address: "0x9bF99996EF954F31BA1e703b7c465Dfd933ca6BF", alsoAccepts: [usdt, usdc] },
  { id: "sol", name: "Solana", ticker: "SOL", icon: "token-sol", address: "6VhNP9MswgLyQzP2Y5Hmk6ydujbfKvfaFu4Vq1ZiUhMy", alsoAccepts: [usdt, usdc] },
  { id: "xrp", name: "XRP", ticker: "XRP", icon: "token-xrp", address: "rwQF3wyw32yVbwdsLW4pGfszZpA7foYK79" },
  { id: "trx", name: "Tron", ticker: "TRX", icon: "token-trx", address: "TJBHTc8vWMw2arEUD6wGPF3zUpo4EVGfh2", alsoAccepts: [usdt] },
  { id: "doge", name: "Dogecoin", ticker: "DOGE", icon: "token-doge", address: "DQEi5ngcDUWLho2Rm4v7vmcxqwVjeN6Dgk" },
];
