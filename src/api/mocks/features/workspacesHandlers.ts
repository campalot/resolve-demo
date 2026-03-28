import { http, graphql, HttpResponse, delay } from 'msw';
import { getMockDb } from '../../../mocks/mockDB';

export const workspacesHandlers = [
  // REST VERSION
  http.get('/api/workspaces', async () => {
    await delay(200);
    return HttpResponse.json({ 
      workspaces: getMockDb().workspaces 
    });
  }),

  // GRAPHQL VERSION
  graphql.query('GetWorkspaces', async () => {
    await delay(200);
    return HttpResponse.json({
      data: { 
        workspaces: getMockDb().workspaces 
      }
    });
  }),
];
