import { http, graphql, HttpResponse, delay } from 'msw';
import { getMockDb } from '../../../mocks/mockDB';
import { interactionsListService } from '../../services/interactionsListService';

export const referenceDataHandlers = [
  // --- REST VERSION ---
  http.get('/api/w/:workspaceId/reference/interactions', async ({ params }) => {
    const { workspaceId } = params;

    const data = await interactionsListService.processReferenceData(
      getMockDb().interactions, 
      workspaceId as string
    );

    return HttpResponse.json(data);
  }),

  // --- GRAPHQL VERSION ---
  graphql.query('InteractionsReferenceData', async ({ variables }) => {
    await delay(400); // Replaces your withLatency for GQL
    const { workspaceId } = variables;
    const data = await interactionsListService.processReferenceData(getMockDb().interactions, workspaceId);

    if (!data) {
      return HttpResponse.json({
        errors: [{ message: "Reference data not found" }]
      }, { status: 200 }); // GraphQL typically returns 200 with errors array
    }

    return HttpResponse.json({ data });
  }),
];
