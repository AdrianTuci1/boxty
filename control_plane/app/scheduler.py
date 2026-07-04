"""Background scheduler that checks cron/interval schedules and triggers workloads."""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Callable

from .store import store
from .models import utc_now, WorkloadCreateRequest, WorkloadKind, WorkloadStatus, ScheduleRecord

# Minimal cron parser: supports 5-field cron expressions (minute hour day month weekday).
# Uses simple integer ranges and wildcards; does not support step syntax (*/5) or lists.

def _parse_cron_field(field: str, min_val: int, max_val: int) -> set[int]:
    if field == "*":
        return set(range(min_val, max_val + 1))
    if "," in field:
        values: set[int] = set()
        for part in field.split(","):
            values.update(_parse_cron_field(part, min_val, max_val))
        return values
    if "-" in field:
        start, end = field.split("-", 1)
        return set(range(int(start), int(end) + 1))
    return {int(field)}


def _match_cron(cron_expr: str, dt: datetime) -> bool:
    parts = cron_expr.strip().split()
    if len(parts) != 5:
        return False
    minute, hour, dom, month, dow = parts
    if dt.minute not in _parse_cron_field(minute, 0, 59):
        return False
    if dt.hour not in _parse_cron_field(hour, 0, 23):
        return False
    if dt.day not in _parse_cron_field(dom, 1, 31):
        return False
    if dt.month not in _parse_cron_field(month, 1, 12):
        return False
    # weekday: 0=Sunday in cron, Python weekday(): Monday=0, Sunday=6
    # map Python weekday to cron: (python_weekday + 1) % 7
    cron_dow = (dt.weekday() + 1) % 7
    if cron_dow not in _parse_cron_field(dow, 0, 6):
        return False
    return True


def _should_trigger(schedule: ScheduleRecord, now: datetime) -> bool:
    if schedule.status != "active":
        return False
    if schedule.cron_expression:
        return _match_cron(schedule.cron_expression, now)
    if schedule.interval_seconds:
        if schedule.last_run_at is None:
            return True
        return (now - schedule.last_run_at).total_seconds() >= schedule.interval_seconds
    return False


# In-memory guard to avoid triggering the same schedule more than once per minute
# for cron-based schedules.
_last_trigger_minute: dict[str, datetime] = {}


async def _run_scheduler_tick() -> None:
    now = utc_now()
    for schedule in list(store.schedules.values()):
        if not _should_trigger(schedule, now):
            continue
        # Guard against duplicate triggers within the same minute for cron schedules
        if schedule.cron_expression:
            last_minute = _last_trigger_minute.get(schedule.schedule_id)
            if last_minute and last_minute.replace(second=0, microsecond=0) == now.replace(second=0, microsecond=0):
                continue
            _last_trigger_minute[schedule.schedule_id] = now
        try:
            store._trigger_schedule_workload(schedule.schedule_id, force=False)
        except Exception as exc:
            # Log failure but keep scheduler alive
            store.add_workload_log(
                schedule.workload_id, "error",
                f"Schedule trigger failed for {schedule.schedule_id}: {exc}"
            )


_scheduler_task: asyncio.Task | None = None


async def _scheduler_loop() -> None:
    while True:
        try:
            await _run_scheduler_tick()
        except Exception:
            pass
        await asyncio.sleep(30)


def start_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop())


def stop_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        _scheduler_task = None
