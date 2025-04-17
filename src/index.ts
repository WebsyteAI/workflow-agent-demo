import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

interface Env {
  ExampleWorkflow: Workflow;
}

// Define the parameters your workflow will accept
interface Params {
  email: string;
  message: string;
}

// Example workflow that logs a message, waits, and then logs again
export class ExampleWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Step 1: Log the incoming message
    const first = await step.do('Log initial message', async () => {
      console.log(`Workflow started for: ${event.payload.email}`);
      return { status: 'started', message: event.payload.message };
    });

    // Step 2: Wait for 10 seconds
    await step.sleep('Wait 10 seconds', '10 seconds');

    // Step 3: Log completion
    const second = await step.do('Log completion', async () => {
      console.log(`Workflow completed for: ${event.payload.email}`);
      return { status: 'completed' };
    });

    return { first, second };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Check workflow status
    const instanceId = url.searchParams.get('instanceId');
    if (instanceId) {
      const instance = await env.ExampleWorkflow.get(instanceId);
      return Response.json({ status: await instance.status() });
    }

    // Start a new workflow
    if (request.method === 'POST') {
      const data = await request.json();
      const instance = await env.ExampleWorkflow.create({
        id: crypto.randomUUID(),
        params: data,
      });
      return Response.json({ id: instance.id, details: await instance.status() });
    }

    return Response.json({ usage: 'POST { email, message } to start workflow, or ?instanceId=... to check status.' });
  },
};
