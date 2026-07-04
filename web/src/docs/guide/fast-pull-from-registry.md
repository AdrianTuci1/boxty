# Fast pull from registry

Boxty features an optimized image caching and storage system to ensure containers boot up in sub-second times.

## How to use estargz

Boxty supports eStargz (extended stargz) for lazy-pulling container images. This allows containers to start before the entire image is downloaded, significantly reducing cold start times.

To use eStargz, build your images with the eStargz format and push them to a supported registry. Boxty will automatically detect and use lazy-pulling when available.

For optimal performance, keep your image sizes small and minimize the number of layers.
