import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { uploadFileToPinata, uploadMetadataToPinata } from '../../services/pinata';

const EDITABLE_NFT_ABI = [
  "function mint(string memory metadataUri) public returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function exists(uint256 tokenId) public view returns (bool)",
  "event TokenMinted(uint256 indexed tokenId, address indexed to, string metadataUri)"
];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const imageFile = formData.get('image');
    const attributes = formData.get('attributes');

    if (!name || !description || !imageFile) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, description, and image are required' 
      }, { status: 400 });
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Private key not configured' }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `nft-image-${Date.now()}.${imageFile.name.split('.').pop()}`;

    console.log('Uploading image to Pinata...');
    const imageHash = await uploadFileToPinata(imageBuffer, imageFileName);
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

    let parsedAttributes = [];
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (e) {
        console.warn('Invalid attributes JSON, using empty array');
      }
    }

    const metadata = {
      name: name,
      description: description,
      image: imageUrl,
      attributes: parsedAttributes
    };

    console.log('Uploading metadata to Pinata...');
    const metadataHash = await uploadMetadataToPinata(metadata, `nft-metadata-${Date.now()}`);
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;

    return NextResponse.json({
      success: true,
      metadataUrl: metadataUrl,
      imageUrl: imageUrl,
      metadata: metadata,
      message: 'Metadata uploaded successfully! Ready to mint.'
    });

  } catch (error) {
    console.error('Minting error:', error);
    return NextResponse.json(
      { error: 'Failed to mint: ' + error.message },
      { status: 500 }
    );
  }
}
