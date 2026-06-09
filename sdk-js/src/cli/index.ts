#!/usr/bin/env node
import { Command } from 'commander';
import { Client, saveConfig } from '../client.js';
import { Sandbox } from '../sandbox.js';
import { BoxtyError } from '../errors.js';

const program = new Command();

program.name('boxty').description('Boxty CLI').version('1.0.0');

function handleError(e: unknown) {
  const msg = e instanceof BoxtyError ? e.message : e instanceof Error ? e.message : String(e);
  console.error('Error:', msg);
  process.exit(1);
}

function requireAuth(client: Client): void {
  if (!(client as any).apiKey) {
    console.error('Not logged in. Run: boxty login <api_key>');
    process.exit(1);
  }
}

// ─── Auth ─────────────────────────────────────────────

program
  .command('login <api_key>')
  .description('Authenticate with API key')
  .action(async (apiKey: string) => {
    if (!apiKey.startsWith('boxty_')) {
      console.error('Invalid API key format. Keys start with boxty_');
      process.exit(1);
    }
    saveConfig({ api_key: apiKey });
    console.log(`Logged in with API key ${apiKey.slice(0, 8)}...`);
    try {
      const client = new Client();
      const info = await (client as any).request('GET', '/api/auth/whoami');
      console.log(`  User: ${info.user_id || 'unknown'}`);
      console.log(`  Email: ${info.email || 'unknown'}`);
    } catch {
      console.log('  (could not verify key — check API connectivity)');
    }
  });

program
  .command('whoami')
  .description('Show user info and balance')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const info = await (client as any).request('GET', '/api/auth/whoami');
      console.log(`User ID:  ${info.user_id || 'unknown'}`);
      console.log(`Email:    ${info.email || 'unknown'}`);
      if (info.balance !== undefined) console.log(`Credits:  ${info.balance}`);
    } catch (e) { handleError(e); }
  });

// ─── Sandboxes ────────────────────────────────────────

program
  .command('run <file>')
  .description('Run script in cloud sandbox')
  .option('-i, --image <image>', 'Base image', 'ubuntu:22.04')
  .option('-c, --cpu <cpu>', 'CPU cores', '2')
  .option('-m, --memory <memory>', 'Memory MB', '4096')
  .option('-g, --gpu <gpu>', 'GPU type')
  .option('-t, --timeout <timeout>', 'Timeout seconds', '300')
  .action(async (file: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const code = fs.readFileSync(path.resolve(file), 'utf-8');
      const sandbox = await client.createSandbox({
        image: opts.image,
        cpu: parseInt(opts.cpu),
        memory: parseInt(opts.memory),
        gpu: opts.gpu,
        timeout: parseInt(opts.timeout),
      });
      console.log(`Sandbox ${sandbox.id} created`);
      const result = await sandbox.exec(code);
      console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);
      console.log(`Exit code: ${result.exitCode}`);
      await client.deleteSandbox(sandbox.id);
    } catch (e) { handleError(e); }
  });

program
  .command('shell')
  .description('Interactive sandbox shell')
  .option('-i, --image <image>', 'Base image', 'ubuntu:22.04')
  .option('-c, --cpu <cpu>', 'CPU cores', '2')
  .option('-m, --memory <memory>', 'Memory MB', '4096')
  .option('-g, --gpu <gpu>', 'GPU type')
  .action(async (opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const sandbox = await client.createSandbox({
        image: opts.image,
        cpu: parseInt(opts.cpu),
        memory: parseInt(opts.memory),
        gpu: opts.gpu,
      });
      console.log(`Sandbox ${sandbox.id} ready`);
      console.log('Type commands, "exit" to quit');
      const readline = await import('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const prompt = () => rl.question('> ', async (cmd) => {
        if (cmd.trim() === 'exit') {
          await client.deleteSandbox(sandbox.id);
          console.log('Sandbox stopped');
          rl.close();
          return;
        }
        try {
          const result = await sandbox.exec(cmd);
          if (result.stdout) process.stdout.write(result.stdout);
          if (result.stderr) process.stderr.write(result.stderr);
        } catch (e) { console.error('Error:', e); }
        prompt();
      });
      prompt();
    } catch (e) { handleError(e); }
  });

program
  .command('exec <id> <command>')
  .description('Execute command in sandbox')
  .option('-t, --timeout <timeout>', 'Timeout seconds')
  .action(async (id: string, command: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const sandbox = await client.getSandbox(id);
      const result = await sandbox.exec(command, opts.timeout ? parseInt(opts.timeout) : undefined);
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      console.log(`Exit code: ${result.exitCode}`);
    } catch (e) { handleError(e); }
  });

program
  .command('ls')
  .description('List sandboxes')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const sandboxes = await client.listSandboxes();
      if (!sandboxes.length) { console.log('No sandboxes'); return; }
      console.log('ID\t\t\tSTATUS\tURL');
      sandboxes.forEach((s) => console.log(`${s.id}\t${s.status}\t${s.url || '-'}`));
    } catch (e) { handleError(e); }
  });

program
  .command('logs <id>')
  .description('Tail logs')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      const sandbox = await client.getSandbox(id);
      sandbox.on('stdout', (data: string) => process.stdout.write(data));
      sandbox.on('stderr', (data: string) => process.stderr.write(data));
      sandbox.on('error', (err: Error) => console.error('WS error:', err.message));
      console.log('Tailing logs... (Ctrl+C to stop)');
      await new Promise(() => {});
    } catch (e) { handleError(e); }
  });

program
  .command('stop <id>')
  .description('Stop sandbox')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteSandbox(id);
      console.log(`Sandbox ${id} stopped`);
    } catch (e) { handleError(e); }
  });

program
  .command('forward <id> <port>')
  .description('Port forward')
  .action(async (id: string, port: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      const sandbox = await client.getSandbox(id);
      const url = await sandbox.forward(parseInt(port));
      console.log(`Forwarding port ${port} -> ${url}`);
    } catch (e) { handleError(e); }
  });

// ─── Billing ──────────────────────────────────────────

program
  .command('billing')
  .description('Show billing info')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const balance = await client.balance();
      const usage = await client.usage();
      console.log(`Balance: ${balance} credits`);
      console.log(`Total cost: ${usage.totalCost}`);
    } catch (e) { handleError(e); }
  });

// ─── Secrets ──────────────────────────────────────────

program
  .command('secret:create <name>')
  .description('Create secret')
  .requiredOption('-v, --value <value>', 'Secret value')
  .action(async (name: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const secret = await client.createSecret(name, opts.value);
      console.log(`Secret ${secret.name} created`);
    } catch (e) { handleError(e); }
  });

program
  .command('secret:ls')
  .description('List secrets')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const secrets = await client.listSecrets();
      if (!secrets.length) { console.log('No secrets'); return; }
      console.log('NAME\t\tCREATED');
      secrets.forEach((s) => console.log(`${s.name}\t\t${s.createdAt}`));
    } catch (e) { handleError(e); }
  });

program
  .command('secret:rm <name>')
  .description('Remove secret')
  .action(async (name: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteSecret(name);
      console.log(`Secret ${name} removed`);
    } catch (e) { handleError(e); }
  });

// ─── Schedules ────────────────────────────────────────

program
  .command('schedule:create')
  .description('Create schedule')
  .requiredOption('-n, --name <name>', 'Schedule name')
  .requiredOption('-t, --type <type>', 'Schedule type: cron or period')
  .requiredOption('-v, --value <value>', 'Cron expression or period seconds')
  .requiredOption('-f, --function <function>', 'Function to run')
  .option('--image <image>', 'Sandbox image')
  .option('--cpu <cpu>', 'CPU cores')
  .option('--memory <memory>', 'Memory MB')
  .option('--gpu <gpu>', 'GPU type')
  .option('--timeout <timeout>', 'Timeout seconds')
  .option('--secrets <secrets>', 'Comma-separated secret names')
  .action(async (opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const schedule = await client.createSchedule({
        name: opts.name,
        scheduleType: opts.type,
        scheduleValue: opts.type === 'period' ? parseInt(opts.value) : opts.value,
        functionName: opts.function,
        image: opts.image,
        cpu: opts.cpu ? parseInt(opts.cpu) : undefined,
        memory: opts.memory ? parseInt(opts.memory) : undefined,
        gpu: opts.gpu,
        timeout: opts.timeout ? parseInt(opts.timeout) : undefined,
        secrets: opts.secrets ? opts.secrets.split(',') : undefined,
      });
      console.log(`Schedule ${schedule.id} created`);
    } catch (e) { handleError(e); }
  });

program
  .command('schedule:ls')
  .description('List schedules')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const schedules = await client.listSchedules();
      if (!schedules.length) { console.log('No schedules'); return; }
      console.log('ID\tNAME\t\tTYPE\tVALUE');
      schedules.forEach((s: any) => console.log(`${s.id}\t${s.name}\t${s.schedule_type}\t${s.schedule_value}`));
    } catch (e) { handleError(e); }
  });

program
  .command('schedule:rm <id>')
  .description('Remove schedule')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteSchedule(id);
      console.log(`Schedule ${id} removed`);
    } catch (e) { handleError(e); }
  });

program
  .command('schedule:trigger <id>')
  .description('Trigger schedule')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.triggerSchedule(id);
      console.log(`Schedule ${id} triggered`);
    } catch (e) { handleError(e); }
  });

// ─── Images ───────────────────────────────────────────

program
  .command('image:build <name>')
  .description('Build image')
  .requiredOption('-b, --base <base>', 'Base image')
  .requiredOption('-c, --commands <commands>', 'Semicolon-separated build commands')
  .action(async (name: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const build = await client.buildImage(name, opts.base, opts.commands.split(';'));
      console.log(`Image build ${build.id} started`);
      console.log(`Status: ${build.status}`);
    } catch (e) { handleError(e); }
  });

program
  .command('image:ls')
  .description('List images')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const images = await client.listImages();
      if (!images.length) { console.log('No images'); return; }
      console.log('ID\tNAME\t\tSTATUS\tURL');
      images.forEach((i) => console.log(`${i.id}\t${i.imageUrl || '-'}\t${i.status}\t${i.imageUrl || '-'}`));
    } catch (e) { handleError(e); }
  });

program
  .command('image:rm <id>')
  .description('Remove image')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteImage(id);
      console.log(`Image ${id} removed`);
    } catch (e) { handleError(e); }
  });

// ─── Volumes ──────────────────────────────────────────

program
  .command('volume:create <name>')
  .description('Create volume')
  .option('-s, --size <size>', 'Size GB', '50')
  .action(async (name: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const volume = await client.createVolume(name, parseInt(opts.size));
      console.log(`Volume ${volume.id} created (${volume.sizeGb}GB)`);
    } catch (e) { handleError(e); }
  });

program
  .command('volume:ls')
  .description('List volumes')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const volumes = await client.listVolumes();
      if (!volumes.length) { console.log('No volumes'); return; }
      console.log('ID\tNAME\t\tSIZE\tSTATUS');
      volumes.forEach((v) => console.log(`${v.id}\t${v.name}\t${v.sizeGb}GB\t${v.status}`));
    } catch (e) { handleError(e); }
  });

program
  .command('volume:rm <id>')
  .description('Remove volume')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteVolume(id);
      console.log(`Volume ${id} removed`);
    } catch (e) { handleError(e); }
  });

program
  .command('volume:mount <volumeId> <sandboxId>')
  .description('Mount volume to sandbox')
  .requiredOption('-p, --path <path>', 'Mount path')
  .action(async (volumeId: string, sandboxId: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.mountVolume(volumeId, sandboxId, opts.path);
      console.log(`Volume ${volumeId} mounted to ${sandboxId} at ${opts.path}`);
    } catch (e) { handleError(e); }
  });

// ─── Workspaces ───────────────────────────────────────

program
  .command('workspace:create <name>')
  .description('Create workspace')
  .option('-d, --description <description>', 'Description')
  .action(async (name: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const ws = await client.createWorkspace(name, opts.description);
      console.log(`Workspace ${ws.id} created: ${ws.name}`);
    } catch (e) { handleError(e); }
  });

program
  .command('workspace:ls')
  .description('List workspaces')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const workspaces = await client.listWorkspaces();
      if (!workspaces.length) { console.log('No workspaces'); return; }
      console.log('ID\tNAME\t\tDESCRIPTION');
      workspaces.forEach((w) => console.log(`${w.id}\t${w.name}\t${w.description || '-'}`));
    } catch (e) { handleError(e); }
  });

program
  .command('workspace:rm <id>')
  .description('Remove workspace')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteWorkspace(id);
      console.log(`Workspace ${id} removed`);
    } catch (e) { handleError(e); }
  });

// ─── Environments ─────────────────────────────────────

program
  .command('env:create <workspaceId> <name>')
  .description('Create environment')
  .option('-t, --type <type>', 'Type: development, staging, production', 'development')
  .action(async (workspaceId: string, name: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const env = await client.createEnvironment(workspaceId, name, opts.type);
      console.log(`Environment ${env.id} created: ${env.name} (${env.type})`);
    } catch (e) { handleError(e); }
  });

program
  .command('env:ls')
  .description('List environments')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const envs = await client.listEnvironments();
      if (!envs.length) { console.log('No environments'); return; }
      console.log('ID\tNAME\t\tTYPE\t\tWORKSPACE');
      envs.forEach((e) => console.log(`${e.id}\t${e.name}\t${e.type}\t${e.workspaceId}`));
    } catch (e) { handleError(e); }
  });

// ─── Apps ─────────────────────────────────────────────

program
  .command('app:create <name>')
  .description('Create app')
  .requiredOption('-w, --workspace <workspaceId>', 'Workspace ID')
  .requiredOption('-e, --env <envId>', 'Environment ID')
  .requiredOption('-i, --image <image>', 'Docker image')
  .option('-t, --timeout <timeout>', 'Timeout seconds')
  .action(async (name: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const app = await client.createApp(opts.workspace, opts.env, name, opts.image, opts.timeout ? parseInt(opts.timeout) : undefined);
      console.log(`App ${app.id} created: ${app.name}`);
    } catch (e) { handleError(e); }
  });

program
  .command('app:ls')
  .description('List apps')
  .action(async () => {
    const client = new Client();
    requireAuth(client);
    try {
      const apps = await client.listApps();
      if (!apps.length) { console.log('No apps'); return; }
      console.log('ID\tNAME\t\tIMAGE\t\tSTATUS');
      apps.forEach((a: any) => console.log(`${a.id}\t${a.name}\t${a.image}\t${a.status || '-'}`));
    } catch (e) { handleError(e); }
  });

program
  .command('app:stop <id>')
  .description('Stop app')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.stopApp(id);
      console.log(`App ${id} stopped`);
    } catch (e) { handleError(e); }
  });

program
  .command('app:rm <id>')
  .description('Remove app')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteApp(id);
      console.log(`App ${id} removed`);
    } catch (e) { handleError(e); }
  });

program
  .command('app:logs <id>')
  .description('App logs')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      const logs = await client.getAppLogs(id);
      logs.forEach((l) => console.log(l));
    } catch (e) { handleError(e); }
  });

program
  .command('app:metrics <id>')
  .description('App metrics')
  .action(async (id: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      const metrics = await client.getAppMetrics(id);
      console.log(JSON.stringify(metrics, null, 2));
    } catch (e) { handleError(e); }
  });

program
  .command('app:deploy <appId>')
  .description('Deploy app to instance')
  .requiredOption('-i, --instance <instanceId>', 'Instance config ID')
  .option('--image <image>', 'Override image')
  .action(async (appId: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const deployment = await client.deployApp(appId, opts.instance, opts.image);
      console.log(`Deployment ${deployment.id} started`);
      console.log(`Status: ${deployment.status}`);
      console.log(`URL: ${deployment.url}`);
    } catch (e) { handleError(e); }
  });

// ─── Instances ────────────────────────────────────────

program
  .command('instance:create <appId> <name>')
  .description('Create instance config')
  .requiredOption('-c, --cpu <cpu>', 'CPU cores')
  .requiredOption('-m, --memory <memory>', 'Memory MB')
  .option('-g, --gpu <gpu>', 'GPU type')
  .option('--min <min>', 'Min containers', '1')
  .option('--max <max>', 'Max containers', '10')
  .option('--scaledown <window>', 'Scaledown window seconds', '300')
  .action(async (appId: string, name: string, opts: any) => {
    const client = new Client();
    requireAuth(client);
    try {
      const instance = await client.createInstance(
        appId, name,
        parseInt(opts.cpu),
        parseInt(opts.memory),
        opts.gpu || null,
        parseInt(opts.min),
        parseInt(opts.max),
        parseInt(opts.scaledown)
      );
      console.log(`Instance ${instance.id} created: ${instance.name}`);
    } catch (e) { handleError(e); }
  });

program
  .command('instance:ls <appId>')
  .description('List instances')
  .action(async (appId: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      const instances = await client.listInstances(appId);
      if (!instances.length) { console.log('No instances'); return; }
      console.log('ID\tNAME\t\tCPU\tMEMORY\tGPU');
      instances.forEach((i: any) => console.log(`${i.id}\t${i.name}\t${i.cpu}\t${i.memory}MB\t${i.gpu || '-'}`));
    } catch (e) { handleError(e); }
  });

program
  .command('instance:rm <appId> <instanceId>')
  .description('Remove instance')
  .action(async (appId: string, instanceId: string) => {
    const client = new Client();
    requireAuth(client);
    try {
      await client.deleteInstance(appId, instanceId);
      console.log(`Instance ${instanceId} removed`);
    } catch (e) { handleError(e); }
  });

program.parse();
