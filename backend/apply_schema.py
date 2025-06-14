import mysql.connector
import os

# Database connection details (replace with your actual details)
DB_CONFIG = {
    'user': 'your_db_user',
    'password': 'your_db_password',
    'host': 'localhost',
    'database': 'pos_system'
}

def apply_schema(schema_file):
    """Applies the SQL schema from the specified file to the database."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        with open(schema_file, 'r') as f:
            sql_script = f.read()

        # Execute each statement in the script
        for statement in sql_script.split(';'):
            if statement.strip():
                cursor.execute(statement)

        conn.commit()
        print(f"Schema from {schema_file} applied successfully.")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        conn.rollback()
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    schema_file_path = '../database/database.sql' # Path relative to backend directory
    if os.path.exists(schema_file_path):
        apply_schema(schema_file_path)
    else:
        print(f"Error: Schema file not found at {schema_file_path}")
