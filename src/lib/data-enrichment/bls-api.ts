/**
 * BLS (Bureau of Labor Statistics) API Integration
 * Fetches economic data including unemployment rates and wages
 */

const BLS_API_KEY = process.env.BLS_API_KEY;
const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2';

interface BLSData {
  unemploymentRate: number;
  averageWage: number;
  laborForce: number;
}

export async function fetchBLSData(
  cityName: string,
  stateCode: string
): Promise<Partial<BLSData>> {
  if (!BLS_API_KEY) {
    console.warn('BLS API key not configured');
    return {};
  }

  try {
    // BLS uses MSA (Metropolitan Statistical Area) codes
    // For simplicity, we'll use state-level data
    // In production, you'd map cities to their MSA codes
    
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    
    // LAUCN + State FIPS + 0000000000 for state unemployment
    const stateFips = getStateCode(stateCode);
    const seriesId = `LAUST${stateFips}0000000000003`; // Unemployment rate
    
    const requestBody = {
      seriesid: [seriesId],
      startyear: startYear.toString(),
      endyear: currentYear.toString(),
      registrationkey: BLS_API_KEY,
    };

    const response = await fetch(`${BLS_BASE_URL}/timeseries/data/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`BLS API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API request failed: ${data.message}`);
    }

    const series = data.Results?.series?.[0];
    if (!series || !series.data || series.data.length === 0) {
      return {};
    }

    // Get the most recent data point
    const latestData = series.data[0];
    const unemploymentRate = parseFloat(latestData.value);

    return {
      unemploymentRate: isNaN(unemploymentRate) ? 0 : unemploymentRate,
    };
  } catch (error) {
    console.error('Error fetching BLS data:', error);
    return {};
  }
}

// State code to BLS state code mapping
function getStateCode(stateAbbr: string): string {
  const stateMap: Record<string, string> = {
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
  
  return stateMap[stateAbbr.toUpperCase()] || '00';
}
