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

        const existingProperty = await PropertyRecord.findOne({ where: { kaek: assetId } });
        if (existingProperty) {
            return res.status(400).json({ error: "Property already exists in local database" });
        }

        // Step 1: Upload Document to IPFS
        const documentRootHash = await pinataService.uploadToIPFS(file.buffer, file.originalname);
        
        // Step 2: Save On-Chain Data to Hyperledger Fabric
        // WE DO THIS BEFORE POSTGRESQL! If it fails, it jumps to catch() immediately.
        console.log("Registering asset on the Blockchain...");
        const result = await blockchainService.mintProperty(assetId, ownerHash, documentRootHash);

        // Step 3: Save Off-Chain Data to PostgreSQL
        // This will ONLY run if Step 2 was successful.
        console.log("Blockchain transaction successful. Saving metadata to PostgreSQL...");
        await PropertyRecord.create({
            kaek: assetId,
            ownerHash: ownerHash,
            fullAddress: fullAddress,
            surfaceArea: parseFloat(surfaceArea),
            objectiveValue: objectiveValue ? parseFloat(objectiveValue) : null,
            landUsage: landUsage || null,
            constructionYear: constructionYear ? parseInt(constructionYear) : null
        });

        res.status(201).json({
            message: "Property successfully registered in Database and Blockchain",
            ipfsHash: documentRootHash,
            transactionResult: result
        });
    } catch (error) {
        console.error("Mint error:", error);
        
        // The error will be sent back safely WITHOUT dirtying the database
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

        // 1. Upload new document to IPFS
        const newDocumentRootHash = await pinataService.uploadToIPFS(file.buffer, file.originalname);
        
        // 2. Execute transfer on Blockchain
        const result = await blockchainService.transferProperty(assetId, currentOwnerHash, newOwnerHash, newDocumentRootHash);

        // 3. UPDATE THE OFF-CHAIN POSTGRESQL DATABASE 
        await PropertyRecord.update(
            { ownerHash: newOwnerHash }, // Set the new owner's Hash/AFM
            { where: { kaek: assetId } }  // Find the property by KAEK
        );

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

// Get all properties owned by a specific hash (AFM)
exports.getPropertiesByOwner = async (req, res) => {
    try {
        const ownerHash = req.params.hash; // Gets the hash from the URL
        console.log(`Fetching properties for owner hash: ${ownerHash}`);

        // Fetch properties from the off-chain PostgreSQL database
        const PropertyRecord = require('../models/PropertyRecord'); 
        
        const properties = await PropertyRecord.findAll({
            where: { ownerHash: ownerHash }
        });

        // Even if empty, return an array so the frontend doesn't crash
        res.status(200).json(properties);
    } catch (error) {
        // NOW WE WILL SEE THE ERROR IN THE TERMINAL!
        console.error("Error fetching properties by owner:", error);
        res.status(500).json({ error: "Internal server error while fetching properties." });
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