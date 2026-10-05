import os
import sys

# Tests import the ML modules the same way the analytics service runs them (from this folder).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
