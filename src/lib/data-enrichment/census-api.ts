/**
 * Census API Integration
 * Fetches demographic and population data from the US Census Bureau API
 */

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const CENSUS_BASE_URL = 'https://api.census.gov/data';

interface CensusData {
  population: number;
  medianAge: number;
  medianIncome: number;
  collegeEducated: number;
  medianHomeValue: number;
}

export async function fetchCensusData(
  cityName: string,
  stateCode: string
): Promise<Partial<CensusData>> {
  if (!CENSUS_API_KEY) {
    console.warn('Census API key not configured');
    return {};
  }

  try {
    // ACS 5-Year Estimates (most comprehensive)
    const year = 2022; // Latest available
    const url = `${CENSUS_BASE_URL}/${year}/acs/acs5`;

    // Fetch demographic data
    // B01003_001E: Total Population
    // B01002_001E: Median Age
    // B19013_001E: Median Household Income
    // B15003_022E: Bachelor's degree
    // B15003_023E: Master's degree
    // B15003_024E: Professional degree
    // B15003_025E: Doctorate degree
    // B25077_001E: Median Home Value
    
    const variables = [
      'B01003_001E', // Population
      'B01002_001E', // Median Age
      'B19013_001E', // Median Income
      'B15003_022E', // Bachelor's
      'B15003_023E', // Master's
      'B15003_024E', // Professional
      'B15003_025E', // Doctorate
      'B25077_001E', // Median Home Value
    ].join(',');

    const params = new URLSearchParams({
      get: variables,
      for: `place:*`,
      in: `state:${getStateFips(stateCode)}`,
      key: CENSUS_API_KEY,
    });

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Census API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse response (first row is headers, subsequent rows are data)
    if (data.length < 2) {
      return {};
    }

    // Find the row matching our city
    const cityRow = data.slice(1).find((row: any[]) => {
      // Census place names often include "city" or "town"
      const placeName = row[row.length - 1];
      return placeName.toLowerCase().includes(cityName.toLowerCase());
    });

    if (!cityRow) {
      console.warn(`City ${cityName} not found in Census data`);
      return {};
    }

    const [
      population,
      medianAge,
      medianIncome,
      bachelors,
      masters,
      professional,
      doctorate,
      medianHomeValue,
    ] = cityRow;

    // Calculate percentage with college degree
    const totalPopulation = parseInt(population) || 0;
    const collegeGrads = 
      (parseInt(bachelors) || 0) +
      (parseInt(masters) || 0) +
      (parseInt(professional) || 0) +
      (parseInt(doctorate) || 0);
    
    const collegeEducated = totalPopulation > 0 
      ? Math.round((collegeGrads / totalPopulation) * 100)
      : 0;

    return {
      population: parseInt(population) || 0,
      medianAge: parseFloat(medianAge) || 0,
      medianIncome: parseInt(medianIncome) || 0,
      collegeEducated,
      medianHomeValue: parseInt(medianHomeValue) || 0,
    };
  } catch (error) {
    console.error('Error fetching Census data:', error);
    return {};
  }
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
