import * as fcl from '@onflow/fcl'

// Contract addresses
export const CONTRACT_ADDRESS = '0xa89655a0f8e3d113' // Testnet address
export const FLOW_TOKEN_ADDRESS = '0x7e60df042a9c0868' // Testnet FlowToken
export const FUNGIBLE_TOKEN_ADDRESS = '0x9a0766d93b6608b7' // Testnet FungibleToken

// Configure FCL
fcl.config({
  'app.detail.title': 'EsusuChain',
  'app.detail.icon': 'https://placekitten.com/g/200/200',
  'accessNode.api': 'https://rest-testnet.onflow.org', // Testnet Access Node
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn', // Testnet wallet discovery
  'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/testnet/authn',
  '0xEsusuChain': CONTRACT_ADDRESS,
  '0xFlowToken': FLOW_TOKEN_ADDRESS,
  '0xFungibleToken': FUNGIBLE_TOKEN_ADDRESS,
})

export default fcl
