import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { AssetToken } from './asset';

@Info({ title: 'LandRegistryContract', description: 'Smart Contract for Digital Land Registry' })
export class LandRegistryContract extends Contract {

    // 1. Mint (Register) a new property
    @Transaction()
    public async mintNewToken(ctx: Context, assetId: string, ownerHash: string, documentRootHash: string): Promise<void> {
        // Check if the property already exists in the ledger
        const exists = await this.assetExists(ctx, assetId);
        if (exists) {
            throw new Error(`The asset with ID ${assetId} already exists.`);
        }

        // Create the new AssetToken object
        const asset: AssetToken = {
            assetId,
            ownerHash,
            documentRootHash,
            status: 'Active',
        };

        // Save the asset to the World State as a JSON buffer
        await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
    }

    // 2. Transfer property ownership
    @Transaction()
    public async transferOwnership(ctx: Context, assetId: string, currentOwnerHash: string, newOwnerHash: string, newDocumentHash: string): Promise<void> {
        // Fetch the asset from the ledger
        const assetString = await ctx.stub.getState(assetId);
        if (!assetString || assetString.length === 0) {
            throw new Error(`The asset with ID ${assetId} does not exist.`);
        }

        const asset: AssetToken = JSON.parse(assetString.toString());

        // Validate that the seller is the actual owner
        if (asset.ownerHash !== currentOwnerHash) {
            throw new Error(`Transfer failed: The provided owner hash does not match the actual owner.`);
        }
        
        // Ensure the asset is active and can be transferred
        if (asset.status !== 'Active') {
            throw new Error(`Transfer failed: The asset is currently locked.`);
        }

        // Update the asset with the new owner and new IPFS document hash
        asset.ownerHash = newOwnerHash;
        asset.documentRootHash = newDocumentHash;

        // Save the updated asset back to the blockchain
        await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
    }

    // 3. Read (Query) an existing property from the ledger
    @Transaction(false) // 'false' indicates this is a read-only query, it doesn't modify the blockchain state
    @Returns('string')
    public async readToken(ctx: Context, assetId: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(assetId);
        
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset with ID ${assetId} does not exist.`);
        }
        
        // Return the asset data as a stringified JSON
        return assetJSON.toString();
    }

    // 4. Get the history of an asset (Audit Trail)
    @Transaction(false)
    @Returns('string')
    public async getAssetHistory(ctx: Context, assetId: string): Promise<string> {
        // Fetch the historical records for the specific asset ID
        const iterator = await ctx.stub.getHistoryForKey(assetId);
        const allResults = [];

        while (true) {
            const res = await iterator.next();
            
            if (res.value && res.value.value) {
                // Convert Uint8Array to Buffer first, then to string to satisfy TypeScript
                const recordString = Buffer.from(res.value.value).toString('utf8');
                let Record;
                
                try {
                    Record = JSON.parse(recordString);
                } catch (err) {
                    Record = recordString; // Fallback in case it's not JSON
                }

                // Construct the historical transaction record
                const historyRecord = {
                    txId: res.value.txId, // The unique transaction ID on the blockchain
                    timestamp: res.value.timestamp, // When the transaction occurred
                    isDelete: res.value.isDelete, // Whether this transaction deleted the asset
                    record: Record // The actual state of the asset at that time
                };
                allResults.push(historyRecord);
            }
            
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults); // Return the complete history array
            }
        }
    }

    // Helper method to check if an asset exists
    @Transaction(false)
    @Returns('boolean')
    public async assetExists(ctx: Context, assetId: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(assetId);
        return assetJSON && assetJSON.length > 0;
    }
}