variable "region" {
  type        = string
  description = "实际 OCI 区域标识"
  default     = "ap-tokyo-1"
}
variable "oci_profile" {
  type        = string
  description = "本机 OCI 配置文件中已配置的 API Key profile"
  default     = "DEFAULT"
}
variable "compartment_ocid" {
  type        = string
  description = "实际学习 Compartment OCID"
}
variable "vcn_cidr" {
  type        = string
  description = "需确认不与环境互联地址冲突的示例地址段"
  default     = "10.0.0.0/16"
}
