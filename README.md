# Bure Card - Clinic Management System

Bure Card is an internal company clinic management system designed to track the end-to-end patient journey for staff members and their dependents. It manages visits, lab queues, prescriptions, inventory, and credit-based billing with automatic salary deductions.

## Key Features
- **Role-Based Dashboards**: Tailored workflows for Receptionists, Nurses, Doctors, Lab Technicians, Pharmacists, Cashiers, and Admins.
- **Workflow Management**: Tracks patients from check-in through consultation, labs, pharmacy, and billing.
- **Credit-Based Billing**: Automatic discount application and credit charging tied to staff employee IDs.
- **Inventory Tracking**: FEFO (First Expired, First Out) digital stock management for the pharmacy.

## Tech Stack
- Next.js (App Router)
- React
- Prisma ORM
- Tailwind CSS

## Getting Started Locally

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Docker Setup (Linux)

For hosting the app on the clinic's local server (e.g., HP desktop), we use a self-contained Docker environment that ensures reliability and easy updates.

### 1. First Time Setup

Clone the repository to the server (e.g. `/opt/clinic`) and run the start script:

```bash
chmod +x start.sh
./start.sh
```

**What this script does:**
- Creates necessary directories (`logs/`, `run/`, `backups/`).
- Copies `.env.example` to `.env` (you will be prompted to edit it and add secure passwords).
- Checks Docker installation and network setup.
- Installs the systemd path unit for the "Admin Update Button".
- Builds and starts the database and app containers.
- Waits for healthchecks to pass and displays the LAN IP address to access the app.

*(After the containers are healthy, visit `http://<LAN_IP>:3000/api/seed-db` in your browser to seed initial accounts.)*

### 2. Updating the System

There are three ways to update the system when new code is pushed to GitHub:

**Method A: In-App Admin Button (Recommended)**
Admin users can click the "Update System" button in the app. This writes a flag file to `/run/updater/update.request`. A host-side systemd watcher (`clinic-update.path`) detects this and securely triggers `update.sh` on the host, preventing the need to expose the Docker socket to the container.

**Method B: Quick Zero-Downtime Update (CLI)**
Run this command on the server to update the app only (skips database restart):
```bash
./start.sh --quick
```
This automatically backs up the database, builds the new app image in the background, swaps the containers, and **automatically rolls back** to the previous image if the new one fails healthchecks.

**Method C: Full Restart Update (CLI)**
```bash
./start.sh
```
This performs a `git pull`, backs up the database, rebuilds images, and runs a full restart.

### 3. Database Management (Prisma)

The database schema automatically updates via Prisma migrations when the app container starts in Docker. 

**Manual Local Reset (Dev Only)**
If running locally (not in Docker production) and you need to push schema changes directly:
```bash
npx prisma db push --accept-data-loss
```

### 4. Backups

The system automatically performs database backups:
- Before any CLI update (`./start.sh --quick` or full).
- Before any Admin UI triggered update (`update.sh`).
- It is highly recommended to add a cron job for nightly backups.

Backups are saved as gzipped SQL files in the `backups/` folder.
