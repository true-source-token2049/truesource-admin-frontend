import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const EDITABLE_NFT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function exists(uint256 tokenId) public view returns (bool)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

const BLOCKS_PER_CHUNK = 10;
const MAX_BLOCKS_TO_SCAN = 1000;

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

    const currentOwner = await contract.ownerOf(tokenId);

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - MAX_BLOCKS_TO_SCAN);
    
    const filter = contract.filters.Transfer(null, null, tokenId);
    
    console.log(`Querying blocks ${fromBlock} to ${currentBlock} in chunks of ${BLOCKS_PER_CHUNK}`);
    
    let allEvents = [];
    try {
      for (let start = fromBlock; start <= currentBlock; start += BLOCKS_PER_CHUNK) {
        const end = Math.min(start + BLOCKS_PER_CHUNK - 1, currentBlock);
        try {
          const events = await contract.queryFilter(filter, start, end);
          allEvents.push(...events);
          
          if (start + BLOCKS_PER_CHUNK <= currentBlock) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (chunkError) {
          console.error(`Error querying blocks ${start} to ${end}:`, chunkError.message);
        }
      }
    } catch (error) {
      console.error('Error querying events:', error);
      return NextResponse.json({
        tokenId: tokenId,
        currentOwner: currentOwner,
        previousOwners: [],
        allOwners: [currentOwner],
        totalTransfers: 0,
        transfers: [],
        note: 'Could not fetch transfer history, showing current owner only'
      });
    }

    const transfers = allEvents.map(event => ({
      from: event.args.from,
      to: event.args.to,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }));

    transfers.sort((a, b) => a.blockNumber - b.blockNumber);

    const allOwners = [];
    const seenOwners = new Set();

    transfers.forEach(transfer => {
      if (!seenOwners.has(transfer.to.toLowerCase())) {
        seenOwners.add(transfer.to.toLowerCase());
        allOwners.push(transfer.to);
      }
    });

    const previousOwners = allOwners.slice(0, -1);

    return NextResponse.json({
      tokenId: tokenId,
      currentOwner: currentOwner,
      previousOwners: previousOwners,
      allOwners: allOwners,
      totalTransfers: transfers.length,
      transfers: transfers,
      note: transfers.length === 0 ? `Scanned last ${MAX_BLOCKS_TO_SCAN} blocks. No transfers found.` : undefined
    });

  } catch (error) {
    console.error('Error fetching NFT history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT history: ' + error.message },
      { status: 500 }
    );
  }
} 