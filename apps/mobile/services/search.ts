import api from './api';

export interface SearchResult {
  services: any[];
  providers: any[];
}

export interface TextSearchParams {
  categories?: string[];
  city?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

export const searchService = {
  aiSearch: async (query: string): Promise<SearchResult> => {
    const response = await api.post('/search/ai', { query });
    return response.data;
  },

  textSearch: async (q: string, params?: TextSearchParams): Promise<SearchResult> => {
    const response = await api.get('/search', { params: { q, ...params } });
    return response.data;
  },

  getSuggestions: async (q: string): Promise<string[]> => {
    const response = await api.get('/search/suggestions', { params: { q } });
    return response.data;
  },
};
