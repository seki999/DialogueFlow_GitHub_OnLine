provider "oci" {
  auth                = "APIKey"
  config_file_profile = var.oci_profile
  region              = var.region
}
