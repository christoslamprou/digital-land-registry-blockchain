import { Object, Property } from 'fabric-contract-api';

// Marks this class as a state object stored in the blockchain ledger
@Object()
export class AssetToken {
    @Property()
    public assetId!: string; // The property's unique identifier (e.g., KAEK)

    @Property()
    public ownerHash!: string; // The encrypted identity of the current owner

    @Property()
    public documentRootHash!: string; // The IPFS hash of the property's legal documents

    @Property()
    public status!: string; // The current status of the asset (e.g., 'Active', 'Locked')
}