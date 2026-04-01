const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // 1. Define the wallet path
        const walletPath = path.join(__dirname, '..', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path defined at: ${walletPath}`);

        // 2. Define the path to the Admin credentials in the test-network
        const credPath = path.join(__dirname, '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp');
        const certPath = path.join(credPath, 'signcerts', 'Admin@org1.example.com-cert.pem');
        const keyDirectoryPath = path.join(credPath, 'keystore');

        // 3. Read the public certificate
        const certificate = fs.readFileSync(certPath).toString();

        // 4. Read the private key (read the first file in the keystore directory)
        const files = fs.readdirSync(keyDirectoryPath);
        const keyPath = path.join(keyDirectoryPath, files[0]);
        const privateKey = fs.readFileSync(keyPath).toString();

        // 5. Create the identity object for Node.js
        const identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // 6. Save the identity to the wallet as 'admin'
        await wallet.put('admin', identity);
        console.log('Success: Admin identity saved to the wallet.');

    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

main();