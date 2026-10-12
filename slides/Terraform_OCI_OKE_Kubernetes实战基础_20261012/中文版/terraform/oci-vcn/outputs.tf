output "vcn_ocid" {
  description = "只创建独立 VCN；不是 OKE 集群或应用网址"
  value       = oci_core_vcn.demo.id
}
