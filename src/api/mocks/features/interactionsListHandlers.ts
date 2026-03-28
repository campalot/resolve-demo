import { http, graphql, HttpResponse, delay } from 'msw';
import { interactionsListService } from '../../services/interactionsListService';
import { getMockDb } from '../../../mocks/mockDB';
import type { InteractionsListVars } from '../../services/interactionsListService';

const isTest = import.meta.env.MODE === 'test';

export const interactionsListHandlers = [
  // REST VERSION
  http.get('/api/w/:workspaceId/interactions', async ({ params, request }) => {
    await delay(400); // Replaces your withLatency for REST
    const url = new URL(request.url);
    // Extract variables from REST URL
    const vars = {
      workspaceId: params.workspaceId,
      sortBy: url.searchParams.get('sortBy'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
      limit: parseInt(url.searchParams.get('limit') || '50'),
      filters: {
        status: url.searchParams.getAll("status"), // Returns [] if empty
        type: url.searchParams.getAll("type"),
        parties: url.searchParams.getAll("parties"),
        identityId: url.searchParams.get("identityId"),
        searchQuery: url.searchParams.get("searchQuery"),
        startDate: url.searchParams.get("startDate"),
        endDate: url.searchParams.get("endDate"),
      },
    };
    
    const data = interactionsListService.processInteractions(getMockDb().interactions, vars as InteractionsListVars);
    return HttpResponse.json({ interactions: data });
  }),

  // GRAPHQL VERSION
  graphql.query('GetInteractions', async ({ variables }) => {
    if (!isTest) await delay(400); 
    const data = interactionsListService.processInteractions(getMockDb().interactions, variables as InteractionsListVars);
    return HttpResponse.json({ data: { interactions: data } });
  }),
];
