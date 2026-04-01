const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Function to establish a connection to the Fabric network
async function getContract() {
    // 1. Load the connection profile
    const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. Load the wallet
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 3. Connect to the gateway using the admin identity
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
    });

    // 4. Get the network (channel) and the smart contract
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('land-registry');

    return { contract, gateway };
}

// Function to mint (register) a new property
async function mintProperty(assetId, ownerHash, documentRootHash) {
    const { contract, gateway } = await getContract();
    try {
        // Use submitTransaction for writing data to the ledger
        const result = await contract.submitTransaction('mintNewToken', assetId, ownerHash, documentRootHash);
        return result.toString();
    } finally {
        // Always disconnect the gateway when done
        gateway.disconnect();
    }
}

// Function to read a property from the ledger
async function queryProperty(assetId) {
    const { contract, gateway } = await getContract();
    try {
        // Use evaluateTransaction for reading data (does not require consensus)
        const result = await contract.evaluateTransaction('readToken', assetId);
        return result.toString();
    } finally {
        gateway.disconnect();
    }
}

module.exports = {
    mintProperty,
    queryProperty
};