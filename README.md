# Language Learning SQL App

### Summary of the Codebase
This app is a language-learning tool that manages words, definitions, and sets across multiple languages like Spanish and Japanese. It uses Express/Node.js with MariaDB to fetch, paginate, randomly select, and manage relational data through linkage tables. The codebase supports both local and cloud environments, with connection pooling and optional SSH tunneling for secure database access.

---
## Cloud Setup

**Architecture & Components:**

1. **Azure VM**

   * Runs **Ubuntu 22.04**.
   * Hosts **MariaDB** (10.6) with multiple language tables (`spanishtable`, `japanesetable`, etc.).
   * Configured with **NSG rules** to allow secure access only from your Express app and SSH.
   * Database is bound to `127.0.0.1` for security.

2. **Express Server (Node.js / TypeScript)**

   * Communicates with MariaDB using **mysql2/promise**.
   * Supports **paginated queries, random fetches, CRUD operations** for multiple tables.
   * Implements **Linkage Table** logic (`LinakageTableClass`) and Set management (`SetsClass`) for grouping words.
   * Structured to differentiate **dev vs prod environments**.
   * Uses a **connection pool**, with optional SSH tunneling for secure remote database access.

3. **Deployment**

   * Express app can be **deployed locally**, or in future, on **the same Azure VM** (Option 1) or Azure App Services (Option 2).
   * Public IP available for API access via Postman/UI.
   * Environment variables used for configuration, including database credentials and SSH keys.

4. **Security Practices Implemented**

   * DB access restricted via NSG; MySQL is not publicly exposed.
   * Optional **SSH tunnel** support for remote database connections.
   * Separation of **dev vs prod config**.
   * Connection pooling and query logging for performance and monitoring.

---

### Production-level Assessment

**Strengths / Ready-for-Production Features:**

* Multi-environment support (dev/prod).
* Secure database access (bind-address, NSG rules).
* Connection pooling and structured classes for DB interactions.
* Error handling and logging implemented.
* Supports large-scale operations: bulk inserts, paginated queries.

**Limitations / Things to Consider Before Full Production:**

* No formal **authentication layer** on Express endpoints yet — currently any client with the API URL can query.
* Logging is file/console-based; production would benefit from a **centralized log system**.
* Database backups are manual; automation needed for **production-grade reliability**.
* Scalability is limited by single VM; multi-instance deployment would require **load balancing**.
* Environment variables include sensitive info (SSH keys, DB creds); must secure with **secret vaults** in production.

**Overall Assessment:**
The codebase is **“production-ready for a small-scale or internal project”**, but for a high-traffic, multi-user public deployment, some **additional security, scaling, and monitoring measures** would be needed.

---

If you want, I can also make a **1-paragraph version** for a presentation-style note that’s even quicker to digest. Do you want me to do that?
