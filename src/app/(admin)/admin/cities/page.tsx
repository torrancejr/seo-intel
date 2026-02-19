'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface City {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  slug: string;
  population: number | null;
  metroPopulation: number | null;
  metroData: any;
  legalData: any;
  economicData: any;
  demographics: any;
  lastDataRefresh: string | null;
  isSelected: boolean;
  articleCount: number;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch('/api/v1/cities');
      const data = await res.json();
      setCities(data.cities);
    } catch (err) {
      console.error('Failed to load cities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCity = async (city: City) => {
    try {
      if (city.isSelected) {
        const res = await fetch(
          `/api/v1/tenant-cities?cityId=${city.id}`,
          { method: 'DELETE' }
        );
        if (res.ok) {
          setCities(
            cities.map((c) =>
              c.id === city.id ? { ...c, isSelected: false } : c
            )
          );
        }
      } else {
        const res = await fetch('/api/v1/tenant-cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId: city.id }),
        });
        if (res.ok) {
          setCities(
            cities.map((c) =>
              c.id === city.id ? { ...c, isSelected: true } : c
            )
          );
        }
      }
    } catch (err) {
      console.error('Failed to toggle city');
    }
  };

  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.stateCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCities = cities.filter((c) => c.isSelected);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading cities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cities</h1>
        <p className="text-muted-foreground mt-2">
          Select cities to target for location-specific content generation.
        </p>
      </div>

      {selectedCities.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Selected Cities ({selectedCities.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCities.map((city) => (
              <div
                key={city.id}
                className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm"
              >
                <span className="font-medium">
                  {city.name}, {city.stateCode}
                </span>
                {city.articleCount > 0 && (
                  <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                    {city.articleCount}
                  </span>
                )}
                <button
                  onClick={() => handleToggleCity(city)}
                  className="ml-1"
                >
                  <X className="h-3.5 w-3.5 hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cities..."
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCities.map((city) => (
            <motion.div
              key={city.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative rounded-xl border p-4 cursor-pointer transition-all ${
                city.isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onClick={() => handleToggleCity(city)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{city.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {city.state}
                  </p>
                </div>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                    city.isSelected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  }`}
                >
                  {city.isSelected && (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {city.population && (
                  <div className="flex justify-between">
                    <span>Population:</span>
                    <span className="font-medium">
                      {city.population.toLocaleString()}
                    </span>
                  </div>
                )}
                {city.metroData?.medianIncome && (
                  <div className="flex justify-between">
                    <span>Median Income:</span>
                    <span className="font-medium">
                      ${city.metroData.medianIncome.toLocaleString()}
                    </span>
                  </div>
                )}
                {city.articleCount > 0 && (
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span>Articles:</span>
                    <span className="font-medium text-primary">
                      {city.articleCount}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCity(city);
                }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                View data →
              </button>
            </motion.div>
          ))}
        </div>

        {filteredCities.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No cities found matching &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>

      {selectedCity && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCity(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedCity.name}, {selectedCity.stateCode}
                </h2>
                <p className="text-muted-foreground">{selectedCity.state}</p>
              </div>
              <button
                onClick={() => setSelectedCity(null)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Demographics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Population</p>
                    <p className="font-medium">
                      {selectedCity.population?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Metro Population</p>
                    <p className="font-medium">
                      {selectedCity.metroPopulation?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  {selectedCity.demographics?.medianAge && (
                    <div>
                      <p className="text-muted-foreground">Median Age</p>
                      <p className="font-medium">
                        {selectedCity.demographics.medianAge}
                      </p>
                    </div>
                  )}
                  {selectedCity.demographics?.collegeEducated && (
                    <div>
                      <p className="text-muted-foreground">College Educated</p>
                      <p className="font-medium">
                        {selectedCity.demographics.collegeEducated}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedCity.metroData && (
                <div>
                  <h3 className="font-semibold mb-3">Economic Data</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedCity.metroData.medianIncome && (
                      <div>
                        <p className="text-muted-foreground">Median Income</p>
                        <p className="font-medium">
                          ${selectedCity.metroData.medianIncome.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedCity.metroData.costOfLiving && (
                      <div>
                        <p className="text-muted-foreground">Cost of Living</p>
                        <p className="font-medium">
                          {selectedCity.metroData.costOfLiving} (US avg: 100)
                        </p>
                      </div>
                    )}
                    {selectedCity.metroData.medianHomePrice && (
                      <div>
                        <p className="text-muted-foreground">Median Home Price</p>
                        <p className="font-medium">
                          ${selectedCity.metroData.medianHomePrice.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedCity.metroData.averageRent && (
                      <div>
                        <p className="text-muted-foreground">Average Rent</p>
                        <p className="font-medium">
                          ${selectedCity.metroData.averageRent}/mo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCity.legalData && (
                <div>
                  <h3 className="font-semibold mb-3">Legal Data</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedCity.legalData.totalCourts && (
                      <div>
                        <p className="text-muted-foreground">Total Courts</p>
                        <p className="font-medium">
                          {selectedCity.legalData.totalCourts}
                        </p>
                      </div>
                    )}
                    {selectedCity.legalData.firmCount && (
                      <div>
                        <p className="text-muted-foreground">Law Firms</p>
                        <p className="font-medium">
                          {selectedCity.legalData.firmCount}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCity.lastDataRefresh && (
                <p className="text-xs text-muted-foreground">
                  Data last refreshed:{' '}
                  {new Date(selectedCity.lastDataRefresh).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
