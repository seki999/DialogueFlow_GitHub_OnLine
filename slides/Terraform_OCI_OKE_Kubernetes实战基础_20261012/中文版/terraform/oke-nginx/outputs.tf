output "namespace" {
  value = kubernetes_namespace_v1.demo.metadata[0].name
}
output "deployment_name" {
  value = kubernetes_deployment_v1.web.metadata[0].name
}
output "service_name" {
  value = kubernetes_service_v1.web.metadata[0].name
}
output "service_type" {
  value = var.service_type
}
output "service_cluster_ip" {
  description = "集群内地址，不是公网访问保证"
  value       = kubernetes_service_v1.web.spec[0].cluster_ip
}
