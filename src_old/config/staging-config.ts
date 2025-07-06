// Staging/Demo configuration
export const config = {
  development: {
    ESIGNET_API_URL: 'http://localhost:8089',
    MOCK_IDENTITY_URL: 'http://localhost:8088',
    IS_MOCK: true,
    ENVIRONMENT_LABEL: 'Development'
  },
  
  staging: {
    // Deploy mock servers to cloud hosting
    ESIGNET_API_URL: 'https://dlv-burundi-esignet.railway.app',
    MOCK_IDENTITY_URL: 'https://dlv-burundi-identity.railway.app', 
    IS_MOCK: true,
    ENVIRONMENT_LABEL: 'Demo/Testing Environment'
  },
  
  production: {
    ESIGNET_API_URL: 'https://esignet.burundi.gov.bi',
    MOCK_IDENTITY_URL: 'https://identity.burundi.gov.bi',
    IS_MOCK: false,
    ENVIRONMENT_LABEL: 'Production'
  }
};
