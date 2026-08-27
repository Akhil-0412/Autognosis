import os
import sys

# Add ai_backend to the Python path so imports inside ai_backend work
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai_backend"))

from main import app
