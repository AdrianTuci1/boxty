output "gce_instance_name" {
  description = "Name of the GCE worker instance"
  value       = google_compute_instance.worker.name
}

output "storage_bucket_names" {
  description = "Names of created Cloud Storage buckets"
  value = [
    google_storage_bucket.snapshots.name,
    google_storage_bucket.images.name,
  ]
}
