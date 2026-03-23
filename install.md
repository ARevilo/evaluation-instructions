# Installation

Note: these instructions primarily target a Linux installation (tested with Ubuntu 24.04)

## Prerequisites

These prerequisites are for all sections below

- Node.js installed (tested with v24.14.0) - including npm \
  <https://nodejs.org/en/download>
  - Use the OS/Distro-specific instructions provided from the official download source above
  - Recommended approach for Linux: \
    `v24.14.0` for `Linux` using `nvm` with `npm`

## Development setup

1. Install npm packages: \
   Navigate to the root directory (containing package.json) and run: \
   `npm install`
2. Run the server:
   - via Command-line: `npm run start-dev` \
     - `start-dev` (vs `start`) will also monitor for file changes and hot-reload the server, avoiding the need to restart the server to observe the latest changes
   - via VS-Code UI (optional): in VS-Code you can alternatively select-to-run the scripts form the "NPM Scripts" panel/sidebar
   - To stop the server enter `ctrl + c` into the terminal where it is currently running

## Create a bundled release build (bundle:cjs)

This is required for the production install below

1. In a development environment simply enter: `npm run bundle:cjs` \
   - This will create a minimal `evaluationapp.cjs` file with (production) dependency node modules bundled into it.

     This prevents the need to manually install node modules during production deployment/installation. Additionally this makes Node.js itself the only additional dependency that needs to be managed, and ensures consistency in the deployment result

   - `evaluationapp.cfs` will be added to the `./dist` folder, along with `evaluationapp.service`, and `install.md` (this install guide)

## Production install (linux)

Prerequisite: The `dist` folder (generated from the previous section) must be copied to the destination server

1. ssh to the destination install server
2. Elevate to root if required

   ```bash
   sudo -i
   ```

3. Place the bundled output file in the target installation directory

   ```bash
   install -D ./dist/evaluationapp.cjs /usr/src/evaluationapp/evaluationapp.cjs
   ```

   - This will create any missing parent directories and set executable permissions automatically

   - _If_ you have created a non-root user (not covered) for this application, change the ownership (i.e.):

     ```bash
     chown -R <youruser>: /usr/src/evaluationapp/
     ```

4. Create the systemd service file to run the application

   ```bash
   cp --update=none ./dist/evaluationapp.service /etc/systemd/system/
   ```

   - `--update=none` prevents unintentionally overwriting the service file if previously installed and modified

5. Update any required environment variables
   - Currently only 1 variable is applicable: `PORT` \
     While the code uses `3000` as a default this is overridden in the service file to `5000` as an example
   - Specifying an alternate port can be done by either editing the service file directly, or via an (optional) environment file referenced in the service file

   To update the service file:
   1. Open it for editing: `vi /etc/systemd/system/evaluationapp.service`
   2. Modify `Environment=PORT=5000` to reflect your desired server port (e.g. `Environment=PORT=5001`)
   3. Save and exit the file (e.g. `esc, shift-z, shift-z`)

   To use an environment file:
   1. Open it for editing: `vi /usr/src/evaluationapp/evaluationapp.env`
   2. Enter a key-value pair for the desired port (e.g. `PORT=5001`)
   3. Save and exit the file (e.g. `esc, shift-z, shift-z`)

6. Enter the following commands to enable and start the service:

   ```bash
   systemctl daemon-reload
   systemctl enable evaluationapp.service
   systemctl start evaluationapp.service
   ```

7. Check the service is running via: `systemctl status evaluationapp`
8. Test the API via curl or simply entering the URL into a web browser which can reach this server, i.e. \
   <http://localhost:5000/companies/1> \
   <http://localhost:5000/companies/2> \
   <http://localhost:5000/companies/3>
