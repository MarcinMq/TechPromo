// Azure AI Search service for TechPromo application
// This template creates a search service optimized for offer searching

@description('Name of the search service')
param searchServiceName string = 'techpromo-search-${uniqueString(resourceGroup().id)}'

@description('Location for all resources')
param location string = resourceGroup().location

@description('The pricing tier of the search service')
@allowed([
  'free'
  'basic'
  'standard'
  'standard2'
  'standard3'
])
param sku string = 'free'

@description('Replicas distribute search workloads across the service')
@minValue(1)
@maxValue(12)
param replicaCount int = 1

@description('Partitions allow for scaling of document storage and faster indexing')
@minValue(1) 
@maxValue(12)
param partitionCount int = 1

@description('Used to establish a predictable, static hosting environment for search services')
@allowed([
  'default'
  'highDensity'
])
param hostingMode string = 'default'

// Create the Azure AI Search service
resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchServiceName
  location: location
  sku: {
    name: sku
  }
  properties: {
    replicaCount: replicaCount
    partitionCount: partitionCount
    hostingMode: hostingMode
    // Security settings
    publicNetworkAccess: 'enabled'
    networkRuleSet: {
      ipRules: []
    }
    // Authentication options
    authOptions: {
      // Use both API keys and role-based access
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Output connection information
@description('The name of the search service')
output searchServiceName string = searchService.name

@description('The search service endpoint')
output searchServiceEndpoint string = 'https://${searchService.name}.search.windows.net'

@description('The search service resource ID')
output searchServiceId string = searchService.id
