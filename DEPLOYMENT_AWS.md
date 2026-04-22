# AWS Deployment Guide: Logicapt Analytics Portal

This document provides a technical blueprint for AWS developers to migrate and host the Logicapt Analytics Portal on AWS infrastructure.

---

## 1. Architecture Overview
The application is a full-stack specialized analytical platform built with:
- **Frontend**: React 18 + Vite (SPA)
- **Backend**: Node.js Express server
- **Database**: SQLite (currently `portal.db`)
- **AI Engine**: Google Gemini API
- **Storage**: Pluggable (Local or AWS S3)

---

## 2. Environment Variables
Ensure the following variables are configured in your AWS environment (App Runner, Elastic Beanstalk, or EC2):

| Variable | Description |
| :--- | :--- |
| `NODE_ENV` | Set to `production`. |
| `JWT_SECRET` | A strong, random string for signing authentication tokens. |
| `GEMINI_API_KEY` | Your Google Gemini API key for analytical processing. |
| `STORAGE_PROVIDER` | Set to `s3` to enable AWS S3 storage, or `local` for disk storage. |
| `AWS_REGION` | e.g., `us-east-1` (Required if using S3). |
| `AWS_S3_BUCKET` | The name of your S3 bucket for project document storage. |
| `AWS_ACCESS_KEY_ID` | IAM User Access Key (Omit if using IAM Roles). |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret Key (Omit if using IAM Roles). |

---

## 3. Database Migration
The app currently uses a local SQLite file (`portal.db`). For AWS deployment, choose one of two paths:

### Option A: Persistence (Recommended for Small/Medium Tiers)
- Host on **EC2** or **Elastic Beanstalk**.
- Map the `portal.db` file to an **Amazon EBS Volume** to ensure data persists through deployments and restarts.

### Option B: Scalability (Enterprise Level)
- Migrate to **Amazon RDS (PostgreSQL/MySQL)**.
- *Note*: This will require updating the `src/lib/db.ts` file to use an appropriate client like `pg` or `mysql2` and updating the schema initialization logic.

---

## 4. File Storage Integration (S3)
The application includes a built-in `S3StorageProvider`. To activate it for AWS:

1. **Configuration**: Set the environment variable `STORAGE_PROVIDER=s3`.
2. **Permissions**: Ensure the AWS environment (or IAM Role) has `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions for the specified bucket.
3. **CORS**: Configure S3 Bucket CORS if direct browser-to-S3 interaction is required (though currently handled via signed URLs in the backend).

---

## 5. Deployment Options

### Recommended: Amazon App Runner
- **Source**: Directly from GitHub or ECR Container.
- **Port**: Configure to listen on port `3000`.
- **Runtime**: Node.js 18.x or 20.x.
- **Auto-Scaling**: Enabled by default.

### Alternative: AWS Elastic Beanstalk (Node.js Platform)
1. Run `npm run build` locally or in CI/CD.
2. Ensure the `dist/` folder and `server.ts` (compiled or used with `tsx`) are in the deployment package.
3. Update `package.json` start script: `"start": "NODE_ENV=production node server.ts"`.

---

## 6. Networking & Security
- **Domain/SSL**: Use **AWS Certificate Manager (ACM)** with an **Application Load Balancer (ALB)** or App Runner's built-in custom domain support to enforce HTTPS.
- **VPC**: Place the application in a private subnet with an internet gateway (or NAT) for outgoing API calls to Gemini.
- **Secrets**: Use **AWS Secrets Manager** to store `JWT_SECRET` and `GEMINI_API_KEY` rather than plain environment variables.

---

## 7. Migration Checklist
- [ ] Build the frontend: `npm run build`.
- [ ] Verify `dist/` directory exists.
- [ ] Set `STORAGE_PROVIDER=s3` in environment variables.
- [ ] Provision S3 bucket and RDS/EBS for database.
- [ ] Inject environment variables.
- [ ] Perform a test login with the seeded `admin / admin123` credentials.

---
**Technical Support Note**: This portal handles sensitive patent and research documents. Ensure that S3 buckets are NOT public and all data in transit is encrypted via TLS 1.2+.
