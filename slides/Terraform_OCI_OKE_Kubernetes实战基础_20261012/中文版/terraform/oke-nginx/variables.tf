variable "kubeconfig_path" {
  type        = string
  description = "已有 OKE 的 kubeconfig 路径，Windows 使用正斜杠"
}
variable "kubeconfig_context" {
  type        = string
  description = "显式选择的实际学习集群 Context"
}
variable "namespace" {
  type        = string
  description = "只用于本实验的新 Namespace"
  default     = "tf-oke-learn"
}
variable "replicas" {
  type        = number
  default     = 2
  description = "应用 Pod 副本目标，不是 Compute 数量"
}
variable "image" {
  type        = string
  default     = "nginx:1.28"
  description = "固定教学标签，不代表最新版或生产推荐"
}
variable "service_type" {
  type        = string
  default     = "ClusterIP"
  description = "可选云入口实验才改为 LoadBalancer"
  validation {
    condition     = contains(["ClusterIP", "LoadBalancer"], var.service_type)
    error_message = "本实验仅允许 ClusterIP 或 LoadBalancer。"
  }
}
variable "lb_type" {
  type        = string
  default     = "lb"
  description = "Service 为 LoadBalancer 时选择 OCI lb 或 nlb"
  validation {
    condition     = contains(["lb", "nlb"], var.lb_type)
    error_message = "OCI 负载均衡类型必须为 lb 或 nlb。"
  }
}
