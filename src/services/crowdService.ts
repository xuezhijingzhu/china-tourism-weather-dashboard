import { mockCrowdData } from '../data/mockCrowd';
import type { AttractionCrowdData } from '../types';

export interface CrowdService {
  getByCity(city: string): Promise<AttractionCrowdData[]>;
  getByProvince(province: string): Promise<AttractionCrowdData[]>;
  getByAttractionId(id: string): Promise<AttractionCrowdData | null>;
}

class MockCrowdService implements CrowdService {
  async getByCity(city: string) {
    return mockCrowdData.filter((item) => item.city === city);
  }

  async getByProvince(province: string) {
    return mockCrowdData.filter((item) => item.province === province);
  }

  async getByAttractionId(id: string) {
    return mockCrowdData.find((item) => item.id === id) ?? null;
  }
}

class UnsupportedCrowdService implements CrowdService {
  async getByCity(_city: string): Promise<AttractionCrowdData[]> {
    void _city;
    throw new Error('当前仅实现 mock 人流服务。请在 src/services/crowdService.ts 中接入真实 provider。');
  }

  async getByProvince(_province: string): Promise<AttractionCrowdData[]> {
    void _province;
    throw new Error('当前仅实现 mock 人流服务。请在 src/services/crowdService.ts 中接入真实 provider。');
  }

  async getByAttractionId(_id: string): Promise<AttractionCrowdData | null> {
    void _id;
    throw new Error('当前仅实现 mock 人流服务。请在 src/services/crowdService.ts 中接入真实 provider。');
  }
}

const createCrowdService = (): CrowdService => {
  const provider = import.meta.env.VITE_CROWD_PROVIDER ?? 'mock';

  if (provider === 'mock') {
    return new MockCrowdService();
  }

  return new UnsupportedCrowdService();
};

export const crowdService = createCrowdService();
