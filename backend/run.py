import uvicorn
import os
import sys

# Ensure root workspace directory is in python search path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

if __name__ == "__main__":
    print("Starting AgroVerse AI FastAPI Backend Server...")
    print("APIs available at http://127.0.0.1:8000")
    print("Swagger Docs available at http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
