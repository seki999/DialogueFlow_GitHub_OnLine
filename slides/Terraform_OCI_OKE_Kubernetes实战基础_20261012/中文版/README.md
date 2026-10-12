# Terraform + OCI OKE + Kubernetes 实战基础：29 章中文课件

沿用上一套长版格式，依据用户提供的教材制作，聚焦云基础设施、集群管理接口、应用运行、云入口和持久存储的相互关系。共 29 组 Markdown 与双人讲解、29 张 Mermaid 图、145 道单选题。按 01–29 连续学习，每章只讲一个主题，最后一章综合回顾。

## 课程目录

- [01 四层技术的职责全图](01.md)
- [02 声明式管理的两种节奏](02.md)
- [03 Provider 与资源地址](03.md)
- [04 Terraform 工程与执行流程](04.md)
- [05 Tenancy、Compartment 与 Namespace](05.md)
- [06 Region、AD 与 Fault Domain](06.md)
- [07 VCN、Subnet 与 Pod 网络模式](07.md)
- [08 Gateway、路由与私有节点出站](08.md)
- [09 Terraform 创建独立 VCN 示例](09.md)
- [10 OKE Cluster 的托管边界与依赖](10.md)
- [11 Node Pool、Compute Instance 与 Node](11.md)
- [12 从云节点到容器执行](12.md)
- [13 kubeconfig、Context 与集群认证](13.md)
- [14 私有与公开 API Endpoint](14.md)
- [15 OCI Provider 与 Kubernetes Provider 的分工](15.md)
- [16 Terraform State、Backend 与真实资源](16.md)
- [17 Plan、Apply、Destroy 与删除范围](17.md)
- [18 Deployment 的云上运行与配置关系](18.md)
- [19 Service、EndpointSlice 与 CoreDNS](19.md)
- [20 LoadBalancer Service 如何创建 OCI LB](20.md)
- [21 OCI LB、NLB 与入口类型选择](21.md)
- [22 Ingress、Controller、Service 与 OCI 入口](22.md)
- [23 OCIR 镜像与私有拉取](23.md)
- [24 ConfigMap、Secret 与云上应用参数](24.md)
- [25 PVC、CSI、PV 与 OCI Block Volume](25.md)
- [26 Terraform 磁盘与 PVC 动态卷的所有权](26.md)
- [27 五种工作负载在 OKE 中的选择](27.md)
- [28 完整实验：已有 OKE 上的 Terraform Nginx](28.md)
- [29 全系统回顾：创建链、访问链与所有权](29.md)

## 文件与实验范围

- 同编号 .md 展示图形、要点和测验，.conversation 负责相应双人讲解。每章 20–24 条发言，最后提醒答题，不播报测验答案。
- terraform/oci-vcn 是完整的独立 VCN 示例，只创建 VCN，不是完整 OKE 网络工程。
- terraform/oke-nginx 是完整的已有集群应用示例，要求已有 OKE 与 Managed Worker Nodes、有效 kubeconfig、明确 Context 和 API 网络路径。
- OKE Cluster 与 Node Pool 的 hcl.txt 文件是关键字段示意，缺少完整变量、网络与区域资源选择，不能直接 apply。
- examples/ YAML 为独立条件性教学示例，不覆盖 Terraform 主实验。需要预先建立 oke-cloud-examples Namespace，并满足各示例单独条件；不能一次性 apply 全目录。
- [实验步骤.md](实验步骤.md) 给出 PowerShell 命令、检查点、可选 LB 扩展和清理范围。[来源与补充说明.md](来源与补充说明.md) 标明补充来源与截断边界。
- 此目录位于 slides/ 下，可供当前播放器识别。不生成 ZIP，按用户后续要求以仓库文件交付。

## 测验与播放器协议

每章 5 题，每题 A–D 四个选项且一个正确答案，全课 145 题。普通 GitHub Markdown 只能手动展开 details 查看答案，不能自动判定点击，也不能强制读者先作答。

QUIZ_DATA_START 与 QUIZ_DATA_END 之间的 HTML 注释包含 JSON，可用 Python json.loads 或 JavaScript JSON.parse 解析。chapter 是两位编号，questions 有 id 1–5、question、options、answer 和 explanation，内容与可见题目一致。

支持该协议的播放器应隐藏初始答案，不预选、不暗示；点击后锁定选择，显示“回答正确”或“回答错误”，标记所选与正确选项，显示正确字母、内容及解析，允许下一题。每题仅提交一次，完成本章后才可提供重新答题；重答应清除全部选择与结果并回到第 1 题。现有播放器没有自动判题实现，本课未修改播放器代码。

满分 5 分，每题 1 分，正确率为得分乘 20%。结果示例为“本章得分：4 / 5”“正确率：80%”。5 分反馈“本章知识掌握得很好”；4 分“整体掌握良好，可以复习答错的知识点”；3 分“已经理解主要内容，建议重新查看本章重点”；0–2 分“建议重新学习本章后再次答题”。

## 输入边界与验证

原文末尾在第 13 章的 OCI LB 扩展段落截断，代码内容也没有保留下来。本课保留有依据的概念，补充工程和命令均为新编写，不声称逐字恢复原文，也不声称已从零部署完整 OKE。

示例使用 nginx:1.28 与 busybox:1.37 的固定教学标签，不表示最新或生产推荐版本。Terraform 和 Provider 采用约束，并提供本地验证生成的锁文件：OCI 7.32.0、Kubernetes 2.38.0。课程不包含真实 OCID、Token、私钥、State 或计划文件。

本次制作不运行 plan、apply、destroy、kubectl 集群操作或 OCI CLI 操作，不创建收费云资源。实际执行的本地检查见 [验证记录.md](验证记录.md)；静态检查不能替代使用者环境中的权限、网络、区域版本、镜像拉取与实际业务验证。
