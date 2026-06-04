packer {
  required_plugins {
    amazon = {
      version = "~> 1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "worker" {
  ami_name      = "boxty-worker-{{timestamp}}"
  instance_type = "c6a.2xlarge"
  region        = "us-east-1"
  ssh_username  = "ubuntu"

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
}

build {
  sources = ["source.amazon-ebs.worker"]

  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "sudo apt-get update",
      "sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release",
      "curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg",
      "echo 'deb [signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main' | sudo tee /etc/apt/sources.list.d/gvisor.list",
      "sudo apt-get update",
      "sudo apt-get install -y runsc containerd docker.io",
      "sudo runsc install",
      "sudo systemctl enable containerd",
      "sudo systemctl enable docker",
    ]
  }

  provisioner "file" {
    source      = "../worker/bin/worker"
    destination = "/tmp/boxty-worker"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/boxty-worker /usr/local/bin/boxty-worker",
      "sudo chmod +x /usr/local/bin/boxty-worker",
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo tee /etc/systemd/system/boxty-worker.service << 'UNITEOF'",
      "[Unit]",
      "Description=Boxty Worker Agent",
      "After=network.target docker.service containerd.service",
      "Requires=docker.service containerd.service",
      "",
      "[Service]",
      "Type=simple",
      "ExecStart=/usr/local/bin/boxty-worker",
      "Restart=always",
      "RestartSec=5",
      "Environment=REGISTRY_USER=${REGISTRY_USER}",
      "Environment=REGISTRY_PASS=${REGISTRY_PASS}",
      "",
      "[Install]",
      "WantedBy=multi-user.target",
      "UNITEOF",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable boxty-worker",
    ]
  }
}
