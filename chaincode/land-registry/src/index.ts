import { LandRegistryContract } from './landRegistryContract';

// Export the smart contract so the Fabric network can discover and deploy it
export const contracts: any[] = [LandRegistryContract];