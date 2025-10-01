import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const EDITABLE_NFT_ABI = [
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function getAttributes(uint256 tokenId) public view returns (string memory)",
  "function exists(uint256 tokenId) public view returns (bool)"
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    const provider = new ethers.AlchemyProvider("sepolia", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);

    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      EDITABLE_NFT_ABI,
      provider
    );

    const exists = await contract.exists(tokenId);
    if (!exists) {
      return NextResponse.json({ error: 'Token does not exist' }, { status: 404 });
    }

    const [tokenURI, owner] = await Promise.all([
      contract.tokenURI(tokenId),
      contract.ownerOf(tokenId)
    ]);

    const metadataResponse = await fetch(tokenURI);
    console.log(tokenURI)
    console.log(metadataResponse)
    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch metadata from IPFS');
    }
    
    const metadata = await metadataResponse.json();

    let attributes = [];
    try {
      const attributesString = await contract.getAttributes(tokenId);
      if (attributesString) {
        attributes = JSON.parse(attributesString);
      }
    } catch (e) {
      attributes = metadata.attributes || [];
    }

    return NextResponse.json({
      ...metadata,
      owner: owner,
      tokenId: tokenId,
      attributes: attributes
    });

  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT metadata: ' + error.message },
      { status: 500 }
    );
  }
}
