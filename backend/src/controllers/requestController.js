const PropertyRequest = require('../models/PropertyRequest');
const PropertyRecord = require('../models/PropertyRecord');
const pinataService = require('../services/pinataService');
const blockchainService = require('../services/blockchainService');

// Citizen creates a new property registration or modification request
exports.createRequest = async (req, res) => {
    try {
        const { requestType, assetId, ownerHash, fullAddress, surfaceArea, objectiveValue, landUsage, constructionYear } = req.body;
        const file = req.file;

        if (!requestType || !assetId || !ownerHash || !file) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Upload document to IPFS via Pinata
        const documentHash = await pinataService.uploadToIPFS(file.buffer, file.originalname);

        // Save temporary request to PostgreSQL database
        const newRequest = await PropertyRequest.create({
            requestType,
            assetId,
            ownerHash,
            fullAddress: fullAddress || null,
            surfaceArea: surfaceArea ? parseFloat(surfaceArea) : null,
            objectiveValue: objectiveValue ? parseFloat(objectiveValue) : null,
            landUsage: landUsage || null,
            constructionYear: constructionYear ? parseInt(constructionYear) : null,
            documentHash
        });

        res.status(201).json({ message: "Request submitted successfully", request: newRequest });
    } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ error: error.message });
    }
};

// Fetch requests based on the user's role
exports.getRequests = async (req, res) => {
    try {
        const role = req.headers['user-role']; 
        let requests = [];

        if (role === 'engineer') {
            // Engineers only see requests that need their initial review
            requests = await PropertyRequest.findAll({ where: { engineerStatus: 'PENDING' } });
        } else if (role === 'staff') {
            // Staff members only see requests approved by engineers but pending final approval
            requests = await PropertyRequest.findAll({ where: { engineerStatus: 'APPROVED', staffStatus: 'PENDING' } });
        } else {
            return res.status(403).json({ error: "Unauthorized role access" });
        }

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ error: error.message });
    }
};

// Engineer reviews the request (Approve/Reject)
exports.engineerReview = async (req, res) => {
    try {
        const { requestId, status, comments } = req.body; // status should be 'APPROVED' or 'REJECTED'

        const request = await PropertyRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        request.engineerStatus = status;
        if (comments) request.comments = comments;
        await request.save();

        res.status(200).json({ message: `Request updated by engineer to ${status}`, request });
    } catch (error) {
        console.error("Engineer review error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Staff provides final approval and executes Blockchain transactions
exports.staffFinalApproval = async (req, res) => {
    try {
        const { requestId, status, comments } = req.body; 

        const request = await PropertyRequest.findByPk(requestId);
        if (!request || request.engineerStatus !== 'APPROVED') {
            return res.status(400).json({ error: "Invalid request or missing engineer approval" });
        }

        request.staffStatus = status;
        if (comments) request.comments = comments;
        await request.save();

        // If rejected by staff, update DB and stop execution
        if (status === 'REJECTED') {
            return res.status(200).json({ message: "Request rejected by staff", request });
        }

        // IF APPROVED: Execute Web3 / Blockchain transactions based on request type
        if (request.requestType === 'MINT') {
            // 1. Save On-Chain (Hyperledger Fabric)
            await blockchainService.mintProperty(request.assetId, request.ownerHash, request.documentHash);

            // 2. Save Off-Chain (PostgreSQL production records)
            await PropertyRecord.create({
                kaek: request.assetId,
                ownerHash: request.ownerHash,
                fullAddress: request.fullAddress,
                surfaceArea: request.surfaceArea,
                objectiveValue: request.objectiveValue,
                landUsage: request.landUsage,
                constructionYear: request.constructionYear
            });
            
        } else if (request.requestType === 'UPDATE') {
            // Re-assign ownership to the same owner to record the updated document hash on-chain
            await blockchainService.transferProperty(request.assetId, request.ownerHash, request.ownerHash, request.documentHash);

            // Update off-chain PostgreSQL database
            await PropertyRecord.update(
                {
                    fullAddress: request.fullAddress,
                    surfaceArea: request.surfaceArea,
                    objectiveValue: request.objectiveValue,
                    landUsage: request.landUsage,
                    constructionYear: request.constructionYear
                },
                { where: { kaek: request.assetId } }
            );
        }

        res.status(200).json({ message: "Request finalized and committed to Blockchain and Database successfully" });
    } catch (error) {
        console.error("Staff final approval error:", error);
        res.status(500).json({ error: error.message });
    }
};