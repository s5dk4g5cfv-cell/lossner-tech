---
title: Guidewire DevContainers Implementation
company: Grinnell Mutual Insurance
role: DevOps Engineer
timeline: In Progress
tags:
---
**Overview**
Currently leading the design and deployment of containerized development environments for **Guidewire InsuranceSuite applications** (PolicyCenter, ClaimCenter, BillingCenter, ContactManager). The initiative replaces traditional manual environment setup with **automated Docker-based containers**, enabling rapid, consistent developer onboarding and improving efficiency for Guidewire projects.

**Contributions to Date**
- **Environment Automation**
    - Built PowerShell scripts for SSH key management and Git credential handling.
    - Designed containers supporting all four InsuranceSuite applications.
- **Database Integration**
    - Automated SQL Server and H2 database creation and connectivity.
    - Integrated database provisioning into the container lifecycle.
- **Remote Development Enablement**
    - Configured **JetBrains Gateway** for seamless remote IntelliJ IDEA access.
    - Tuned IntelliJ VM options and plugin management for optimized performance.
- **Infrastructure & Workflow**
    - Deployed orchestration scripts supporting 10+ RHEL development servers in batch operations.
    - Implemented **Samba file sharing** for cross-platform workflows.
    - Secured credential handling with **Docker secrets**.

**Status**

- Beta deployment with eight developers actively using the environment.
- Expanding support and refinement across additional development teams.

**Anticipated Impact**

- Reducing developer environment setup time from hours to minutes.
- Ensuring **consistency, reproducibility, and scalability** across teams.
- Establishing a foundation for future containerized Guidewire development at scale.