// Main infrastructure template for TechPromo
// This deploys Azure AI Search service

targetScope = 'resourceGroup'

@description('Name of the application')
param appName string = 'techpromo'

@description('Environment name (dev, test, prod)')
param environmentName string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

// Deploy Azure AI Search service
module searchService 'ai-search.bicep' = {
  name: 'searchService'
  params: {
    searchServiceName: '${appName}-search-${environmentName}'
    location: location
    sku: 'free' // Use free tier for development
    replicaCount: 1
    partitionCount: 1
  }
}

// Outputs
output searchServiceName string = searchService.outputs.searchServiceName
output searchServiceEndpoint string = searchService.outputs.searchServiceEndpoint
output searchServiceId string = searchService.outputs.searchServiceId