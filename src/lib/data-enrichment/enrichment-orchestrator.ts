// City Data Enrichment Orchestrator
// Combines data from Census API, BLS API, and other sources

import { db } from '../db';
import { fetchCensusData } from './census-client';
import { fetchBLSData } from './bls-client';

interface EnrichmentResult {
  cityId: string;
  cityName: string;
  success: boolean;
  error?: string;
  dataUpdated: {
    demographics?: boolean;
    economicData?: boolean;
    metroData?: boolean;
  };
}

export async function enrichCity(cityId: string): Promise<EnrichmentResult> {
  try {
    // Fetch city from database
    const city = await db.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      return {
        cityId,
        cityName: 'Unknown',
        success: false,
        error: 'City not found',
        dataUpdated: {},
      };
    }

    console.log(`🔄 Enriching data for ${city.name}, ${city.stateCode}...`);

    // Fetch data from external APIs
    const [censusData, blsData] = await Promise.all([
      fetchCensusData(city.name, city.stateCode),
      fetchBLSData(city.name, city.stateCode),
    ]);

    // Prepare update data
    const updateData: any = {
      lastDataRefresh: new Date(),
    };

    const dataUpdated: EnrichmentResult['dataUpdated'] = {};

    // Update demographics if we got Census data
    if (Object.keys(censusData).length > 0) {
      updateData.demographics = {
        medianAge: censusData.medianAge,
        collegeEducated: censusData.collegeEducated,
        householdSize: censusData.householdSize,
        source: 'US Census Bureau ACS 5-Year',
        lastUpdated: new Date().toISOString(),
      };
      dataUpdated.demographics = true;
    }

    // Update economic data if we got BLS data
    if (Object.keys(blsData).length > 0) {
      const existing = (city.economicData as any) || {};
      updateData.economicData = {
        ...existing,
        unemploymentRate: blsData.unemploymentRate,
        averageWage: blsData.averageWage,
        laborForceSize: blsData.laborForceSize,
        source: 'Bureau of Labor Statistics',
        lastUpdated: new Date().toISOString(),
      };
      dataUpdated.economicData = true;
    }

    // Update population if we got it from Census
    if (censusData.population) {
      updateData.population = censusData.population;
    }

    // Update metro data with income info
    if (censusData.medianIncome) {
      const existing = (city.metroData as any) || {};
      updateData.metroData = {
        ...existing,
        medianIncome: censusData.medianIncome,
        lastUpdated: new Date().toISOString(),
      };
      dataUpdated.metroData = true;
    }

    // Save to database
    await db.city.update({
      where: { id: cityId },
      data: updateData,
    });

    console.log(`✅ Successfully enriched ${city.name}, ${city.stateCode}`);

    return {
      cityId,
      cityName: `${city.name}, ${city.stateCode}`,
      success: true,
      dataUpdated,
    };
  } catch (error: any) {
    console.error(`❌ Error enriching city ${cityId}:`, error);
    return {
      cityId,
      cityName: 'Unknown',
      success: false,
      error: error.message,
      dataUpdated: {},
    };
  }
}

export async function enrichMultipleCities(cityIds: string[]): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];

  // Process cities sequentially to avoid rate limiting
  for (const cityId of cityIds) {
    const result = await enrichCity(cityId);
    results.push(result);
    
    // Add a small delay between requests to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

export async function enrichAllTenantCities(tenantId: string): Promise<EnrichmentResult[]> {
  // Get all cities for this tenant
  const tenantCities = await db.tenantCity.findMany({
    where: { tenantId },
    include: { city: true },
  });

  const cityIds = tenantCities.map(tc => tc.cityId);
  
  return enrichMultipleCities(cityIds);
}
