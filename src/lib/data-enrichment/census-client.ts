// Census API Client for demographic and population data
// API Docs: https://www.census.gov/data/developers/data-sets.html

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const CENSUS_BASE_URL = 'https://api.census.gov/data';

interface CensusResponse {
  population?: number;
  medianAge?: number;
  medianIncome?: number;
  collegeEducated?: number;
  householdSize?: number;
}

export async function fetchCensusData(
  cityName: string,
  stateCode: string
): Promise<CensusResponse> {
  if (!CENSUS_API_KEY) {
    console.warn('Census API key not configured');
    return {};
  }

  try {
    // ACS 5-Year Estimates (most comprehensive city-level data)
    const year = 2022; // Latest available
    const url = `${CENSUS_BASE_URL}/${year}/acs/acs5`;
    
    // Variables we want:
    // B01003_001E: Total Population
    // B01002_001E: Median Age
    // B19013_001E: Median Household Income
    // B15003_022E: Bachelor's degree holders
    // B11016_001E: Average household size
    
    const variables = [
      'B01003_001E', // Population
      'B01002_001E', // Median Age
      'B19013_001E', // Median Income
      'B15003_022E', // College educated
      'B11016_001E', // Household size
    ].join(',');

    const params = new URLSearchParams({
      get: variables,
      for: `place:*`,
      in: `state:${getStateFips(stateCode)}`,
      key: CENSUS_API_KEY,
    });

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      console.error('Census API error:', response.statusText);
      return {};
    }

    const data = await response.json();
    
    // Find the city in the results
    const cityData = findCityInResults(data, cityName);
    
    if (!cityData) {
      console.warn(`City ${cityName}, ${stateCode} not found in Census data`);
      return {};
    }

    return {
      population: parseInt(cityData[0]) || undefined,
      medianAge: parseFloat(cityData[1]) || undefined,
      medianIncome: parseInt(cityData[2]) || undefined,
      collegeEducated: parseInt(cityData[3]) || undefined,
      householdSize: parseFloat(cityData[4]) || undefined,
    };
  } catch (error) {
    console.error('Error fetching Census data:', error);
    return {};
  }
}

function findCityInResults(data: any[], cityName: string): any[] | null {
  // First row is headers, rest are data
  if (!data || data.length < 2) return null;
  
  // Simple name matching (can be improved with fuzzy matching)
  const normalized = cityName.toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // City name is typically in the last column
    const rowCityName = row[row.length - 1]?.toLowerCase();
    if (rowCityName?.includes(normalized)) {
      return row;
    }
  }
  
  return null;
}

// State FIPS codes mapping
function getStateFips(stateCode: string): string {
  const fipsMap: Record<string, string> = {
    AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06',
    CO: '08', CT: '09', DE: '10', FL: '12', GA: '13',
    HI: '15', ID: '16', IL: '17', IN: '18', IA: '19',
    KS: '20', KY: '21', LA: '22', ME: '23', MD: '24',
    MA: '25', MI: '26', MN: '27', MS: '28', MO: '29',
    MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34',
    NM: '35', NY: '36', NC: '37', ND: '38', OH: '39',
    OK: '40', OR: '41', PA: '42', RI: '44', SC: '45',
    SD: '46', TN: '47', TX: '48', UT: '49', VT: '50',
    VA: '51', WA: '53', WV: '54', WI: '55', WY: '56',
    DC: '11',
  };
  
  return fipsMap[stateCode.toUpperCase()] || '00';
}
