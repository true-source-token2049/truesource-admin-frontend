/**
 * Upload a file to Pinata
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name of the file
 * @returns {Promise<string>} - The IPFS hash of the uploaded file
 */
export async function uploadFileToPinata(fileBuffer, fileName) {
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

  const formData = new FormData();
  const blob = new Blob([fileBuffer]);
  formData.append('file', blob, fileName);

  const metadata = JSON.stringify({
    name: fileName,
    keyvalues: {
      type: 'nft-image'
    }
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0
  });
  formData.append('pinataOptions', options);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${result.error?.details || result.error || 'Unknown error'}`);
    }

    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw new Error(`Failed to upload to Pinata: ${error.message}`);
  }
}

/**
 * Upload JSON metadata to Pinata
 * @param {Object} metadata - The metadata object to upload
 * @param {string} name - The name for the metadata file
 * @returns {Promise<string>} - The IPFS hash of the uploaded metadata
 */
export async function uploadMetadataToPinata(metadata, name) {
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: name,
        keyvalues: {
          type: 'nft-metadata'
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    })
  };

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${result.error?.details || result.error || 'Unknown error'}`);
    }

    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    throw new Error(`Failed to upload metadata to Pinata: ${error.message}`);
  }
}
