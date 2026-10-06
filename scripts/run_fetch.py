#!/usr/bin/env python3
"""Run fetch_logos.py with the extra safety filters installed. Same arguments as fetch_logos.py."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_logos
import logo_guard

logo_guard.install(fetch_logos)
sys.exit(fetch_logos.main())
