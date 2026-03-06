// Bureau of Labor Statistics API Client
// API Docs: https://www.bls.gov/developers/

const BLS_API_KEY = process.env.BLS_API_KEY;
const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2';

interface BLSResponse {
  unemploymentRate?: number;
  averageWage?: number;
  laborForceSize?: number;
  employmentGrowth?: number;
}

export async function fetchBLSData(
  cityName: string,
  stateCode: string
): Promise<BLSResponse> {
  if (!BLS_API_KEY) {
    console.warn('BLS API key not configured');
    return {};
  }

  try {
    // Get metro area code for the city
    const metroCode = getMetroAreaCode(cityName, stateCode);
    
    if (!metroCode) {
      console.warn(`No metro area code found for ${cityName}, ${stateCode}`);
      return {};
    }

    // Fetch unemployment rate (LAUCN series)
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    
    const seriesId = `LAUCN${metroCode}0000000003`; // Unemployment rate series
    
    const response = await fetch(`${BLS_BASE_URL}/timeseries/data/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seriesid: [seriesId],
        startyear: startYear.toString(),
        endyear: currentYear.toString(),
        registrationkey: BLS_API_KEY,
      }),
    });

    if (!response.ok) {
      console.error('BLS API error:', response.statusText);
      return {};
    }

    const data = await response.json();
    
    if (data.status !== 'REQUEST_SUCCEEDED') {
      console.error('BLS API request failed:', data.message);
      return {};
    }

    // Get the most recent data point
    const series = data.Results?.series?.[0];
    if (!series || !series.data || series.data.length === 0) {
      return {};
    }

    const latestData = series.data[0];
    
    return {
      unemploymentRate: parseFloat(latestData.value) || undefined,
      // Additional metrics can be added with more series IDs
    };
  } catch (error) {
    console.error('Error fetching BLS data:', error);
    return {};
  }
}

// Metro area codes for major US cities
// Format: CBSA code (Core Based Statistical Area)
function getMetroAreaCode(cityName: string, stateCode: string): string | null {
  const normalized = `${cityName.toLowerCase()},${stateCode.toLowerCase()}`;
  
  const metroMap: Record<string, string> = {
    'new york,ny': '35620',
    'los angeles,ca': '31080',
    'chicago,il': '16980',
    'houston,tx': '26420',
    'phoenix,az': '38060',
    'philadelphia,pa': '37980',
    'san antonio,tx': '41700',
    'san diego,ca': '41740',
    'dallas,tx': '19100',
    'san jose,ca': '41940',
    'austin,tx': '12420',
    'jacksonville,fl': '27260',
    'fort worth,tx': '19100',
    'columbus,oh': '18140',
    'charlotte,nc': '16740',
    'san francisco,ca': '41860',
    'indianapolis,in': '26900',
    'seattle,wa': '42660',
    'denver,co': '19740',
    'washington,dc': '47900',
    'boston,ma': '14460',
    'el paso,tx': '21340',
    'nashville,tn': '34980',
    'detroit,mi': '19820',
    'oklahoma city,ok': '36420',
    'portland,or': '38900',
    'las vegas,nv': '29820',
    'memphis,tn': '32820',
    'louisville,ky': '31140',
    'baltimore,md': '12580',
    'milwaukee,wi': '33340',
    'albuquerque,nm': '10740',
    'tucson,az': '46060',
    'fresno,ca': '23420',
    'mesa,az': '38060',
    'sacramento,ca': '40900',
    'atlanta,ga': '12060',
    'kansas city,mo': '28140',
    'colorado springs,co': '17820',
    'raleigh,nc': '39580',
    'omaha,ne': '36540',
    'miami,fl': '33100',
    'oakland,ca': '41860',
    'minneapolis,mn': '33460',
    'tulsa,ok': '46140',
    'wichita,ks': '48620',
    'new orleans,la': '35380',
  };
  
  return metroMap[normalized] || null;
}
