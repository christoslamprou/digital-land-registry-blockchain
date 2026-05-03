const blockchainService = require('../services/blockchainService');
const pinataService = require('../services/pinataService');
const PropertyRecord = require('../models/PropertyRecord');

// Mint a new property
exports.mintToken = async (req, res) => {
    try {
        // Extract all fields, including the new off-chain metadata
        const { 
            assetId, 
            ownerHash, 
            fullAddress, 
            surfaceArea, 
            objectiveValue, 
            landUsage, 
            constructionYear 
        } = req.body;
        const file = req.file;

        if (!assetId || !ownerHash || !file || !fullAddress || !surfaceArea) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log(`Processing mint request for: ${assetId}`);

        // Step 1: Save Off-Chain Data to PostgreSQL
        console.log("Saving metadata to PostgreSQL...");
        await PropertyRecord.create({
            kaek: assetId,
            fullAddress: fullAddress,
            surfaceArea: parseFloat(surfaceArea),
            objectiveValue: objectiveValue ? parseFloat(objectiveValue) : null,
            landUsage: landUsage || null,
            constructionYear: constructionYear ? parseInt(constructionYear) : null
        });

        // Step 2: Upload Document to IPFS
        const documentRootHash = await pinataService.uploadToIPFS(file.buffer, file.originalname);
        
        // Step 3: Save On-Chain Data to Hyperledger Fabric
        const result = await blockchainService.mintProperty(assetId, ownerHash, documentRootHash);

        res.status(201).json({
            message: "Property successfully registered in Database and Blockchain",
            ipfsHash: documentRootHash,
            transactionResult: result
        });
    } catch (error) {
        console.error("Mint error:", error);
        
        // If DB insertion fails (e.g., duplicate KAEK), it will automatically throw an error 
        // and prevent the Blockchain transaction from executing. This ensures data consistency.
        res.status(500).json({ error: error.message });
    }
};

// Transfer property ownership
exports.transferToken = async (req, res) => {
    try {
        const { assetId, currentOwnerHash, newOwnerHash } = req.body;
        const file = req.file;

        if (!assetId || !currentOwnerHash || !newOwnerHash || !file) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log(`Processing transfer for: ${assetId}`);

        const newDocumentRootHash = await pinataService.uploadToIPFS(file.buffer, file.originalname);
        const result = await blockchainService.transferProperty(assetId, currentOwnerHash, newOwnerHash, newDocumentRootHash);

        res.status(200).json({
            message: "Success",
            newIpfsHash: newDocumentRootHash,
            transactionResult: result
        });
    } catch (error) {
        console.error("Transfer error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Read property details
exports.readToken = async (req, res) => {
    try {
        const assetId = req.params.id;
        
        if (!assetId) {
            return res.status(400).json({ error: "Asset ID is required" });
        }

        console.log(`Fetching data for: ${assetId}`);
        const result = await blockchainService.queryProperty(assetId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Read error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Retrieve property history
exports.getHistory = async (req, res) => {
    try {
        const assetId = req.params.id;
        
        if (!assetId) {
            return res.status(400).json({ error: "Asset ID is required" });
        }

        console.log(`Fetching history for: ${assetId}`);
        const result = await blockchainService.getAssetHistory(assetId);
        res.status(200).json(JSON.parse(result));
    } catch (error) {
        console.error("History error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all properties from PostgreSQL
exports.getAllProperties = async (req, res) => {
    try {
        const properties = await PropertyRecord.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};