const blockchainService = require('../services/blockchainService');
const pinataService = require('../services/pinataService');
const PropertyRecord = require('../models/PropertyRecord');
const TransferRequest = require('../models/TransferRequest');

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


// 1. Propose Transfer (Notary Only)
exports.proposeTransfer = async (req, res) => {
    try {
        const { assetId, currentOwnerHash, newOwnerHash } = req.body;
        const file = req.file;

        if (!assetId || !currentOwnerHash || !newOwnerHash || !file) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Upload the proposed document to IPFS
        const documentHash = await pinataService.uploadToIPFS(file.buffer, file.originalname);
        
        // Create the pending request in PostgreSQL
        const transferReq = await TransferRequest.create({
            assetId,
            currentOwnerHash,
            newOwnerHash,
            documentHash,
            status: 'PENDING'
        });

        res.status(201).json({ message: "Transfer proposed successfully. Waiting for citizen approvals.", request: transferReq });
    } catch (error) {
        console.error("Propose Transfer Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Approve Transfer (Citizen Only)
exports.approveTransfer = async (req, res) => {
    try {
        const { requestId, userHash } = req.body;
        
        const transferReq = await TransferRequest.findByPk(requestId);
        if (!transferReq) return res.status(404).json({ error: "Request not found" });

        // Check who is approving
        if (transferReq.currentOwnerHash === userHash) {
            transferReq.currentOwnerApproved = true;
        } else if (transferReq.newOwnerHash === userHash) {
            transferReq.newOwnerApproved = true;
        } else {
            return res.status(403).json({ error: "You are not a party in this transfer." });
        }

        // If both approved, change status to READY
        if (transferReq.currentOwnerApproved && transferReq.newOwnerApproved) {
            transferReq.status = 'READY';
        }

        await transferReq.save();
        res.status(200).json({ message: "Approval registered successfully", request: transferReq });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Execute Transfer (Notary Only - Finalizes on Blockchain)
exports.executeTransfer = async (req, res) => {
    try {
        const { requestId } = req.body;
        
        const transferReq = await TransferRequest.findByPk(requestId);
        if (!transferReq || transferReq.status !== 'READY') {
            return res.status(400).json({ error: "Transfer is not ready or does not exist." });
        }

        console.log(`Executing transfer on Blockchain for: ${transferReq.assetId}`);

        // Execute on Blockchain
        const result = await blockchainService.transferProperty(
            transferReq.assetId, 
            transferReq.currentOwnerHash, 
            transferReq.newOwnerHash, 
            transferReq.documentHash
        );

        // Update Off-Chain Database
        await PropertyRecord.update(
            { ownerHash: transferReq.newOwnerHash },
            { where: { kaek: transferReq.assetId } }
        );

        // Mark request as completed
        transferReq.status = 'COMPLETED';
        await transferReq.save();

        res.status(200).json({ message: "Transfer officially completed on Blockchain!", transactionResult: result });
    } catch (error) {
        console.error("Execute Transfer Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 4. Helper Route: Get Pending Transfers
exports.getTransfers = async (req, res) => {
    try {
        const role = req.headers['user-role'];
        const userHash = req.query.userHash; // Optional, for citizens

        let whereClause = { status: ['PENDING', 'READY'] };

        // If citizen is asking, only show transfers involving them
        if (role === 'citizen' && userHash) {
            whereClause = {
                ...whereClause,
                [require('sequelize').Op.or]: [
                    { currentOwnerHash: userHash },
                    { newOwnerHash: userHash }
                ]
            };
        }

        const transfers = await TransferRequest.findAll({ where: whereClause });
        res.status(200).json(transfers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Read property details (merging Blockchain state with PostgreSQL metadata)
exports.readToken = async (req, res) => {
    try {
        const assetId = req.params.id;
        
        if (!assetId) {
            return res.status(400).json({ error: "Asset ID is required" });
        }

        console.log(`Fetching data for: ${assetId}`);

        // 1. Fetch the state from the Blockchain (Hyperledger Fabric)
        const blockchainDataBuffer = await blockchainService.queryProperty(assetId);
        
        let blockchainData = {};
        try {
            // Convert the buffer returned by Fabric into a JSON object
            blockchainData = JSON.parse(blockchainDataBuffer.toString());
        } catch (parseError) {
            // Fallback in case the blockchain returns a raw string instead of JSON
            blockchainData = { rawData: blockchainDataBuffer.toString() };
        }

        // 2. Fetch the rich metadata from the PostgreSQL Database
        const dbRecord = await PropertyRecord.findOne({ where: { kaek: assetId } });

        // 3. Merge the data if the record exists in the database
        if (dbRecord) {
            const combinedData = {
                ...blockchainData,
                fullAddress: dbRecord.fullAddress,
                surfaceArea: dbRecord.surfaceArea,
                landUsage: dbRecord.landUsage,
                constructionYear: dbRecord.constructionYear,
                objectiveValue: dbRecord.objectiveValue
            };
            return res.status(200).json(combinedData);
        }

        // Fallback: If it exists on-chain but not in the DB, return just the blockchain data
        return res.status(200).json(blockchainData);

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