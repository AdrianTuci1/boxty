use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod agentnet_escrow {
    use super::*;

    /// Initializes a new compute job and locks the payment in the escrow vault.
    pub fn initialize_job(
        ctx: Context<InitializeJob>,
        task_id: u64,
        task_hash: [u8; 32],
        amount: u64,
        timeout_slots: u64,
    ) -> Result<()> {
        let job = &mut ctx.accounts.job;
        job.client = *ctx.accounts.client.key;
        job.task_id = task_id;
        job.task_hash = task_hash;
        job.amount = amount;
        job.timeout_slot = Clock::get()?.slot + timeout_slots;
        job.status = JobStatus::Active;

        // Transfer tokens from Client to Escrow Vault Account
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// Claim reward once execution is complete and verified.
    /// In an optimistic rollup setup, this would be subject to challenge windows.
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        output_hash: [u8; 32],
    ) -> Result<()> {
        let job = &mut ctx.accounts.job;
        require!(job.status == JobStatus::Active, EscrowError::JobNotActive);
        
        job.status = JobStatus::Completed;
        job.worker = Some(*ctx.accounts.worker.key);
        job.output_hash = Some(output_hash);

        // PDA signer seeds for signing the vault transfer
        let task_id_bytes = job.task_id.to_le_bytes();
        let seeds = &[
            b"escrow-vault",
            task_id_bytes.as_ref(),
            &[ctx.bumps.vault_account],
        ];
        let signer = &[&seeds[..]];

        // Transfer tokens from Vault to Worker
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx.accounts.worker_token_account.to_account_info(),
            authority: ctx.accounts.vault_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, job.amount)?;

        Ok(())
    }

    /// Cancel a job and refund the client if the timeout slot has passed without execution.
    pub fn cancel_job(ctx: Context<CancelJob>) -> Result<()> {
        let job = &mut ctx.accounts.job;
        require!(job.status == JobStatus::Active, EscrowError::JobNotActive);
        
        let current_slot = Clock::get()?.slot;
        require!(current_slot >= job.timeout_slot, EscrowError::TimeoutNotReached);

        job.status = JobStatus::Cancelled;

        // PDA signer seeds for signing the vault transfer
        let task_id_bytes = job.task_id.to_le_bytes();
        let seeds = &[
            b"escrow-vault",
            task_id_bytes.as_ref(),
            &[ctx.bumps.vault_account],
        ];
        let signer = &[&seeds[..]];

        // Transfer tokens back to Client
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx.accounts.client_token_account.to_account_info(),
            authority: ctx.accounts.vault_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, job.amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(task_id: u64, task_hash: [u8; 32], amount: u64)]
pub struct InitializeJob<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        init,
        payer = client,
        space = 8 + 32 + 8 + 32 + 8 + 32 + 32 + 1 + 1,
        seeds = [b"job-state", task_id.to_le_bytes().as_ref()],
        bump
    )]
    pub job: Account<'info, JobState>,

    #[account(
        init,
        payer = client,
        seeds = [b"escrow-vault", task_id.to_le_bytes().as_ref()],
        bump,
        token::mint = mint,
        token::authority = vault_account,
    )]
    pub vault_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub worker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"job-state", job.task_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub job: Account<'info, JobState>,

    #[account(
        mut,
        seeds = [b"escrow-vault", job.task_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub worker_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelJob<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        seeds = [b"job-state", job.task_id.to_le_bytes().as_ref()],
        bump,
        has_one = client,
    )]
    pub job: Account<'info, JobState>,

    #[account(
        mut,
        seeds = [b"escrow-vault", job.task_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct JobState {
    pub client: Pubkey,
    pub task_id: u64,
    pub task_hash: [u8; 32],
    pub amount: u64,
    pub timeout_slot: u64,
    pub worker: Option<Pubkey>,
    pub output_hash: Option<[u8; 32]>,
    pub status: JobStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum JobStatus {
    Active,
    Completed,
    Cancelled,
}

#[error_code]
pub enum EscrowError {
    #[msg("The job is not active.")]
    JobNotActive,
    #[msg("The timeout slot has not been reached yet.")]
    TimeoutNotReached,
}
