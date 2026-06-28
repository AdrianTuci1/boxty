import os
import httpx
from .models import RunPodDispatchRequest, RunPodDispatchResponse, generated_id
from .config import settings


class RunPodAdapter:
    def __init__(self):
        self.api_key = settings.runpod_api_key or os.environ.get("BOXTY_RUNPOD_API_KEY", "")
        self.api_base = settings.runpod_api_base
        self.enabled = settings.runpod_enabled and bool(self.api_key)
        self.default_template = settings.runpod_default_template

    def dispatch(self, request: RunPodDispatchRequest) -> RunPodDispatchResponse:
        if not self.enabled:
            # Fallback: return mock response if RunPod is not configured
            external_id = generated_id("runpod")
            return RunPodDispatchResponse(
                workload_id=request.workload_id,
                external_id=external_id,
                status="accepted",
            )

        try:
            # RunPod API v2 endpoint for creating a pod
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "cloudType": "COMMUNITY",
                "gpuCount": request.gpu_count or 1,
                "volumeInGb": 20,
                "containerDiskInGb": 20,
                "minVcpuCount": 4,
                "minMemoryInGb": 16,
                "gpuTypeId": request.gpu_type or "NVIDIA RTX A4000",
                "imageName": "runpod/pytorch:2.1.0-py3.10-cuda11.8-devel-ubuntu22.04",
                "name": f"boxty-{request.workload_id}",
                "ports": "22/tcp",
                "volumeMountPath": "/workspace",
            }

            if request.template:
                payload["templateId"] = request.template
            else:
                payload["templateId"] = self.default_template

            response = httpx.post(
                f"{self.api_base}/v2/graphql",
                headers=headers,
                json={
                    "query": "mutation PodFindAndDeployOnDemand($input: PodFindAndDeployOnDemandInput) { podFindAndDeployOnDemand(input: $input) { id imageName env name runtime gpuCount } }",
                    "variables": {"input": payload}
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                error_msg = data["errors"][0].get("message", "Unknown RunPod error")
                return RunPodDispatchResponse(
                    workload_id=request.workload_id,
                    external_id="",
                    status=f"error: {error_msg}",
                )

            pod_data = data.get("data", {}).get("podFindAndDeployOnDemand", {})
            external_id = pod_data.get("id", "")

            return RunPodDispatchResponse(
                workload_id=request.workload_id,
                external_id=external_id,
                status="running" if external_id else "pending",
            )

        except httpx.HTTPStatusError as e:
            return RunPodDispatchResponse(
                workload_id=request.workload_id,
                external_id="",
                status=f"error: HTTP {e.response.status_code}",
            )
        except httpx.RequestError as e:
            return RunPodDispatchResponse(
                workload_id=request.workload_id,
                external_id="",
                status=f"error: {str(e)}",
            )
        except Exception as e:
            return RunPodDispatchResponse(
                workload_id=request.workload_id,
                external_id="",
                status=f"error: {str(e)}",
            )


runpod_adapter = RunPodAdapter()
