import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const EDITABLE_NFT_ABI = [
  "function attestNFT(uint256 tokenId, uint256 value, string memory note) public",
  "function getAttestations(uint256 tokenId) public view returns (tuple(address attester, uint256 value, string note, uint256 timestamp)[])",
  "function ownerOf(uint256 tokenId) public view returns (address)",
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

    const attestations = await contract.getAttestations(tokenId);
    
    const formattedAttestations = attestations.map(att => ({
      attester: att.attester,
      value: att.value.toString(),
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { tokenId, value, note, privateKey } = body;

    if (!tokenId || value === undefined || !note || !privateKey) {
      return NextResponse.json(
        { error: 'Token ID, value, note, and private key are required' },
        { status: 400 }
      );
    }

    const provider = new ethers.AlchemyProvider("sepolia", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      EDITABLE_NFT_ABI,
      wallet
    );

    const exists = await contract.exists(tokenId);
    if (!exists) {
      return NextResponse.json({ error: 'Token does not exist' }, { status: 404 });
    }

    const owner = await contract.ownerOf(tokenId);
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the owner can attest this NFT' },
        { status: 403 }
      );
    }

    const tx = await contract.attestNFT(tokenId, value, note);
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      tokenId,
      attester: wallet.address,
      value: value.toString(),
      note
    });

  } catch (error) {
    console.error('Error attesting NFT:', error);
    return NextResponse.json(
      { error: 'Failed to attest NFT: ' + error.message },
      { status: 500 }
    );
  }
} 