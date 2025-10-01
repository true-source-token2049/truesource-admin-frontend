import './globals.css';
import { WalletProvider } from './contexts/WalletContext';

export const metadata = {
  title: 'Editable NFT Platform',
  description: 'Create, mint, and edit NFTs with customizable attributes on Ethereum Sepolia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
