import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

interface Env {
  EXAMPLE_WORKFLOW: Workflow;
}

interface Params {
  email?: string;
  message?: string;
}

export class ExampleWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    await step.do('Log start', async () => {
      console.log('Workflow started', event.payload);
    });
    await step.sleep('Wait 10 seconds', '10 seconds');
    await step.do('Log end', async () => {
      console.log('Workflow completed', event.payload);
    });
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/test') {
      return Response.json({ ok: true, message: 'Test endpoint is working!' });
    }

    if (url.pathname.startsWith('/favicon')) {
      return Response.json({}, { status: 404 });
    }

    // Get the status of an existing instance, if provided
    const id = url.searchParams.get('instanceId');
    if (id) {
      const instance = await env.EXAMPLE_WORKFLOW.get(id);
      return Response.json({
        status: await instance.status(),
      });
    }

    // Spawn a new instance and return the ID and status
    const instance = await env.EXAMPLE_WORKFLOW.create();
    return Response.json({
      id: instance.id,
      details: await instance.status(),
    });
  },
};
