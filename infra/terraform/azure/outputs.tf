output "vm_name" {
  description = "Name of the Azure worker VM"
  value       = azurerm_linux_virtual_machine.worker.name
}

output "storage_account_name" {
  description = "Name of the Azure Storage Account"
  value       = azurerm_storage_account.boxty.name
}
