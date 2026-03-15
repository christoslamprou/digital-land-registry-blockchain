# Environment Setup Guide: Digital Land Registry (Hyperledger Fabric)

This guide provides step-by-step instructions to set up the development environment for the Digital Land Registry project. The setup is based on an Ubuntu/Debian Linux environment.

---

# 1. System Preparation

Before installing the core blockchain components, we need to update the system and install basic utility tools.

```bash
# Update the package lists and upgrade existing packages
sudo apt update && sudo apt upgrade -y

# Install Git (version control), cURL (download tool), and jq (JSON processor)
sudo apt install git curl jq -y

```

# 2. Docker & Docker Compose V2 Installation

Hyperledger Fabric network nodes run entirely inside Docker containers. We require Docker and the modern Docker Compose V2 plugin.

```bash

# Install the core Docker engine
sudo apt install docker.io -y

# Start the Docker service and enable it to run on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add the current user to the docker group to run commands without 'sudo'
# (Note: A system reboot or logout/login is required after this step)
sudo usermod -aG docker $USER

# Create a directory for Docker CLI plugins
mkdir -p ~/.docker/cli-plugins/

# Download the Docker Compose V2 binary directly from the official repository
curl -SL https://github.com/docker/compose/releases/download/v2.25.0/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose

# Grant execution permissions to the downloaded binary
chmod +x ~/.docker/cli-plugins/docker-compose

# Verify the installation (should output version v2.x.x)
docker compose version

```

# 3. Node.js Installation (via NVM)

Since the Smart Contract (Chaincode) and Backend are written in TypeScript/Node.js, we need to install Node.js. Node Version Manager (NVM) is used for flexible version management.

```bash

# Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Load NVM into the current shell session
source ~/.bashrc

# Install and use Node.js version 18 (Long Term Support)
nvm install 18
nvm use 18

```

# 4. Hyperledger Fabric Installation

We use the official Fabric script to download the necessary Docker images, command-line binaries, and configuration samples.

```bash

# Create the main project directory and navigate into it
mkdir ~/digital-land-registry
cd ~/digital-land-registry

# Download the official Fabric installation script
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh

# Make the script executable
chmod +x install-fabric.sh

# Run the script to fetch Docker images, sample configs, and binaries
./install-fabric.sh docker samples binary

# Add the downloaded Fabric binaries to the system PATH globally
echo 'export PATH=$PATH:'$HOME'/digital-land-registry/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc

```

# 5. Starting the Test Network

To verify the installation and prepare the blockchain environment, we start the default Fabric Test Network.

```bash

# Navigate to the test-network directory
cd ~/digital-land-registry/fabric-samples/test-network

# Shut down any previous running networks and clean up containers/volumes
./network.sh down

# Start the network (creates 2 Peer organizations and 1 Orderer node)
./network.sh up

# Create a private blockchain channel named 'mychannel'
./network.sh createChannel -c mychannel

```

# 6. Initializing the Smart Contract (Chaincode) Workspace

With the network running, we initialize an isolated Node.js/TypeScript environment for our Smart Contract development.

```bash

# Navigate back to the root project folder
cd ~/digital-land-registry

# Create a directory specifically for the chaincode
mkdir -p chaincode/land-registry
cd chaincode/land-registry

# Initialize a new Node.js project (creates package.json)
npm init -y

# Install Hyperledger Fabric smart contract libraries
npm install fabric-contract-api fabric-shim

# Install TypeScript and Node types for development purposes
npm install --save-dev typescript @types/node

# Generate the TypeScript configuration file (tsconfig.json)
npx tsc --init

```

# 7. Smart Contract (Chaincode) Development

The core business logic of the Digital Land Registry is implemented as a TypeScript Smart Contract. It defines the AssetToken model and handles the core transactions (Mint, Transfer, Read, and History).

# 7.1. Writing the Code

Ensure you are in the chaincode directory (~/digital-land-registry/chaincode/land-registry). The source code is located in the src folder:

    src/asset.ts: Defines the property structure (assetId, ownerHash, documentRootHash, status).

    src/landRegistryContract.ts: Contains the transaction logic (mintNewToken, transferOwnership, readToken, getAssetHistory).

    src/index.ts: Exports the contract for the Fabric network.

# 7.2. Building the Chaincode

Since Hyperledger Fabric requires JavaScript to execute Node.js chaincode, we must compile our TypeScript code first.

```bash

cd ~/digital-land-registry/chaincode/land-registry

# Compile TypeScript to JavaScript (outputs to the 'dist' folder)
npm run build

```

# 8. Deploying the Chaincode to the Network

With the test network running and the channel created, we deploy the compiled chaincode to the blockchain.

```bash

cd ~/digital-land-registry/fabric-samples/test-network

# Optional Troubleshooting: If the deployment fails due to a missing nodeenv image, run:
# docker pull hyperledger/fabric-nodeenv:2.5

# Deploy the chaincode (Version 1.0, Sequence 1)
./network.sh deployCC -ccn land-registry -ccp ../../chaincode/land-registry -ccl typescript -ccv 1.0 -ccs 1

Important Note: Whenever the smart contract code is updated, the version (-ccv) and sequence (-ccs) numbers must be incremented (e.g., 2.0 and 2, or 3.0 and 3).

```

# 9. Interacting with the Blockchain (Testing)

To test the deployed chaincode via the CLI, we first need to set up the environment variables to act as Organization 1 (State/Registry).

```bash

# Set environment variables for Org1 Admin
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

```

# 9.1. Minting (Registering) a New Property

This transaction writes a new asset to the ledger. We use invoke because it modifies the blockchain state.

```bash

peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n land-registry \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"mintNewToken","Args":["KAEK-12345", "hash_owner_A", "hash_ipfs_doc_A"]}'

```

# 9.2. Reading a Property

To fetch the current state of an asset without altering the ledger, we use a read-only query.

```bash

peer chaincode query -C mychannel -n land-registry -c '{"Args":["readToken","KAEK-12345"]}'

```

# 9.3. Transferring Ownership

This transaction transfers the property from Owner A to Owner B, updating the owner hash and the document hash (e.g., a new contract).

```bash

peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n land-registry \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"transferOwnership","Args":["KAEK-12345", "hash_owner_A", "hash_owner_B", "hash_ipfs_doc_B"]}'

```

# 9.4. Viewing the Audit Trail (History)

To prove immutability, we query the complete history of the asset, showing every change since its creation. We pipe the output to jq for readable JSON formatting.

```bash

peer chaincode query -C mychannel -n land-registry -c '{"Args":["getAssetHistory","KAEK-12345"]}' | jq .

```