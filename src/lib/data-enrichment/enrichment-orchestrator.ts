/**
 * Data Enrichment Orchestrator
 * Combines Census and BLS data to enrich city records
 */

import { fetchCensusData } from './census-api';
import { fetchBLSData } from './bls-api';
import { db } from '../db';

export interface EnrichedCityData {
  demographics: {
    population?: number;
    medianAge?: number;
    collegeEducated?: number;
  };
  economicData: {
    medianIncome?: number;
    unemploymentRate?: number;
    medianHomeValue?: number;
  };
  lastDataRefresh: Date;
}

export async function enrichCityData(cityId: string): Promise<EnrichedCityData | null> {
  try {
    // Fetch city from database
    const city = await db.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      throw new Error(`City ${cityId} not found`);
    }

    console.log(`Enriching data for ${city.name}, ${city.stateCode}...`);

    // Fetch data from both APIs in parallel
    const [censusData, blsData] = await Promise.all([
      fetchCensusData(city.name, city.stateCode),
      fetchBLSData(city.name, city.stateCode),
    ]);

    // Combine the data
    const enrichedData: EnrichedCityData = {
      demographics: {
        population: censusData.population,
        medianAge: censusData.medianAge,
        collegeEducated: censusData.collegeEducated,
      },
      economicData: {
        medianIncome: censusData.medianIncome,
        unemploymentRate: blsData.unemploymentRate,
        medianHomeValue: censusData.medianHomeValue,
      },
      lastDataRefresh: new Date(),
    };

    // Update city in database
    await db.city.update({
      where: { id: cityId },
      data: {
        population: censusData.population,
        demographics: enrichedData.demographics,
        economicData: enrichedData.economicData,
        lastDataRefresh: enrichedData.lastDataRefresh,
      },
    });

    console.log(`✅ Successfully enriched ${city.name}, ${city.stateCode}`);

    return enrichedData;
  } catch (error) {
    console.error(`Error enriching city ${cityId}:`, error);
    return null;
  }
}

export async function enrichAllCities(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const cities = await db.city.findMany();
  
  let success = 0;
  let failed = 0;

  console.log(`Starting enrichment for ${cities.length} cities...`);

  for (const city of cities) {
    const result = await enrichCityData(city.id);
    
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Enrichment complete: ${success} succeeded, ${failed} failed`);

  return {
    success,
    failed,
    total: cities.length,
  };
}

export async function enrichCitiesByIds(cityIds: string[]): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  let success = 0;
  let failed = 0;

  console.log(`Starting enrichment for ${cityIds.length} cities...`);

  for (const cityId of cityIds) {
    const result = await enrichCityData(cityId);
    
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Enrichment complete: ${success} succeeded, ${failed} failed`);

  return {
    success,
    failed,
    total: cityIds.length,
  };
}
