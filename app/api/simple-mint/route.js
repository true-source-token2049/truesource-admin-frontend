import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Simple ABI
const SIMPLE_ABI = [
  "function mint(address to, string memory uri) public returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

export async function POST(request) {
  try {
    const { recipientAddress, metadataUri } = await request.json();

    if (!recipientAddress || !metadataUri) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Private key not configured' }, { status: 500 });
    }

    // Use Alchemy provider directly
    const provider = new ethers.AlchemyProvider("sepolia", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      SIMPLE_ABI,
      wallet
    );

    // Mint with fixed gas to avoid estimation
    const tx = await contract.mint(recipientAddress, metadataUri, {
      gasLimit: 300000
    });

    const receipt = await tx.wait();
    
    // Get the token ID from the Transfer event
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'Transfer' && parsed.args.from === ethers.ZeroAddress) {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // Continue if parsing fails
      }
    }

    return NextResponse.json({
      success: true,
      tokenId: tokenId || 'unknown',
      transactionHash: receipt.hash,
      message: 'NFT minted successfully!'
    });

  } catch (error) {
    console.error('Minting error:', error);
    return NextResponse.json(
      { error: 'Failed to mint: ' + error.message },
      { status: 500 }
    );
  }
}
