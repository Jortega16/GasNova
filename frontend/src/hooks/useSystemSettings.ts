import { useState, useEffect } from 'react';
import { api } from '../api';
import type { FuelType, PriceConfig } from '../types';
import { INITIAL_PRICES } from '../data';
import type { UnitMeasure } from '../utils/units';

export interface SystemSettings {
  unitMeasure: UnitMeasure;
  currencySymbol: string;
  stationCountry: string;
  stationCity: string;
  stationCanton: string;
  stationDepartment: string;
  autoAuthorizeOnNozzleUp: boolean;
  autoConsolidateEnabled: boolean;
  autoConsolidateMinutes: number;
}

interface UseSystemSettingsReturn {
  settings: SystemSettings;
  prices: PriceConfig[];
  setPrices: React.Dispatch<React.SetStateAction<PriceConfig[]>>;
  updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
  saveSetting: (key: string, value: string) => Promise<void>;
  refetch: () => void;
}

const DEFAULTS: SystemSettings = {
  unitMeasure: 'Litros',
  currencySymbol: '$',
  stationCountry: 'Guatemala',
  stationCity: 'Ciudad de Guatemala',
  stationCanton: '',
  stationDepartment: 'Guatemala',
  autoAuthorizeOnNozzleUp: false,
  autoConsolidateEnabled: true,
  autoConsolidateMinutes: 5,
};

const PRICE_KEY_MAP: Record<FuelType, string> = {
  'Regular Unleaded': 'price_regular_unleaded',
  'Premium Unleaded': 'price_premium_unleaded',
  'Diesel': 'price_diesel',
  'Kerosene': 'price_kerosene',
  'LPG': 'price_lpg',
};

export function useSystemSettings(): UseSystemSettingsReturn {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULTS);
  const [prices, setPrices] = useState<PriceConfig[]>(INITIAL_PRICES);

  const load = () => {
    api.getSystemSettings().then(res => {
      if (!res.ok || !res.data) return;
      const data = res.data;

      setSettings({
        unitMeasure: data.unit_measure ?? DEFAULTS.unitMeasure,
        currencySymbol: data.currency_symbol ?? DEFAULTS.currencySymbol,
        stationCountry: data.station_country ?? DEFAULTS.stationCountry,
        stationCity: data.station_city ?? DEFAULTS.stationCity,
        stationCanton: data.station_canton ?? DEFAULTS.stationCanton,
        stationDepartment: data.station_department ?? DEFAULTS.stationDepartment,
        autoAuthorizeOnNozzleUp: data.auto_authorize_on_nozzle_up === 'true',
        autoConsolidateEnabled: data.auto_consolidate_enabled === 'true',
        autoConsolidateMinutes: (() => {
          const parsed = parseFloat(data.auto_consolidate_minutes);
          return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULTS.autoConsolidateMinutes;
        })(),
      });

      setPrices(prev => prev.map(p => {
        const key = PRICE_KEY_MAP[p.fuelType];
        if (key && data[key]) {
          const parsed = parseFloat(data[key]);
          if (!isNaN(parsed) && parsed > 0) {
            return { ...p, price: parsed };
          }
        }
        return p;
      }));
    });
  };

  useEffect(() => { load(); }, []);

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSetting = async (key: string, value: string) => {
    await api.updateSystemSetting(key, value);
  };

  return { settings, prices, setPrices, updateSetting, saveSetting, refetch: load };
}
