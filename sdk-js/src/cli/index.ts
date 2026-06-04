#!/usr/bin/env node
import { Command } from 'commander';
const program = new Command();

program.name('boxty').description('Boxty CLI').version('0.1.0');

program
  .command('run <file>')
  .description('Run script in cloud sandbox')
  .action((file: string) => {
    console.log(`Running ${file} in cloud sandbox`);
  });

program
  .command('deploy <file>')
  .description('Deploy as web service')
  .action((file: string) => {
    console.log(`Deploying ${file}`);
  });

program
  .command('shell')
  .description('Interactive sandbox shell')
  .action(() => {
    console.log('Interactive sandbox shell');
  });

program
  .command('exec <id> <command>')
  .description('Execute command in sandbox')
  .action((id: string, command: string) => {
    console.log(`Executing ${command} in ${id}`);
  });

program
  .command('ls')
  .description('List sandboxes')
  .action(() => {
    console.log('Listing sandboxes');
  });

program
  .command('logs <id>')
  .description('Tail logs')
  .action((id: string) => {
    console.log(`Logs for ${id}`);
  });

program
  .command('stop <id>')
  .description('Stop sandbox')
  .action((id: string) => {
    console.log(`Stopping ${id}`);
  });

program
  .command('forward <id> <port>')
  .description('Port forward')
  .action((id: string, port: string) => {
    console.log(`Forwarding port ${port} for ${id}`);
  });

program
  .command('login')
  .description('Authenticate with API key')
  .argument('<api_key>', 'API key (starts with boxty_)')
  .action(async (apiKey: string) => {
    if (!apiKey.startsWith('boxty_')) {
      console.error('Invalid API key format. Keys start with boxty_');
      process.exit(1);
    }
    const { saveConfig, Client } = await import('../client.js');
    saveConfig({ api_key: apiKey });
    console.log(`✓ Logged in with API key ${apiKey.slice(0, 8)}...`);
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
    const { Client } = await import('../client.js');
    const client = new Client();
    if (!(client as any).apiKey) {
      console.error('Not logged in. Run: boxty login <api_key>');
      process.exit(1);
    }
    try {
      const info = await (client as any).request('GET', '/api/auth/whoami');
      console.log(`User ID:  ${info.user_id || 'unknown'}`);
      console.log(`Email:    ${info.email || 'unknown'}`);
      if (info.balance !== undefined) {
        console.log(`Credits:  ${info.balance}`);
      }
    } catch (e: any) {
      console.error('Error:', e.message || e);
      process.exit(1);
    }
  });

program
  .command('billing')
  .description('Billing history')
  .action(() => {
    console.log('Billing history');
  });

program
  .command('secret:create <name>')
  .description('Create secret')
  .action((name: string) => {
    console.log(`Creating secret ${name}`);
  });

program
  .command('secret:ls')
  .description('List secrets')
  .action(() => {
    console.log('Listing secrets');
  });

program
  .command('secret:rm <name>')
  .description('Remove secret')
  .action((name: string) => {
    console.log(`Removing secret ${name}`);
  });

program
  .command('schedule:create')
  .description('Create schedule')
  .action(() => {
    console.log('Creating schedule');
  });

program
  .command('schedule:ls')
  .description('List schedules')
  .action(() => {
    console.log('Listing schedules');
  });

program
  .command('schedule:rm <id>')
  .description('Remove schedule')
  .action((id: string) => {
    console.log(`Removing schedule ${id}`);
  });

program
  .command('schedule:trigger <id>')
  .description('Trigger schedule')
  .action((id: string) => {
    console.log(`Triggering schedule ${id}`);
  });

program
  .command('image:build <file>')
  .description('Build image')
  .action((file: string) => {
    console.log(`Building image from ${file}`);
  });

program
  .command('image:ls')
  .description('List images')
  .action(() => {
    console.log('Listing images');
  });

program
  .command('image:rm <id>')
  .description('Remove image')
  .action((id: string) => {
    console.log(`Removing image ${id}`);
  });

program
  .command('workspace:create <name>')
  .description('Create workspace')
  .action((name: string) => {
    console.log(`Creating workspace ${name}`);
  });

program
  .command('workspace:ls')
  .description('List workspaces')
  .action(() => {
    console.log('Listing workspaces');
  });

program
  .command('workspace:rm <id>')
  .description('Remove workspace')
  .action((id: string) => {
    console.log(`Removing workspace ${id}`);
  });

program
  .command('app:create <name>')
  .description('Create app')
  .action((name: string) => {
    console.log(`Creating app ${name}`);
  });

program
  .command('app:ls')
  .description('List apps')
  .action(() => {
    console.log('Listing apps');
  });

program
  .command('app:stop <id>')
  .description('Stop app')
  .action((id: string) => {
    console.log(`Stopping app ${id}`);
  });

program
  .command('app:logs <id>')
  .description('App logs')
  .action((id: string) => {
    console.log(`Logs for app ${id}`);
  });

program
  .command('app:metrics <id>')
  .description('App metrics')
  .action((id: string) => {
    console.log(`Metrics for app ${id}`);
  });

program.parse();
