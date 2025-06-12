import mysql.connector
import os

# Load environment variables
db_user = os.environ.get('DB_USER')
db_password = os.environ.get('DB_PASSWORD')
db_host = os.environ.get('DB_HOST')
db_name = os.environ.get('DB_NAME')

# Database connection configuration
config = {
    'user': db_user,
    'password': db_password,
    'host': db_host,
    'database': db_name,
    'raise_on_warnings': True
}

try:
    # Establish database connection
    cnx = mysql.connector.connect(**config)
    cursor = cnx.cursor()

    # Read the SQL schema from the file
    with open('database/database.sql', 'r') as f:
        sql_script = f.read()

    # Execute the SQL script
    for statement in sql_script.split(';'):
        if statement.strip():
            cursor.execute(statement)

    # Commit the changes
    cnx.commit()
    print("Schema applied successfully.")

except mysql.connector.Error as err:
    print(f"Error: {err}")

finally:
    # Close the cursor and connection
    if cursor:
        cursor.close()
    if cnx:
        cnx.close()
