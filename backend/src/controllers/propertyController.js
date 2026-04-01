const blockchainService = require('../services/blockchainService');

// Handle property registration request
async function mintToken(req, res) {
    try {
        const { assetId, ownerHash, documentRootHash } = req.body;
        
        // Basic validation to ensure all fields are provided
        if (!assetId || !ownerHash || !documentRootHash) {
            return res.status(400).json({ error: 'Missing required fields: assetId, ownerHash, documentRootHash' });
        }
        
        // Call the blockchain service
        const result = await blockchainService.mintProperty(assetId, ownerHash, documentRootHash);
        res.status(201).json({ message: 'Property registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Handle property query request
async function readToken(req, res) {
    try {
        const { id } = req.params;
        
        // Call the blockchain service
        const result = await blockchainService.queryProperty(id);
        res.status(200).json(JSON.parse(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    mintToken,
    readToken
};