const blockchainService = require('../services/blockchainService');
const pinataService = require('../services/pinataService');

/**
 * Handles the request to mint a new property token
 */
exports.mintToken = async (req, res) => {
    try {
        // Extract text fields from the request body
        const { assetId, ownerHash } = req.body;
        
        // Extract the uploaded file (caught by multer)
        const file = req.file;

        // Validation: Check if all required fields and the file exist
        if (!assetId || !ownerHash || !file) {
            return res.status(400).json({ 
                error: "Missing required fields. Please provide assetId, ownerHash, and a document file." 
            });
        }

        console.log(`[Controller] Processing minting request for Asset: ${assetId}`);

        // Step 1: Upload the file to IPFS and get the hash (CID)
        const documentRootHash = await pinataService.uploadToIPFS(file.buffer, file.originalname);

        // Step 2: Send the data (including the actual IPFS hash) to the Blockchain
        const result = await blockchainService.mintProperty(assetId, ownerHash, documentRootHash);

        // Return success response to the client
        res.status(201).json({
            message: "Property registered successfully",
            ipfsHash: documentRootHash,
            transactionResult: result
        });

    } catch (error) {
        console.error("[Controller] Error in mintToken:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handles the request to read an existing property
 */
exports.readToken = async (req, res) => {
    try {
        const assetId = req.params.id;
        
        if (!assetId) {
            return res.status(400).json({ error: "Asset ID is required" });
        }

        console.log(`[Controller] Fetching data for Asset: ${assetId}`);
        
        const result = await blockchainService.queryProperty(assetId);
        
        res.status(200).json(result);

    } catch (error) {
        console.error("[Controller] Error in readToken:", error);
        res.status(500).json({ error: error.message });
    }
};