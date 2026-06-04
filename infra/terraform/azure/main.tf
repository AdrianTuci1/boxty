terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "boxty" {
  name     = "boxty-${var.environment}"
  location = var.region
}

resource "azurerm_linux_virtual_machine" "worker" {
  name                = "boxty-worker-${var.environment}"
  resource_group_name = azurerm_resource_group.boxty.name
  location            = azurerm_resource_group.boxty.location
  size                = "Standard_F8s_v2"
  priority            = "Spot"
  eviction_policy     = "Deallocate"

  admin_username = "ubuntu"

  admin_ssh_key {
    username   = "ubuntu"
    public_key = file("${path.module}/id_rsa.pub")
  }

  network_interface_ids = [azurerm_network_interface.worker.id]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.yml", {
    api_url    = var.api_url
    worker_key = var.worker_api_key
    provider   = "azure"
    region     = var.region
  }))

  tags = {
    environment = var.environment
  }
}

resource "azurerm_virtual_network" "boxty" {
  name                = "boxty-vnet-${var.environment}"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.boxty.location
  resource_group_name = azurerm_resource_group.boxty.name
}

resource "azurerm_subnet" "worker" {
  name                 = "boxty-subnet-${var.environment}"
  resource_group_name  = azurerm_resource_group.boxty.name
  virtual_network_name = azurerm_virtual_network.boxty.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_network_interface" "worker" {
  name                = "boxty-nic-${var.environment}"
  location            = azurerm_resource_group.boxty.location
  resource_group_name = azurerm_resource_group.boxty.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.worker.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.worker.id
  }
}

resource "azurerm_public_ip" "worker" {
  name                = "boxty-pip-${var.environment}"
  resource_group_name = azurerm_resource_group.boxty.name
  location            = azurerm_resource_group.boxty.location
  allocation_method   = "Dynamic"
}

resource "azurerm_storage_account" "boxty" {
  name                     = "boxty${var.environment}"
  resource_group_name      = azurerm_resource_group.boxty.name
  location                 = azurerm_resource_group.boxty.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    environment = var.environment
  }
}
