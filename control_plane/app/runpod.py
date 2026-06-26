from .models import RunPodDispatchRequest, RunPodDispatchResponse, generated_id


class RunPodAdapter:
    def dispatch(self, request: RunPodDispatchRequest) -> RunPodDispatchResponse:
        external_id = generated_id("runpod")
        return RunPodDispatchResponse(
            workload_id=request.workload_id,
            external_id=external_id,
            status="accepted",
        )


runpod_adapter = RunPodAdapter()
