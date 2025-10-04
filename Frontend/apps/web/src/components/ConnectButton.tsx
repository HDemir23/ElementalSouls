'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

export const ConnectButton = () => (
  <RainbowConnectButton
    accountStatus="address"
    chainStatus={{ largeScreen: 'full', smallScreen: 'icon' }}
    showBalance={{ smallScreen: false, largeScreen: true }}
  />
);
