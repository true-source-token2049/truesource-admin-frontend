import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// ABI for updating attributes
const EDITABLE_NFT_ABI = [
  "function updateAttributes(uint256 tokenId, string memory newAttributes) public",
  "function getAttributes(uint256 tokenId) public view returns (string memory)",
  "function exists(uint256 tokenId) public view returns (bool)",
  "event AttributesUpdated(uint256 indexed tokenId, string newAttributes, address indexed updater)"
];

export async function POST(request) {
  try {
    const { tokenId, attributes } = await request.json();

    if (!tokenId || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields: tokenId and attributes are required' 
      }, { status: 400 });
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Private key not configured' }, { status: 500 });
    }

    // Use Alchemy provider
    const provider = new ethers.AlchemyProvider("sepolia", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      EDITABLE_NFT_ABI,
      wallet
    );

    // Check if token exists
    const exists = await contract.exists(tokenId);
    if (!exists) {
      return NextResponse.json({ 
        error: 'Token does not exist' 
      }, { status: 404 });
    }

    // Update attributes
    console.log('Updating attributes...');
    const tx = await contract.updateAttributes(tokenId, JSON.stringify(attributes), {
      gasLimit: 200000
    });

    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      message: 'Attributes updated successfully!'
    });

  } catch (error) {
    console.error('Update attributes error:', error);
    return NextResponse.json(
      { error: 'Failed to update attributes: ' + error.message },
      { status: 500 }
    );
  }
}
