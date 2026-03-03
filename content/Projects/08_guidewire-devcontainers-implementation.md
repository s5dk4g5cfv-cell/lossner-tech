---
title: Guidewire DevContainers Implementation
company: Grinnell Mutual Insurance
role: DevOps Engineer
timeline: "2025"
status: in-progress
tags:
---
## Guidewire DevContainers Implementation
**Grinnell Mutual Insurance:** ***In Progress***

**Overview**
Leading the design and deployment of the first known successful containerization of **Guidewire InsuranceSuite** development environments using Docker and IntelliJ Remote Development Server. The initiative replaces traditional VDI-based developer setups with automated, reproducible DevContainers for all four InsuranceSuite applications (PolicyCenter, ClaimCenter, BillingCenter, ContactManager), representing approximately 690 hours of R&D across five months with zero existing precedent or community resources to draw from.

**Contributions to Date**
- **IntelliJ Remote Development Server Discovery** — Resolved a critical 60-hour technical breakthrough involving IntelliJ's undocumented plugin architecture for Remote Development Server, discovering that it uses project-specific plugin isolation rather than global plugin directories — knowledge with zero public documentation available at the time.
- **Environment Automation** — Built PowerShell and Bash automation scripts for SSH key management, Git credential handling, and container lifecycle management. Designed application-specific containers with tuned memory configurations (16–24 GB per container) supporting dual Java runtimes (Java 11 for Guidewire, Java 17 for IntelliJ).
- **Infrastructure & Deployment** — Deployed and managed 10 RHEL development servers with a centralized Docker registry for image distribution. Implemented batch deployment orchestration, Samba file sharing for cross-platform access, and Ansible/AWX automation for infrastructure management.
- **Database Integration** — Automated SQL Server and H2 database provisioning within the container lifecycle, including database creation, read-committed snapshot isolation configuration, and IntelliJ data source pre-configuration.
- **Remote Development Enablement** — Configured JetBrains Gateway for seamless remote IntelliJ IDEA access. Consolidated Guidewire plugins from multiple sources (IntelliJ, gwplugins, Studio) into application-specific directories. Tuned IntelliJ VM options and memory settings per application to prevent OOM errors.
- **Security & Compliance** — Integrated Snyk Security for container vulnerability scanning. Secured credential handling with Docker secrets and per-developer isolated credential directories.

**Status**

- Beta deployment with 8 developers completed successfully across 10 dedicated RHEL servers.
- Several developers have opted to continue using the containers beyond the beta period and will do so until the production project is complete.
- Now entering official production project phase — beginning implementation into VMware Cloud Foundation with vSphere Kubernetes Service (VKS).

**Impact**

- Reducing developer environment setup from hours of manual configuration to automated container deployment.
- Providing consistent, isolated, reproducible development environments across the team.
- Establishing a foundation for enterprise Kubernetes-based Guidewire development at scale.