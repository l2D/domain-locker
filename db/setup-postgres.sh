#!/bin/bash

# Exit immediately if any command fails
set -e

# Configuration variables: Use environment variables if set, otherwise use defaults
DB_NAME="${DOMAIN_LOCKER_DB_NAME:-domain_locker}"
DB_USER="${DOMAIN_LOCKER_DB_USER:-postgres}"
DB_PASSWORD="${DOMAIN_LOCKER_DB_PASSWORD:-securepassword}"
DB_HOST="${DOMAIN_LOCKER_DB_HOST:-localhost}"
DB_PORT="${DOMAIN_LOCKER_DB_PORT:-5432}"
SCHEMA_FILE="${SCHEMA_FILE:-schema.sql}"

echo "Setting up PostgreSQL database..."

# Step 1: Check for PostgreSQL connection
echo "Checking PostgreSQL connection to $DB_HOST:$DB_PORT..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null; then
    echo "Error: Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT. Ensure the server is running."
    exit 1
fi

# Step 2: Create the database user (if it doesn't already exist)
echo "Creating database user..."
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;"

# Step 3: Create the database (if it doesn't already exist)
echo "Creating database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
        CREATE DATABASE $DB_NAME OWNER $DB_USER;
    END IF;
END
\$\$;"

# Step 4: Grant privileges to the user
echo "Granting privileges to the user..."
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Step 5: Apply the schema
if [ -f "$SCHEMA_FILE" ]; then
    echo "Applying schema from $SCHEMA_FILE to the database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"
else
    echo "Schema file not found at $SCHEMA_FILE. Skipping schema application."
fi

echo "Database setup complete!"
echo "-----------------------------------------"
echo "Database Name: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "-----------------------------------------"


# If running PostgreSQL locally, ensure that password authentication (md5)
# is enabled in pg_hba.conf, and set a password for the postgres user.
# Restart the PostgreSQL service after making changes.
