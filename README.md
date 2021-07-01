# PornJS Backend Scripts

## Requirements

1. NodeJS
2. Database (preferable mariaDB)
    - host
    - username
    - password
    - database
3. FFMPEG and FFPROBE (one of the following) ([more info](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#prerequisites))
    1. Installed to the server and added to path
    2. Installed to the server and added to ENV
    3. Installed to the server in the root folder

## Installation

1. Edit config.json

|   variable    | Details                                  |
| :-----------: | ---------------------------------------- |
|   `db.host`   | The host path for the sql-server         |
| `db.username` | The username for the database            |
| `db.password` | The password for the database            |
| `db.database` | The database name of the chosen database |

2. Import `database.sql` into your database of choice

# Start Scripts

1. Open terminal in this folder
2. Run `npm i` to install the packages
3. Run `node app.js`

## Upgrade Guide

If you installed this script after the previous version, you need to change 1 table in the database folder (to keep your existing database), or import the supplied `database.sql` (to create a new database)

### Keep the database (change the data yourself)

-   Use SQL-scripting (if you're familiar with that)
-   OR
-   Install and use a database management system like PhpMyAdmin

1. Modify the `sites`-table
2. Change `websiteID`-row from `default NULL` `default NONE`
3. Change `websiteID`-row from `NULL=true` to `NULL=false`
