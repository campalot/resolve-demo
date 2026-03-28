import { http, graphql, HttpResponse } from 'msw';
import { interactionService } from '../../services/interactionService';

export const interactionHandlers = [
  // --- REST VERSION ---
  http.get('/api/w/:workspaceId/interactions/:interactionId', async ({ params }) => {
    const data = await interactionService.getInteraction(
      params.workspaceId as string, 
      params.interactionId as string
    );

    if (!data) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({ interaction: data });
  }),

  // --- GRAPHQL VERSION ---
  graphql.query('GetInteraction', async ({ variables }) => {
    const { workspaceId, interactionId } = variables; // id maps to interactionId
    console.info("🎯 MSW Intercepted GetInteractionDetail", variables);
    
    const data = await interactionService.getInteraction(workspaceId, interactionId);

    if (!data) {
      return HttpResponse.json({
        errors: [{ message: "Interaction not found" }]
      }, { status: 200 }); // GraphQL typically returns 200 with errors array
    }

    return HttpResponse.json({
      data: { interaction: data }
    });
  }),
];
