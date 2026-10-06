# Bure Clinic — Windows Server Installation Guide

Complete step-by-step guide for setting up the clinic server from a **fresh Windows 10/11 PC**.  
Follow every section in order. Skipping one will break something.

---

## What gets installed and why

| Software | Why it's needed | Without it |
|---|---|---|
| **WSL 2** | Docker Desktop's engine runs inside it | Docker won't install |
| **Docker Desktop** | Runs the app + PostgreSQL as containers | Nothing works |
| **Git for Windows** | Clones the repo, pulls updates, provides `gzip` for backups | `git pull` fails, backups fail |
| **Windows Task Scheduler** *(built-in)* | Watches for the update-request flag file | "Update" button does nothing |
| **PowerShell 5+** *(built-in)* | Used by the installer scripts | Task Scheduler setup fails |

> **That's it.** No Node.js, no Python, no database tools — the app and Postgres both run inside Docker.

---

## 1. Hardware check

Before starting, confirm:

- [ ] At least **8 GB RAM** (4 GB for the app + DB, 4 GB for Windows + Docker overhead)
- [ ] At least **20 GB free disk** on the system drive (C:)
- [ ] The PC is connected to the **clinic LAN** by Ethernet cable (not Wi-Fi — Wi-Fi IPs change and are slower)
- [ ] **Virtualization is enabled** in BIOS (called VT-x, AMD-V, or SVM depending on CPU)

> **How to check virtualization:** Open Task Manager → Performance → CPU. Look for "Virtualization: Enabled". If it says Disabled, reboot, enter BIOS (usually Del or F2), and enable it.

---

## 2. Install WSL 2

Docker Desktop on Windows requires WSL 2 (Windows Subsystem for Linux).

1. Open **PowerShell as Administrator**:  
   Press `Win`, type `powershell`, right-click → **Run as administrator**

2. Run:
   ```powershell
   wsl --install
   ```

3. **Restart the PC** when prompted.

4. After restart, a Ubuntu terminal window will open and finish setup.  
   Create a Linux username and password when asked (anything — these are only for WSL, not the clinic app).

5. Verify:
   ```powershell
   wsl --status
   ```
   Should show `Default Version: 2`.

> **If `wsl --install` doesn't work** (older Windows 10 build):  
> Go to **Settings → Update & Security → Windows Update** and install all updates first, then retry.

---

## 3. Install Docker Desktop

1. Download from: **https://www.docker.com/products/docker-desktop/**  
   Click **"Download for Windows"**

2. Run the installer (`Docker Desktop Installer.exe`)
   - ✅ Keep "Use WSL 2 instead of Hyper-V" checked
   - ✅ Keep "Add shortcut to desktop" checked

3. **Restart the PC** when the installer asks.

4. After restart, Docker Desktop opens automatically. Wait for the whale icon in the taskbar to stop animating — it's ready when it shows **"Docker Desktop is running"**.

5. Verify in a new Command Prompt:
   ```bat
   docker --version
   docker compose version
   ```
   Both must print a version number (not an error).

> **First-time Docker agreement:** Accept the terms when Docker Desktop asks.

---

## 4. Install Git for Windows

Git does three things here: clones the repo, pulls updates, and supplies **gzip** (needed for compressed DB backups).

1. Download from: **https://git-scm.com/download/win**  
   Click **"Click here to download"** (64-bit)

2. Run the installer. On each screen, **keep all defaults** except:
   - "Choosing the default editor" → pick **Notepad** (easiest)
   - "Adjusting your PATH environment" → select **"Git from the command line and also from 3rd-party software"** ✅

3. Complete the install. Verify in a new Command Prompt:
   ```bat
   git --version
   ```

4. Set your Git identity (replace with real values — these appear in the update log):
   ```bat
   git config --global user.name "Clinic Admin"
   git config --global user.email "admin@clinic.local"
   ```

---

## 5. Clone the repository

Open **Command Prompt** (not PowerShell — the `.bat` files are written for `cmd`):

```bat
git clone https://github.com/YOUR-ORG/YOUR-REPO.git C:\clinic
```

> Replace the URL with your real repository URL.  
> `C:\clinic` is the recommended location — short path, easy to find.

---

## 6. Run the first-time setup

1. Open File Explorer and navigate to `C:\clinic`
2. Double-click **`START.bat`**
3. If Windows shows a blue "Windows protected your PC" SmartScreen warning:
   - Click **"More info"**
   - Click **"Run anyway"**

**What happens:**
- Checks Docker is running
- Creates the `run\` and `backups\` folders
- If `.env` doesn't exist, copies `.env.example` and opens it in **Notepad**

4. **Fill in `.env` in Notepad** (this is the most important step):

   ```env
   APP_PORT=3000
   BETTER_AUTH_SECRET=          ← paste a long random string here
   DB_USER=clinic_user
   DB_PASSWORD=                 ← paste a different long random string here
   DB_NAME=clinic_db
   DATABASE_URL=postgresql://clinic_user:YOUR_PASSWORD@db:5432/clinic_db?schema=public
   ```

   > **Generate random secrets:** Go to https://generate-secret.vercel.app/64 and copy the result for each secret field. Use different values for `BETTER_AUTH_SECRET` and `DB_PASSWORD`.  
   > **Important:** `DATABASE_URL` must use the **same password** as `DB_PASSWORD`, and the host must be `db` (not `localhost`).

5. Save the file in Notepad (`Ctrl+S`), then close Notepad.
6. Press any key in the `START.bat` window to continue.

**The script then:**
- Installs the **ClinicUpdater** Task Scheduler task
- Runs `docker compose up -d --build` (first build takes **3–6 minutes**)
- Waits for the app to pass its health check
- Prints the clinic URL

At the end you should see:
```
  =====================================================
    Open this address on any PC in the clinic:

      http://192.168.1.XX:3000

  =====================================================
  Status: ONLINE
```

7. **Seed the database with initial admin accounts**:
   Open a browser on the server and navigate to:
   `http://localhost:3000/api/seed-db`
   This will create the default roles and an admin user (password: `password123`) so you can log in.

---

## 7. Set a static IP (run once, as Administrator)

Without this, the server's IP can change after a reboot and all client bookmarks break.

1. In File Explorer, go to `C:\clinic\deploy\`
2. Right-click **`static-ip.bat`** → **"Run as administrator"**
3. Confirm the detected settings when prompted
4. Note the IP address printed at the end — that's the permanent clinic URL

> **Simpler alternative (no script needed):**  
> Log into your **router admin page** (usually http://192.168.1.1).  
> Find the server's MAC address in the connected devices list.  
> Set a **DHCP reservation** to always assign it the same IP.  
> No changes needed on the PC itself.

---

## 8. Configure auto-start on boot

So the clinic app starts automatically after every power cut or reboot:

### Step A — Add START.bat to Windows startup folder

1. Press `Win + R`, type `shell:startup`, press Enter
2. In the folder that opens, right-click → **New → Shortcut**
3. Browse to `C:\clinic\START.bat`
4. Name the shortcut **"Bure Clinic"**

Now `START.bat` runs every time Windows starts.

### Step B — Set BIOS to power on after power loss

1. Restart the PC and enter BIOS (press **Del**, **F2**, or **F10** during the POST screen — it depends on the motherboard)
2. Find a setting called:
   - "Restore on AC Power Loss" → set to **"Power On"**
   - or "AC Power Recovery" → set to **"Last State"** or **"On"**
3. Save and exit BIOS

This makes the server start automatically after a power cut, without anyone needing to press the power button.

### Step C — Configure Windows auto-login *(optional but recommended)*

Without auto-login, the startup shortcut in Step A won't run until someone logs in.

1. Press `Win + R`, type `netplwiz`, press Enter
2. Select the clinic user account
3. **Uncheck** "Users must enter a user name and password to use this computer"
4. Click OK, enter the password when prompted
5. Restart to verify it auto-logs in

> **Security note:** Auto-login is fine for a dedicated server that sits in a locked room. If staff can physically access it, disable auto-login and just press Enter once to log in after a reboot.

---

## 9. Allow port 3000 through Windows Firewall

Client PCs won't be able to reach the app if the firewall blocks port 3000.

1. Open **Windows Defender Firewall with Advanced Security**:  
   Press `Win`, search for "Windows Defender Firewall", open **Advanced Security**

2. Click **Inbound Rules** → **New Rule…**

3. Settings:
   - Rule type: **Port**
   - Protocol: **TCP**
   - Specific local port: **3000**
   - Action: **Allow the connection**
   - Profile: check **Private** only (not Public)
   - Name: **Clinic App**

4. Click Finish

> Alternatively, run this in an **Administrator** Command Prompt:
> ```bat
> netsh advfirewall firewall add rule name="Clinic App" protocol=TCP dir=in localport=3000 action=allow profile=private
> ```

---

## 10. Verify everything works

Run through this checklist after setup:

- [ ] On the server, open a browser and go to `http://localhost:3000` — the login page loads
- [ ] On a client PC, open a browser and go to `http://<server-ip>:3000` — the login page loads
- [ ] Log in with the admin account — dashboard loads
- [ ] Go to Admin → System Update → click "Pull Latest Updates"
   - The button enters "Requesting update..." state
   - Within ~1 minute, the log pane shows `[1/5] Backing up database...` then each step
   - The app restarts and comes back online
- [ ] Check `C:\clinic\backups\` — a `.sql.gz` or `.sql` file should be there
- [ ] On a client PC, try `http://<server-ip>:5432` in a browser — it should time out (Postgres is NOT exposed)
- [ ] Restart the server PC — the app should start automatically without anyone logging in

---

## 11. Troubleshooting

### Docker Desktop won't start
- Make sure WSL 2 is installed: open PowerShell and run `wsl --status`
- If it shows Version 1, run: `wsl --set-default-version 2`
- Restart the PC

### `START.bat` says "Docker Desktop is not running"
- Look for the Docker whale icon in the system tray (bottom-right, click the `^` arrow)
- If not there, open Docker Desktop from the Start menu and wait ~30 seconds
- Then double-click `START.bat` again

### Port 3000 unreachable from client PCs
- Confirm the firewall rule from Step 9 exists
- Run `netstat -an | findstr :3000` on the server — you should see `LISTENING`
- Make sure client PCs are on the **same network** (same router)

### "Update" button does nothing after 1 minute
- Open Task Scheduler (`taskschd.msc`) and check **ClinicUpdater** exists under "Task Scheduler Library"
- If missing, run `deploy\install-watcher.bat` as Administrator
- View the watcher log: open `C:\clinic\run\watcher.log`

### App won't connect to database
- Check `.env` has `DATABASE_URL` with host `db` (not `localhost`)
- Run: `docker compose logs db` — look for errors
- Run: `docker compose ps` — both `app` and `db` should show `healthy`

### `git pull` fails during update (authentication error)
- If the repo is private, configure Git credentials:
  ```bat
  git config --global credential.helper manager
  ```
  Then run `git pull` manually once in `C:\clinic` — Windows will prompt for your GitHub username and password/token. It saves them for future automated pulls.

---

## 12. Daily maintenance (nothing required)

| Task | How often | How |
|---|---|---|
| Database backup | Automatic on every update | `C:\clinic\backups\` |
| Manual backup | Before any major change | Admin panel → Backup button |
| Pull updates | When new features are ready | Admin panel → System Update |
| Check logs | If something seems wrong | `docker compose logs app` in `C:\clinic` |
| Restart app only | After config changes | `docker compose restart app` in `C:\clinic` |

> **Tip:** Keep a USB drive with a copy of `C:\clinic\backups\` updated weekly. A backup on the same disk doesn't survive disk failure.
