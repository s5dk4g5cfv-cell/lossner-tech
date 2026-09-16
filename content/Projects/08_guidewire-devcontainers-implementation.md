---
title: Guidewire DevContainers Implementation
company: Grinnell Mutual Insurance
role: DevOps Engineer
timeline: 2025–Present
status: in-progress
tags:
---
## Guidewire DevContainers Implementation
**Grinnell Mutual Insurance:** ***In Progress***

**Overview**
I’m giving Guidewire developers a consistent, reproducible environment so they can spend less time managing setup and more time working on their applications. The work brings together container tooling, remote IDE access, credentials, databases, and operational procedures into a usable development environment.

The platform uses Docker and IntelliJ Remote Development Server as an alternative to traditional VDI, supporting all four **Guidewire InsuranceSuite** applications: PolicyCenter, ClaimCenter, BillingCenter, and ContactManager. Following a five-month R&D effort with little existing precedent or community guidance, it completed a controlled beta and is progressing toward production deployment later in 2026.

**Contributions to Date**
- **IntelliJ Remote Development Server Discovery** — Resolved a critical technical blocker involving IntelliJ's undocumented plugin architecture for Remote Development Server, discovering that it uses project-specific plugin isolation rather than global plugin directories — behavior for which no public documentation was available at the time.
- **Environment Automation** — Built PowerShell and Bash automation scripts for SSH key management, Git credential handling, and container lifecycle management. Designed application-specific containers with tuned memory configurations (16–24 GB per container) supporting dual Java runtimes (Java 11 for Guidewire, Java 17 for IntelliJ).
- **Infrastructure & Deployment** — Deployed and managed 10 RHEL development servers with a centralized Docker registry for image distribution. Implemented batch deployment orchestration, Samba file sharing for cross-platform access, and Ansible/AWX automation for infrastructure management.
- **Database Integration** — Automated SQL Server and H2 database provisioning within the container lifecycle, including database creation, read-committed snapshot isolation configuration, and IntelliJ data source pre-configuration.
- **Remote Development Enablement** — Configured JetBrains Gateway for seamless remote IntelliJ IDEA access. Consolidated Guidewire plugins from multiple sources (IntelliJ, gwplugins, Studio) into application-specific directories. Tuned IntelliJ VM options and memory settings per application to prevent OOM errors.
- **Security & Compliance** — Integrated Snyk Security for container vulnerability scanning. Secured credential handling with Docker secrets and per-developer isolated credential directories.

**Beta Validation**

A formal evaluation completed by four beta developers over 34 days validated the platform's core performance and reliability goals:

- All respondents connected through IntelliJ in two minutes or less and reported no noticeable lag or degradation.
- All respondents reported first builds and server startups at least 15% faster than VDI, with those improvements remaining consistent.
- Overall performance averaged **8.75/10**, while reliability averaged **9/10**.
- Three of four respondents preferred the DevContainer experience to VDI.
- Three recommended expanding access; the fourth selected “Other,” and no respondent recommended against expansion.

The evaluation also established the priorities for production readiness. Ease of use averaged **7.25/10**, with remaining friction involving IDE feature parity, PCF workflows, source-control tooling, and a small number of configuration and restart issues. These findings now inform the production rollout backlog.

**Status**

- Completed a controlled beta with 8 developers across 10 dedicated RHEL servers; 4 developers completed the formal evaluation.
- Several developers continue using the containers beyond the beta period while production implementation is underway.
- Production rollout is planned for later in 2026 on VMware Cloud Foundation with vSphere Kubernetes Service (VKS).

**Impact**

- Automating the deployment of complex Guidewire development environments and reducing post-provision connection time to under two minutes in the beta evaluation.
- Providing consistent, isolated, reproducible development environments across the team.
- Establishing a foundation for enterprise Kubernetes-based Guidewire development at scale.
