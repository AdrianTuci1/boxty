terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  region = var.region
}

resource "google_compute_instance" "worker" {
  name         = "boxty-worker-${var.environment}"
  machine_type = "c2-standard-8"
  zone         = "${var.region}-a"

  scheduling {
    preemptible       = true
    automatic_restart = false
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  metadata_startup_script = templatefile("${path.module}/cloud-init.yml", {
    api_url    = var.api_url
    worker_key = var.worker_api_key
    provider   = "gcp"
    region     = var.region
  })

  labels = {
    environment = var.environment
  }
}

resource "google_storage_bucket" "snapshots" {
  name     = "boxty-snapshots-${var.environment}"
  location = var.region
}

resource "google_storage_bucket" "images" {
  name     = "boxty-images-${var.environment}"
  location = var.region
}
