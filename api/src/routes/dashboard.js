import { authenticate } from '../middleware/auth.js';
import { queryByPK, getItem } from '../db/schema.js';

export default async function dashboardRoutes(app) {
  // GET /api/dashboard/:workspaceId/:envId — aggregate dashboard data
  app.get('/:workspaceId/:envId', { preHandler: [authenticate] }, async (req, reply) => {
    const { workspaceId, envId } = req.params;
    const userId = req.user.id;

    // Apps
    const appRefs = await queryByPK(`USER_APPS#${userId}`);
    const appsOut = [];
    for (const ref of appRefs) {
      const a = await getItem(`APP#${ref.app_id}`, 'META');
      if (a && a.workspace_id === workspaceId && a.env_id === envId) {
        const instRefs = await queryByPK(`APP_INSTANCES#${ref.app_id}`);
        const instOut = [];
        for (const ir of instRefs) {
          const inst = await getItem(`APP_INSTANCE#${ir.instance_id}`, 'META');
          if (inst) {
            const sbs = await queryByPK(`INSTANCE_SANDBOXES#${ir.instance_id}`);
            inst.running_containers = sbs.filter(s => s.status === 'running').length;
            instOut.push(inst);
          }
        }
        a.instances = instOut;
        appsOut.push(a);
      }
    }

    // Sandboxes
    const sbRefs = await queryByPK(`USER_SANDBOXES#${userId}`);
    const sandboxesOut = [];
    for (const ref of sbRefs) {
      const sb = await getItem(`SANDBOX#${ref.sandbox_id}`, 'META');
      if (sb) sandboxesOut.push(sb);
    }

    // Compute summary
    let totalCpu = 0, totalMem = 0, totalGpu = 0;
    for (const a of appsOut) {
      for (const inst of (a.instances || [])) {
        if (inst.status === 'active' && inst.running_containers > 0) {
          totalCpu += (inst.cpu || 0) * inst.running_containers;
          totalMem += (inst.memory || 0) * inst.running_containers;
          if (inst.gpu) totalGpu += inst.running_containers;
        }
      }
    }

    reply.send({
      apps: appsOut,
      sandboxes: sandboxesOut,
      summary: {
        totalApps: appsOut.length,
        liveApps: appsOut.filter(a => a.status === 'active').length,
        stoppedApps: appsOut.filter(a => a.status !== 'active').length,
        totalSandboxes: sandboxesOut.length,
        totalCpuCores: totalCpu,
        totalMemoryMb: totalMem,
        totalGpuCount: totalGpu,
      },
    });
  });

  // GET /api/dashboard/:workspaceId/:envId/summary — summary only (lightweight)
  app.get('/:workspaceId/:envId/summary', { preHandler: [authenticate] }, async (req, reply) => {
    const { workspaceId, envId } = req.params;
    const userId = req.user.id;

    const appRefs = await queryByPK(`USER_APPS#${userId}`);
    let totalApps = 0, liveApps = 0;
    for (const ref of appRefs) {
      const a = await getItem(`APP#${ref.app_id}`, 'META');
      if (a && a.workspace_id === workspaceId && a.env_id === envId) {
        totalApps++;
        if (a.status === 'active') liveApps++;
      }
    }

    const sbRefs = await queryByPK(`USER_SANDBOXES#${userId}`);
    const totalSandboxes = sbRefs.length;

    reply.send({
      totalApps,
      liveApps,
      stoppedApps: totalApps - liveApps,
      totalSandboxes,
    });
  });
}
