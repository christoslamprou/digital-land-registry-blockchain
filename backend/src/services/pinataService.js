const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_API_SECRET;

/**
 * Uploads a file to IPFS via Pinata API
 * @param {Buffer} fileBuffer - The file data in memory
 * @param {string} originalname - The original name of the file (e.g., contract.pdf)
 * @returns {Promise<string>} - The unique IPFS Hash (CID)
 */
async function uploadToIPFS(fileBuffer, originalname) {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    // Create form data payload to hold the file
    const data = new FormData();
    data.append('file', fileBuffer, {
        filename: originalname
    });

    try {
        console.log(`[IPFS] Uploading file ${originalname} to Pinata...`);
        
        const response = await axios.post(url, data, {
            maxBodyLength: 'Infinity', 
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataSecretApiKey
            }
        });

        console.log(`[IPFS] Success! IPFS CID: ${response.data.IpfsHash}`);
        
        // Return only the Hash, which is what we need for the Blockchain
        return response.data.IpfsHash; 
        
    } catch (error) {
        console.error("[IPFS] Error uploading to Pinata:", error.message);
        throw error;
    }
}

module.exports = { uploadToIPFS };