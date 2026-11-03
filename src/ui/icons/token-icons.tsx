import type { ComponentType } from "react";
import type { TokenIconName } from "./registry";
import TokenBTC from "@web3icons/react/icons/tokens/TokenBTC";
import TokenDOGE from "@web3icons/react/icons/tokens/TokenDOGE";
import TokenETH from "@web3icons/react/icons/tokens/TokenETH";
import TokenSOL from "@web3icons/react/icons/tokens/TokenSOL";
import TokenTRX from "@web3icons/react/icons/tokens/TokenTRX";
import TokenUSDC from "@web3icons/react/icons/tokens/TokenUSDC";
import TokenUSDT from "@web3icons/react/icons/tokens/TokenUSDT";
import TokenXRP from "@web3icons/react/icons/tokens/TokenXRP";

type Web3Icon = typeof TokenBTC;

export type TokenIconProps = {
  size?: number | string;
  className?: string;
  [attribute: string]: unknown;
};

/**
 * Crypto token marks from web3icons, the one icon set besides Phosphor (see
 * docs/12-UI-Library-Spec.md). Always the mono variant so marks inherit
 * `currentColor` like Phosphor glyphs. Rendered only by Icon.astro, so none
 * of this ships to the browser.
 */
function tokenIcon(Mark: Web3Icon, displayName: string): ComponentType<TokenIconProps> {
  const Svg = Mark as unknown as ComponentType<Record<string, unknown>>;
  const Glyph = ({ size = "1em", ...rest }: TokenIconProps) => <Svg variant="mono" size={size} {...rest} />;
  Glyph.displayName = displayName;
  return Glyph;
}

export const tokenIcons: Record<TokenIconName, ComponentType<TokenIconProps>> = {
  "token-btc": tokenIcon(TokenBTC, "TokenBtc"),
  "token-doge": tokenIcon(TokenDOGE, "TokenDoge"),
  "token-eth": tokenIcon(TokenETH, "TokenEth"),
  "token-sol": tokenIcon(TokenSOL, "TokenSol"),
  "token-trx": tokenIcon(TokenTRX, "TokenTrx"),
  "token-usdc": tokenIcon(TokenUSDC, "TokenUsdc"),
  "token-usdt": tokenIcon(TokenUSDT, "TokenUsdt"),
  "token-xrp": tokenIcon(TokenXRP, "TokenXrp"),
};
