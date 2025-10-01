import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const EDITABLE_NFT_ABI = [
  "function attestNFT(uint256 tokenId, uint256 value, string memory note) public",
  "function getAttestations(uint256 tokenId) public view returns (tuple(address attester, uint256 value, string note, uint256 timestamp)[])",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function exists(uint256 tokenId) public view returns (bool)"
];

const ROLE_LABELS = {
  "1": "Manufacturer",
  "2": "Distributor",
  "3": "Retailer"
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    // Parse token ID - handle hex strings, decimal numbers, etc.
    let parsedTokenId = tokenId;
    if (!/^\d+$/.test(tokenId)) {
      // If it's a hex string without 0x prefix, add it
      if (/^[0-9a-fA-F]+$/.test(tokenId) && tokenId.length <= 16) {
        parsedTokenId = `0x${tokenId}`;
      }
    }

    const provider = new ethers.AlchemyProvider("sepolia", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      EDITABLE_NFT_ABI,
      provider
    );

    const exists = await contract.exists(parsedTokenId);
    if (!exists) {
      return NextResponse.json({ error: 'Token does not exist' }, { status: 404 });
    }

    const attestations = await contract.getAttestations(parsedTokenId);
    
    const formattedAttestations = attestations.map(att => ({
      attester: att.attester,
      value: att.value.toString(),
      role: ROLE_LABELS[att.value.toString()] || `Role ${att.value.toString()}`,
      note: att.note,
      timestamp: att.timestamp.toString(),
      date: new Date(Number(att.timestamp) * 1000).toLocaleString()
    }));

    return NextResponse.json({ 
      tokenId,
      attestations: formattedAttestations 
    });

  } catch (error) {
    console.error('Error fetching attestations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attestations: ' + error.message },
      { status: 500 }
    );
  }
} 