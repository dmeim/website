import { forwardRef, type ComponentType } from "react";
import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react";
import TokenBTC from "@web3icons/react/icons/tokens/TokenBTC";
import TokenDOGE from "@web3icons/react/icons/tokens/TokenDOGE";
import TokenETH from "@web3icons/react/icons/tokens/TokenETH";
import TokenSOL from "@web3icons/react/icons/tokens/TokenSOL";
import TokenTRX from "@web3icons/react/icons/tokens/TokenTRX";
import TokenUSDC from "@web3icons/react/icons/tokens/TokenUSDC";
import TokenUSDT from "@web3icons/react/icons/tokens/TokenUSDT";
import TokenXRP from "@web3icons/react/icons/tokens/TokenXRP";

type Web3Icon = typeof TokenBTC;

/**
 * Crypto token marks from web3icons, the one icon set besides Phosphor (see
 * docs/12-UI-Library-Spec.md). Always the mono variant so marks inherit
 * `currentColor` like Phosphor glyphs. Wrapped to take Phosphor's props so
 * the registry treats them like any other icon; `weight` and `mirrored` are
 * dropped because the marks are single filled shapes with a fixed orientation.
 */
function tokenIcon(Mark: Web3Icon, displayName: string): PhosphorIcon {
  const Glyph = forwardRef<SVGSVGElement, IconProps>(
    ({ size = "1em", weight: _weight, mirrored: _mirrored, alt: _alt, ...rest }, ref) => {
      const Svg = Mark as unknown as ComponentType<Record<string, unknown>>;
      return <Svg ref={ref} variant="mono" size={size} {...rest} />;
    },
  );
  Glyph.displayName = displayName;
  return Glyph;
}

export const TokenBtc = tokenIcon(TokenBTC, "TokenBtc");
export const TokenDoge = tokenIcon(TokenDOGE, "TokenDoge");
export const TokenEth = tokenIcon(TokenETH, "TokenEth");
export const TokenSol = tokenIcon(TokenSOL, "TokenSol");
export const TokenTrx = tokenIcon(TokenTRX, "TokenTrx");
export const TokenUsdc = tokenIcon(TokenUSDC, "TokenUsdc");
export const TokenUsdt = tokenIcon(TokenUSDT, "TokenUsdt");
export const TokenXrp = tokenIcon(TokenXRP, "TokenXrp");
