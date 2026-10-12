resource "oci_core_vcn" "demo" {
  compartment_id = var.compartment_ocid
  cidr_block     = var.vcn_cidr
  display_name   = "terraform-learning-vcn"
  dns_label      = "learnvcn"
}
