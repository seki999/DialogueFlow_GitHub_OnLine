locals {
  app_labels = { app = "oke-nginx" }
}
resource "kubernetes_namespace_v1" "demo" {
  metadata {
    name = var.namespace
  }
}
resource "kubernetes_config_map_v1" "page" {
  metadata {
    name      = "nginx-page"
    namespace = kubernetes_namespace_v1.demo.metadata[0].name
  }
  data = {
    "index.html" = <<-HTML
      <!doctype html>
      <html lang="zh-CN">
      <meta charset="utf-8">
      <title>Terraform + OCI OKE 学习实验</title>
      <h1>Terraform + OCI OKE + Kubernetes</h1>
      <p>网页来自 ConfigMap，Nginx 运行在已有 OKE 中。</p>
      <p>Terraform 提交声明，Kubernetes 维护副本，Service 提供访问入口。</p>
      </html>
    HTML
  }
}
resource "kubernetes_deployment_v1" "web" {
  metadata {
    name      = "oke-nginx"
    namespace = kubernetes_namespace_v1.demo.metadata[0].name
    labels    = local.app_labels
  }
  spec {
    replicas = var.replicas
    selector {
      match_labels = local.app_labels
    }
    template {
      metadata {
        labels = local.app_labels
      }
      spec {
        container {
          name  = "web"
          image = var.image
          port {
            container_port = 80
          }
          readiness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 2
            period_seconds        = 3
          }
          volume_mount {
            name       = "page"
            mount_path = "/usr/share/nginx/html"
            read_only  = true
          }
        }
        volume {
          name = "page"
          config_map {
            name = kubernetes_config_map_v1.page.metadata[0].name
          }
        }
      }
    }
  }
}
resource "kubernetes_service_v1" "web" {
  metadata {
    name      = "oke-nginx"
    namespace = kubernetes_namespace_v1.demo.metadata[0].name
    annotations = var.service_type == "LoadBalancer" ? {
      "oci.oraclecloud.com/load-balancer-type" = var.lb_type
    } : {}
  }
  spec {
    selector = local.app_labels
    type     = var.service_type
    port {
      port        = 80
      target_port = 80
      protocol    = "TCP"
    }
  }
}
